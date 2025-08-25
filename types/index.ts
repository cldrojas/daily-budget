export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  description: string
  account: string
  date: Date
}

export type TransactionType = 'expense' | 'transfer' | 'income'

export type Budget = {
  startAmount: number
  startDate: Date | undefined
  endDate: Date | undefined
}

export type Account = {
  id: string | undefined
  name: string
  type: string
  balance: number
  icon: string
}
