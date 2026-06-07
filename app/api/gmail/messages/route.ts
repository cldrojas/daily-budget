import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/gmail/messages
 *
 * This is a thin endpoint that serves as the API contract for future DB migration.
 *
 * In v1, the actual data lives in localStorage on the client.
 * The client reads directly from localStorage, not from this route.
 *
 * In v2 (with real database), this route will query the DB.
 *
 * Query params (future use):
 *   status?: string       — filter by import status
 *   bank?: string         — filter by bank name
 *   page?: number         — pagination
 *   limit?: number        — page size (default 20)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const bank = searchParams.get('bank')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  // v1: data lives client-side in localStorage
  // Return empty array with contract structure
  return NextResponse.json({
    items: [],
    total: 0,
    page,
    limit,
    filters: {
      status: status ?? null,
      bank: bank ?? null,
    },
    message: 'v1: Data is stored client-side in localStorage. Use GET /api/gmail/sync to trigger import.',
  })
}
