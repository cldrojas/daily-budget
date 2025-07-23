export type Transaction = {
  id: string
  amount: number
  description: string
  account: string
  date: Date
}

export type Budget = {
  startAmount: number
  startDate: Date | undefined
  endDate: Date | undefined
}

export type Account = {
  id: string
  name: string
  type: string
  balance: number
  icon: string
}
