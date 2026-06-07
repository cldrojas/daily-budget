import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getAuthenticatedClient } from '@/lib/import/oauth'
import { getImportById, updateImportStatus } from '@/lib/import/store'
import { toInt, type Int } from '@/types'
import type { ReviewRequest, ReviewResponse } from '@/lib/import/types'
import type { Transaction } from '@/types'

/**
 * POST /api/gmail/review
 *
 * Approve or reject an imported transaction.
 *
 * Body:
 *   id: string             — ImportedTransaction ID
 *   action: "approve"|"reject"
 *   account?: string       — required for approve
 *   overrides?: {
 *     amount?: number
 *     description?: string
 *     date?: string
 *     type?: "expense"|"income"
 *   }
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

    let body: ReviewRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { id, action, account, overrides } = body

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: id, action' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Use "approve" or "reject".` },
        { status: 400 }
      )
    }

    const txn = getImportById(id)
    if (!txn) {
      return NextResponse.json(
        { error: `Import not found: ${id}` },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    if (action === 'reject') {
      updateImportStatus(id, 'rejected', now, null)
      return NextResponse.json({ status: 'rejected' } satisfies ReviewResponse)
    }

    // action === 'approve'
    if (!account) {
      return NextResponse.json(
        { error: 'Account is required when approving a transaction' },
        { status: 400 }
      )
    }

    // Build transaction from parsed data + overrides
    const amount = overrides?.amount ?? txn.parsedAmount ?? 0
    const description = overrides?.description ?? txn.parsedEntity ?? txn.rawSubject
    const dateStr = overrides?.date ?? txn.parsedDate ?? now.slice(0, 10)
    const type = overrides?.type ?? txn.parsedType ?? 'expense'

    // Amount is in cents (positive). For expenses, make it negative.
    const signedAmount = type === 'expense' ? -Math.abs(amount as number) : Math.abs(amount as number)

    const newTransaction: Transaction = {
      id: uuidv4(),
      type,
      amount: (toInt(signedAmount) ?? 0) as Int,
      description,
      account,
      date: new Date(dateStr),
    }

    // Store the transaction — in v1, we save it to localStorage alongside imports
    // and return it so the client can call useBudget().addTransaction()
    updateImportStatus(id, 'approved', now, newTransaction.id)

    return NextResponse.json({
      status: 'approved',
      transaction: newTransaction,
    } satisfies ReviewResponse)
  } catch (error: unknown) {
    const err = error as Error
    console.error('[gmail-review] Review error:', err)
    return NextResponse.json(
      { status: 'error', error: err.message ?? 'Review failed' } satisfies ReviewResponse,
      { status: 500 }
    )
  }
}
