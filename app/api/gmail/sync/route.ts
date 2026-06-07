import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedClient } from '@/lib/import/oauth'
import { runSync } from '@/lib/import/gmail/sync'
import type { SyncRequest } from '@/lib/import/types'

/**
 * POST /api/gmail/sync
 *
 * Trigger a Gmail sync. Scans inbox for bank notification emails,
 * parses them, and returns the imported transactions.
 *
 * Body (optional):
 *   senders?: string[]   — default: bank sender addresses
 *   maxResults?: number  — default: 50
 *   daysBack?: number    — default: 90
 */
export async function POST(request: NextRequest) {
  try {
    const client = await getAuthenticatedClient()
    if (!client) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please authenticate first.' },
        { status: 401 }
      )
    }

    let body: SyncRequest = {}
    try {
      body = await request.json()
    } catch {
      // No body — use defaults
    }

    const result = await runSync(client, {
      senders: body.senders,
      maxResults: body.maxResults,
      daysBack: body.daysBack,
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number }

    // Token expired / invalid grant
    if (err.message?.includes('invalid_grant') || err.message?.includes('Token has expired')) {
      return NextResponse.json(
        { error: 'Gmail connection expired. Please reconnect.', code: 'token_expired' },
        { status: 401 }
      )
    }

    console.error('[gmail-sync] Sync error:', err)
    return NextResponse.json(
      { error: 'Sync failed. Please try again.', details: err.message },
      { status: 502 }
    )
  }
}
