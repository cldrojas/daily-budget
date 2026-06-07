import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generatePKCEVerifier, generatePKCEChallenge, generateState, buildAuthUrl } from '@/lib/import/oauth'

/**
 * GET /api/auth/gmail
 *
 * Initiate the Google OAuth 2.0 PKCE flow.
 * Generates PKCE challenge + state, stores in session cookies, and redirects to Google.
 */
export async function GET() {
  try {
    const verifier = generatePKCEVerifier()
    const challenge = await generatePKCEChallenge(verifier)
    const state = generateState()

    const cookieStore = await cookies()

    // Store PKCE verifier and state in httpOnly cookies for callback validation
    cookieStore.set('gmail_pkce_verifier', verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/gmail/callback',
      maxAge: 60 * 5, // 5 minutes
    })

    cookieStore.set('gmail_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/gmail/callback',
      maxAge: 60 * 5, // 5 minutes
    })

    const authUrl = buildAuthUrl(verifier, challenge, state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[gmail-oauth] Failed to initiate OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Gmail OAuth' },
      { status: 500 }
    )
  }
}
