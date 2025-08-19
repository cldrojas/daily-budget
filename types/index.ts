// 1. Define a branded Int type
export type Int = number & { __int__: true }

// 2. Factory function to create Ints safely
export function toInt(n: number): Int {
  if (!Number.isInteger(n)) {
    throw new Error(`Value ${n} is not an integer`)
  }
  return n as Int
}

// 3. Type guard (optional but useful)
export function isInt(n: number): n is Int {
  return Number.isInteger(n)
}

export type Transaction = {
  id: string
  type: TransactionType
  amount: Int
  description: string
  account: string
  date: Date
}

export type TransactionType = 'expense' | 'transfer' | 'income'

export type Budget = {
  startAmount: Int
  startDate: Date | undefined
  endDate: Date | undefined
  autoSave: boolean
}

export type Account = {
  id: string
  name: string
  type: string
  balance: Int
  icon: string
}
