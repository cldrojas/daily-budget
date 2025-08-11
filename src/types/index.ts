export type Transaction = {
  id: string
  type: TransactionType
  amount: number
  description: string
  account: string
  date: Date
}

export type TransactionType = 'expense' | 'income' | 'transfer'

export type Budget = {
  startAmount: number
  startDate: Date | undefined
  endDate: Date | undefined
  autoSave: boolean
}

export type Account = {
  id: string
  name: string
  type: string
  balance: number
  icon: string
} 

export type Transfer = {
  id: string
  fromAccount: string
  toAccount: string
  amount: number
  date: Date
}