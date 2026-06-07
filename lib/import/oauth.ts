import { OAuth2Client } from 'googleapis-common'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

// ── PKCE ────────────────────────────────────────────────────────────

/**
 * Generate a PKCE code_verifier (128 bytes → base64url).
 */
export function generatePKCEVerifier(): string {
  const bytes = new Uint8Array(128)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

/**
 * Generate a PKCE code_challenge from a verifier (SHA-256 → base64url).
 */
export async function generatePKCEChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64url(new Uint8Array(digest))
}

/**
 * Generate an OAuth state parameter (uuid v4).
 */
export function generateState(): string {
  return uuidv4()
}

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── OAuth2 Client ────────────────────────────────────────────────────

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

/**
 * Build the Google OAuth consent URL.
 */
export function buildAuthUrl(verifier: string, challenge: string, state: string): string {
  const oauth = new OAuth2Client(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  )

  return oauth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256' as any,
  })
}

/**
 * Exchange an authorization code for tokens (server-side).
 */
export async function exchangeCode(code: string, verifier: string): Promise<{
  access_token: string
  refresh_token: string | null
  expiry_date: number | null
}> {
  const oauth = new OAuth2Client(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  )

  const { tokens } = await oauth.getToken({
    code,
    codeVerifier: verifier,
  })

  return {
    access_token: tokens.access_token ?? '',
    refresh_token: tokens.refresh_token ?? null,
    expiry_date: tokens.expiry_date ?? null,
  }
}

/**
 * Get an authenticated OAuth2Client by reading the refresh_token from an httpOnly cookie.
 * If the access_token is expired, the client auto-refreshes on next API call.
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client | null> {
  const cookieStore = await cookies()
  const encryptedRefresh = cookieStore.get('gmail_refresh')?.value

  if (!encryptedRefresh) return null

  // Decrypt the refresh token
  const refreshToken = decryptToken(encryptedRefresh)
  if (!refreshToken) return null

  const oauth = new OAuth2Client(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`
  )

  oauth.setCredentials({ refresh_token: refreshToken })

  return oauth
}

/**
 * Revoke a Google OAuth refresh token.
 */
export async function revokeToken(refreshToken: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    return response.ok
  } catch {
    return false
  }
}

// ── Token Encryption ─────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key || key.length < 16) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be set and at least 16 chars')
  }
  // Derive 32 bytes from the key
  const encoder = new TextEncoder()
  const keyBytes = encoder.encode(key)
  const derived = new Uint8Array(32)
  for (let i = 0; i < 32; i++) {
    derived[i] = keyBytes[i % keyBytes.length]! ^ (keyBytes[(i + 7) % keyBytes.length]! << 1)
  }
  return Buffer.from(derived)
}

/**
 * Encrypt a refresh token for cookie storage.
 * Returns base64( iv + ciphertext + authTag ).
 */
export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  // Prepend IV: iv (16 bytes) + encrypted (base64)
  return iv.toString('base64') + ':' + encrypted + ':' + cipher.getAuthTag().toString('base64')
}

/**
 * Decrypt a refresh token from cookie storage.
 */
export function decryptToken(encrypted: string): string | null {
  try {
    const parts = encrypted.split(':')
    if (parts.length !== 3) return null

    const [ivB64, ciphertext, authTagB64] = parts
    const iv = Buffer.from(ivB64!, 'base64')
    const authTag = Buffer.from(authTagB64!, 'base64')

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext!, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return null
  }
}
