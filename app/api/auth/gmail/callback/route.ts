import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCode, encryptToken } from '@/lib/import/oauth'

/**
 * GET /api/auth/gmail/callback
 *
 * Handle the Google OAuth callback.
 * Validates state, exchanges code for tokens, stores refresh_token in httpOnly cookie.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // User denied the OAuth consent
    if (error) {
      return NextResponse.redirect(
        new URL('/import?error=access_denied', request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/import?error=invalid_request', request.url)
      )
    }

    const cookieStore = await cookies()
    const savedState = cookieStore.get('gmail_oauth_state')?.value
    const verifier = cookieStore.get('gmail_pkce_verifier')?.value

    // Validate state parameter (CSRF protection)
    if (!savedState || state !== savedState) {
      return NextResponse.json(
        { error: 'Invalid state parameter — possible CSRF attack' },
        { status: 400 }
      )
    }

    if (!verifier) {
      return NextResponse.redirect(
        new URL('/import?error=session_expired', request.url)
      )
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCode(code, verifier)

    if (!tokens.refresh_token) {
      // This shouldn't happen since we use prompt=consent + access_type=offline
      console.error('[gmail-oauth] No refresh_token returned — prompt=consent may not have been shown')
      return NextResponse.redirect(
        new URL('/import?error=no_refresh_token', request.url)
      )
    }

    // Encrypt and store the refresh_token in an httpOnly cookie
    const encryptedRefresh = encryptToken(tokens.refresh_token)

    cookieStore.set('gmail_refresh', encryptedRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    // Clear OAuth flow cookies
    cookieStore.delete('gmail_pkce_verifier')
    cookieStore.delete('gmail_oauth_state')

    // Also set a non-httpOnly flag so the client knows it's connected
    cookieStore.set('gmail_connected', 'true', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })

    return NextResponse.redirect(new URL('/import?connected=true', request.url))
  } catch (error) {
    console.error('[gmail-oauth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/import?error=callback_failed', request.url)
    )
  }
}
