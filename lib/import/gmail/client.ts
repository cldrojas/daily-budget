import { gmail_v1, gmail } from '@googleapis/gmail'
import { OAuth2Client } from 'googleapis-common'

export type RawEmailHeaders = {
  id: string
  threadId: string
  from: string
  subject: string
  snippet: string
}

export type RawEmail = RawEmailHeaders & {
  body: string
}

/**
 * Exponential backoff configuration.
 */
const BACKOFF_CONFIG = {
  initialDelay: 1000,    // 1 second
  maxDelay: 30000,       // 30 seconds
  maxRetries: 3,
  factor: 2,
}

/**
 * Sleeper utility for tests (can be mocked).
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * GmailClient — thin wrapper around the Gmail API.
 */
export class GmailClient {
  private api: gmail_v1.Gmail

  constructor(private auth: OAuth2Client) {
    this.api = gmail({ version: 'v1', auth })
  }

  /**
   * List messages matching a query.
   * Returns minimal headers (id, threadId, snippet, from, subject).
   */
  async listMessages(
    query: string,
    maxResults: number = 50,
  ): Promise<RawEmailHeaders[]> {
    let pageToken: string | undefined
    const allMessages: { id: string; threadId: string }[] = []

    while (allMessages.length < maxResults) {
      const response =
        await this.withRetry(() =>
          this.api.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: Math.min(500, maxResults - allMessages.length),
            pageToken,
          })
        )

      const messages = response.data.messages ?? []
      for (const msg of messages) {
        if (msg.id && msg.threadId) {
          allMessages.push({ id: msg.id, threadId: msg.threadId })
        }
      }

      pageToken = response.data.nextPageToken ?? undefined
      if (!pageToken) break
    }

    // Fetch headers for each message
    const headers: RawEmailHeaders[] = []
    for (const msg of allMessages) {
      try {
        const full = await this.getMessage(msg.id)
        headers.push({
          id: full.id,
          threadId: full.threadId,
          from: full.from,
          subject: full.subject,
          snippet: full.snippet,
        })
      } catch (err) {
        console.error(`[gmail-client] Failed to get message ${msg.id}:`, err)
        // Continue with other messages
      }
    }

    return headers
  }

  /**
   * Get a single message by ID with full body.
   */
  async getMessage(id: string): Promise<RawEmail> {
    const response =
      await this.withRetry(() =>
        this.api.users.messages.get({
          userId: 'me',
          id,
          format: 'full',
        })
      )

    const payload = response.data.payload
    const headers = extractHeaders(payload?.headers ?? [])
    const body = extractBody(payload)

    return {
      id: response.data.id ?? id,
      threadId: response.data.threadId ?? '',
      from: headers.from ?? '',
      subject: headers.subject ?? '',
      snippet: response.data.snippet ?? '',
      body,
    }
  }

  /**
   * Execute a Gmail API call with exponential backoff on 429 errors.
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
  ): Promise<T> {
    let lastError: Error | null = null
    let delay = BACKOFF_CONFIG.initialDelay

    for (let attempt = 0; attempt <= BACKOFF_CONFIG.maxRetries; attempt++) {
      try {
        return await fn()
      } catch (err: unknown) {
        lastError = err as Error

        // Only retry on 429 (rate limit) or network errors
        const status = (err as { status?: number })?.status
        if (status !== 429 && status !== 0) {
          throw err // Not retryable
        }

        if (attempt < BACKOFF_CONFIG.maxRetries) {
          console.warn(
            `[gmail-client] Rate limited (attempt ${attempt + 1}/${BACKOFF_CONFIG.maxRetries}), retrying in ${delay}ms`
          )
          await sleep(delay)
          delay = Math.min(delay * BACKOFF_CONFIG.factor, BACKOFF_CONFIG.maxDelay)
        }
      }
    }

    throw lastError ?? new Error('Max retries exceeded')
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function extractHeaders(
  headers: gmail_v1.Schema$MessagePartHeader[],
): { from: string | null; subject: string | null } {
  let from: string | null = null
  let subject: string | null = null

  for (const h of headers) {
    const name = h.name?.toLowerCase()
    if (name === 'from') from = h.value ?? null
    if (name === 'subject') subject = h.value ?? null
  }

  return { from, subject }
}

function extractBody(payload: gmail_v1.Schema$MessagePart | null | undefined): string {
  if (!payload) return ''

  // Direct body
  if (payload.body?.data) {
    return decodeBase64url(payload.body.data)
  }

  // Search parts recursively
  if (payload.parts) {
    for (const part of payload.parts) {
      // Prefer text/plain
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64url(part.body.data)
      }
      // Recurse into nested parts
      const subBody = extractBody(part)
      if (subBody) return subBody
    }
  }

  return ''
}

function decodeBase64url(data: string): string {
  try {
    // Add padding if needed
    const padded = data.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4
    const final = pad ? padded + '='.repeat(4 - pad) : padded

    // Try UTF-8 first
    const bytes = Uint8Array.from(atob(final), c => c.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  } catch {
    return data // Return raw if decoding fails
  }
}
