import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { OAuth2Client } from 'googleapis-common'
import { getAuthenticatedClient, revokeToken } from '@/lib/import/oauth'

/**
 * POST /api/gmail/disconnect
 *
 * Revoke the Gmail OAuth token and clear session cookies.
 * Imported transactions in localStorage are preserved.
 */
export async function POST() {
  try {
    const client = await getAuthenticatedClient()

    if (client && client instanceof OAuth2Client) {
      // Attempt to revoke the refresh token
      const credentials = client.credentials
      if (credentials.refresh_token) {
        await revokeToken(credentials.refresh_token)
      }
    }

    const cookieStore = await cookies()

    // Clear all Gmail-related cookies
    cookieStore.delete('gmail_refresh')
    cookieStore.delete('gmail_connected')
    cookieStore.delete('gmail_pkce_verifier')
    cookieStore.delete('gmail_oauth_state')

    return NextResponse.json({ disconnected: true })
  } catch (error) {
    console.error('[gmail-disconnect] Error:', error)

    // Even if revoke fails, clear cookies so the user can re-auth
    try {
      const cookieStore = await cookies()
      cookieStore.delete('gmail_refresh')
      cookieStore.delete('gmail_connected')
    } catch {
      // ignore cleanup errors — we already reported the main error
    }

    return NextResponse.json({ disconnected: true, partial: true })
  }
}
