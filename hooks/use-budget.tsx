'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { differenceInDays, startOfDay, isSameDay, isToday } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { Account, Budget, Transaction, TransactionType } from '@/types'

// This would be replaced with actual KV database calls
const LOCAL_STORAGE_KEY = 'daily-budget-data'

// Default account IDs that cannot be deleted
const DEFAULT_ACCOUNT_IDS = ['daily', 'savings', 'investment']

/**
 * Loads and normalizes persisted state from localStorage.
 * Used as a lazy initializer for useState — runs once on mount.
 */
function loadLocalStorageData(): {
  budget: Budget
  accounts: Account[]
  transactions: Transaction[]
  dailyAllowance: number
  remainingToday: number
  progress: number
  lastCheckedDay: Date | null
  isSetup: boolean
} | null {
  if (typeof window === 'undefined') return null
  const savedData = localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!savedData) return null

  const parsedData = JSON.parse(savedData)

  // Convert date strings back to Date objects
  if (parsedData.budget?.endDate) {
    parsedData.budget.endDate = new Date(parsedData.budget.endDate)
  }
  if (parsedData.budget?.startDate) {
    parsedData.budget.startDate = new Date(parsedData.budget.startDate)
  }
  if (parsedData.lastCheckedDay) {
    parsedData.lastCheckedDay = new Date(parsedData.lastCheckedDay)
  }

  // Add default mode if not present (backwards compatibility)
  if (parsedData.budget && !parsedData.budget.mode) {
    parsedData.budget.mode = parsedData.budget.endDate ? 'daily' : 'track'
  }

  return parsedData
}

/**
 * Hook to manage budget state.
 * @returns Object with budget state and functions to manage budget, accounts, and transactions.
 * @example
 * const { budget, accounts, transactions, setupBudget, addTransaction } = useBudget();
 */
export function useBudget() {
  const [isSetup, setIsSetup] = useState(false)
  const [budget, setBudget] = useState<Budget>({
    startAmount: 0,
    endDate: undefined,
    startDate: undefined,
    autoSave: true
  })
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 'daily', name: 'Daily Budget', type: 'daily', balance: 0, icon: 'wallet' },
    { id: 'savings', name: 'Savings', type: 'savings', balance: 0, icon: 'piggybank' }
  ])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dailyAllowance, setDailyAllowance] = useState(0)
  const [remainingToday, setRemainingToday] = useState(0)
  const [progress, setProgress] = useState(100)
  const [lastCheckedDay, setLastCheckedDay] = useState<Date | null>(null)

  // Hydrate persisted state after mount. Effect (not a lazy initializer) is
  // intentional: localStorage is client-only, so this must not run during SSR
  // prerender, and hydrating post-mount avoids hydration mismatches.
  /* eslint-disable react-hooks/set-state-in-effect -- client-only persisted hydration */
  useEffect(() => {
    const saved = loadLocalStorageData()
    if (!saved) return

    setIsSetup(saved.isSetup)
    setBudget(saved.budget)
    if (saved.accounts && saved.accounts.length > 0) setAccounts(saved.accounts)
    setTransactions(saved.transactions ?? [])
    setDailyAllowance(saved.dailyAllowance ?? 0)
    setRemainingToday(saved.remainingToday ?? 0)
    setProgress(saved.progress ?? 100)
    if (saved.lastCheckedDay) setLastCheckedDay(saved.lastCheckedDay)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const today = useMemo(() => {
    return startOfDay(new Date())
  }, [])

  // Helper functions to check budget mode
  const isDailyMode = useCallback(() => {
    return budget.mode === 'daily' || budget.mode === undefined
  }, [budget.mode])

  const isTrackMode = useCallback(() => {
    return budget.mode === 'track'
  }, [budget.mode])

  // Save data to localStorage whenever state changes
  useEffect(() => {
    if (isSetup) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          budget,
          accounts,
          transactions,
          dailyAllowance,
          remainingToday,
          progress,
          lastCheckedDay,
          isSetup
        })
      )
    }
  }, [
    budget,
    accounts,
    transactions,
    dailyAllowance,
    remainingToday,
    progress,
    lastCheckedDay,
    isSetup
  ])

  // Calculate daily allowance based on remaining amount and days
  const calculateDailyAllowance = useCallback(() => {
    // Track mode doesn't have daily allowance
    if (isTrackMode()) return

    if (!budget.endDate) return

    const daysRemaining = differenceInDays(budget.endDate, today) + 1

    if (daysRemaining <= 0) {
      setDailyAllowance(0)
      setRemainingToday(0)
      setProgress(0)
      return
    }

    // Get total balance from main account
    const mainAccount = accounts.find((a) => a.id === 'daily')
    const totalBalance = mainAccount ? mainAccount.balance : 0

    const newDailyAllowance = totalBalance / daysRemaining
    setDailyAllowance(newDailyAllowance)
    setRemainingToday(newDailyAllowance)
    // Calculate progress as percentage of daily allowance used
    const usedToday = transactions
      .filter((t) => t.account === 'daily' && isToday(t.date))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const _progress = (remainingToday - usedToday) / newDailyAllowance * 100
    setProgress(_progress)
  }, [budget, accounts, today, transactions, remainingToday, isTrackMode])

  // Check for day change and update budget
  useEffect(() => {
    if (!isSetup) return

    // If this is the first check or a new day has started
    if (!lastCheckedDay || !isSameDay(today, lastCheckedDay)) {
      // If there was a previous day, move remaining amount to savings (only in daily mode)
      if (lastCheckedDay && remainingToday > 0 && isDailyMode() && budget.autoSave) {
        // Add remaining amount to savings and discount from daily
        const updatedAccounts = accounts.map((account) => {
          if (account.id === 'savings') {
            return { ...account, balance: Math.floor(account.balance) + Math.floor(remainingToday) }
          }
          if (account.id === 'daily') {
            return { ...account, balance: Math.floor(account.balance) - Math.floor(remainingToday) }
          }
          return account
        })

        // Record the transaction
        const savingsTransaction: Transaction = {
          id: uuidv4(),
          type: 'transfer',
          date: today,
          amount: Math.floor(remainingToday),
          description: 'Daily budget savings',
          account: 'savings'
        }

        setAccounts(updatedAccounts) // eslint-disable-line
        setTransactions([savingsTransaction, ...transactions])
      }

      // Recalculate daily allowance
      calculateDailyAllowance()

      // Update last checked day
      if (today !== lastCheckedDay) setLastCheckedDay(today)
    }
  }, [isSetup, lastCheckedDay, accounts, calculateDailyAllowance, remainingToday, today, transactions, budget.autoSave, isDailyMode])

  // Get remaining days until end date
  const getRemainingDays = () => {
    if (!budget.endDate) return 0

    return Math.max(0, differenceInDays(budget.endDate, today) + 1)
  }

  // Add a new expense by default
  const addTransaction = ({
    type,
    amount,
    description,
    account, // accountId
    date = today
  }: {
    type: TransactionType
    amount: number
    description: string
    account: string
    date?: Date
  }) => {

    if (!isFinite(amount) || amount <= 0) {
      return
    }

    // Normalize to integer at the boundary
    const intAmount = Math.floor(amount)

    if (type === 'expense') {

      // Create transaction record with NEGATIVE amount (domain convention)
      const transaction: Transaction = {
        id: uuidv4(),
        type,
        date,
        amount: -intAmount,
        description,
        account
      }

      // Update accounts based on expense logic
      let updatedAccounts = [...accounts]

      if (account === 'daily') {
        // If expense is less than or equal to remaining daily amount
        if (amount <= remainingToday) {
          // Simply reduce the remaining amount for today
          setRemainingToday(remainingToday - amount)
          setProgress(((remainingToday - amount) / dailyAllowance) * 100)
          setTransactions([transaction, ...transactions])

          // Update daily account balance
          updatedAccounts = accounts.map((acc) => {
            return { ...acc, balance: acc.balance - intAmount }
          })
        } else {
          // Update accounts
          updatedAccounts = accounts.map((acc) => {
            return { ...acc, balance: acc.balance - intAmount }
          })

          setTransactions([transaction, ...transactions])
          // Recalculate daily allowance with remaining balance
          const dailyAccount = updatedAccounts.find((acc) => acc.id === 'daily')
          const daysRemaining = differenceInDays(budget.endDate!, today) + 1

          if (daysRemaining > 0 && dailyAccount) {
            const newDailyAllowance = dailyAccount.balance / daysRemaining
            setDailyAllowance(newDailyAllowance)
            setRemainingToday(0)
            setProgress(0)
          }
        }
      } else {
        // For non-daily accounts, simply update the balance
        updatedAccounts = accounts.map((acc) => {
          return { ...acc, balance: acc.balance - intAmount }
        })

        setTransactions([transaction, ...transactions])
      }

      setAccounts(updatedAccounts)
    }

    if (type === 'income') {
      // Create transaction record with POSITIVE amount
      const transaction: Transaction = {
        id: uuidv4(),
        type,
        date,
        amount: intAmount,
        description,
        account
      }

      // Update account balance by adding the income amount
      const updatedAccounts = accounts.map((acc) => {
        return { ...acc, balance: acc.balance + intAmount }
      })

      // If daily account in budget mode, also update remainingToday and progress
      if (account === 'daily' && budget.endDate) {
        const daysRemaining = differenceInDays(budget.endDate, today) + 1
        if (daysRemaining > 0) {
          const dailyBalance = accounts.find(a => a.id === 'daily')?.balance ?? 0
          const newDailyAllowance = (dailyBalance + intAmount) / daysRemaining
          setDailyAllowance(newDailyAllowance)
          setRemainingToday(newDailyAllowance)
          setProgress(100)
        }
      }

      setAccounts(updatedAccounts)
      setTransactions([transaction, ...transactions])
    }
  }

  // Remove an existing transaction
  const removeTransaction = (transactionId: string, refund: boolean = true) => {
    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    if (refund) {
      // Reverse the transaction's effect on its own account balance
      const updatedAccounts = accounts.map((acc) => {
        if (acc.id === transaction.account) {
          return { ...acc, balance: acc.balance - transaction.amount }
        }
        return acc
      })
      setAccounts(updatedAccounts)

      if (isToday(transaction.date)) {
        setRemainingToday(remainingToday - transaction.amount)
        setProgress(((remainingToday - transaction.amount) / dailyAllowance) * 100)
      }
    }

    setTransactions(transactions.filter((t) => t.id !== transactionId))
  }

  const updateTransaction = (updatedTransaction: Transaction) => {
    // Find the original transaction
    const originalTransaction = transactions.find(t => t.id === updatedTransaction.id)
    if (!originalTransaction) return

    // Update the transaction in the list
    const updatedTransactions = transactions.map(t =>
      t.id === updatedTransaction.id ? updatedTransaction : t
    )

    // Recalculate account balances: reverse original on its account, apply updated on its account
    let updatedAccounts = accounts.map(acc =>
      acc.id === originalTransaction.account
        ? { ...acc, balance: acc.balance - originalTransaction.amount }
        : acc
    )
    updatedAccounts = updatedAccounts.map(acc =>
      acc.id === updatedTransaction.account
        ? { ...acc, balance: acc.balance + updatedTransaction.amount }
        : acc
    )

    setTransactions(updatedTransactions)
    setAccounts(updatedAccounts)

    // If this affects today's remaining amount, recalculate it
    if (isToday(updatedTransaction.date) && updatedTransaction.account === 'daily') {
      // This is a simplified recalculation - in a real app you'd want more sophisticated logic
      const todayExpenses = updatedTransactions
        .filter(t => t.account === 'daily' && t.amount < 0 && isToday(t.date))
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      setRemainingToday(Math.max(0, dailyAllowance - todayExpenses))
      setProgress(Math.max(0, ((dailyAllowance - todayExpenses) / dailyAllowance) * 100))
    }
  }

  // Add a new account
  const addAccount = ({
    name,
    type,
    balance = 0,
    icon = 'wallet'
  }: {
    name: string
    type: string
    balance: number
    icon: string
  }) => {
    const newAccount = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      type,
      balance,
      icon
    }

    setAccounts([...accounts, newAccount])

    // If initial balance is provided, create a transaction
    if (balance > 0) {
      const transaction: Transaction = {
        id: uuidv4(),
        type: 'income',
        date: today,
        amount: balance,
        description: `Initial deposit to ${name}`,
        account: newAccount.id
      }

      setTransactions([transaction, ...transactions])
    }
  }

  // Update an existing account
  const updateAccount = (updatedAccount: Account) => {
    // Find the old account before updating
    const oldAccount = accounts.find((a) => a.id === updatedAccount.id)

    const updatedAccounts = accounts.map((account) => {
      if (account.id === updatedAccount.id) {
        return { ...account, ...updatedAccount }
      }
      return account
    })

    setAccounts(updatedAccounts)

    // Create adjustment transaction if the balance changed
    if (oldAccount && oldAccount.balance !== updatedAccount.balance) {
      const delta = updatedAccount.balance - oldAccount.balance
      if (delta !== 0) {
        const adjustmentTransaction: Transaction = {
          id: uuidv4(),
          type: 'adjustment',
          amount: delta,
          description: 'Balance adjustment',
          account: updatedAccount.id,
          date: today
        }
        setTransactions([adjustmentTransaction, ...transactions])
      }
    }
  }

  // Delete an account
  const deleteAccount = (accountId: string) => {
    // Don't allow deletion of default accounts
    if (DEFAULT_ACCOUNT_IDS.includes(accountId)) {
      return false
    }

    // Get the account to be deleted
    const accountToDelete = accounts.find((acc) => acc.id === accountId)
    if (!accountToDelete) return false

    // If account has balance, transfer it to savings
    // TODO: If account has balance, ask for save/discard and choose where to save
    if (accountToDelete.balance > 0) {
      // Create transfer transaction
      const transferTransaction: Transaction = {
        id: uuidv4(),
        type: 'income',
        date: today,
        amount: accountToDelete.balance,
        description: `Transfer from deleted account: ${accountToDelete.name}`,
        account: 'savings'
      }

      // Create deletion transaction
      const deletionTransaction: Transaction = {
        id: uuidv4(),
        type: 'transfer',
        date: today,
        amount: -accountToDelete.balance,
        description: `Account deleted: ${accountToDelete.name}`,
        account: accountId
      }

      // Update savings account balance
      const updatedAccounts = accounts
        .filter((acc) => acc.id !== accountId)
        .map((acc) => {
          if (acc.id === 'savings') {
            return { ...acc, balance: acc.balance + accountToDelete.balance }
          }
          return acc
        })

      setAccounts(updatedAccounts)
      setTransactions([transferTransaction, deletionTransaction, ...transactions])
    } else {
      // Just remove the account if no balance
      setAccounts(accounts.filter((acc) => acc.id !== accountId))
    }

    return true
  }

  // Transfer funds between accounts
  const transferFunds = ({
    amount,
    fromAccount,
    toAccount,
    description
  }: {
    amount: number
    fromAccount: string
    toAccount: string
    description?: string
  }) => {
    // Create withdrawal transaction
    const withdrawalTransaction: Transaction = {
      id: uuidv4(),
      type: 'expense',
      date: today,
      amount: -amount,
      description:
        description || 'Transfer to ' + accounts.find((a) => a.id === toAccount)?.name,
      account: fromAccount
    }

    // Create deposit transaction
    const depositTransaction: Transaction = {
      id: uuidv4(),
      type: 'income',
      date: today,
      amount: amount,
      description:
        description ||
        'Transfer from ' + accounts.find((a) => a.id === fromAccount)?.name,
      account: toAccount
    }

    // Update account balances
    const updatedAccounts = accounts.map((account) => {
      if (account.id === fromAccount) {
        return { ...account, balance: account.balance - amount }
      }
      if (account.id === toAccount) {
        return { ...account, balance: account.balance + amount }
      }
      return account
    })

    setAccounts(updatedAccounts)
    setTransactions([depositTransaction, withdrawalTransaction, ...transactions])
  }

  // Clear data from localstorage
  const clearData = () => {
    setIsSetup(false)
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  // Toggle auto-save setting
  const toggleAutoSave = () => {
    setBudget((budget) => ({ ...budget, autoSave: !budget.autoSave }))
  }

  // Set up the initial budget
  const setupBudget = ({
    startAmount,
    endDate,
    mode = 'daily'
  }: {
    startAmount: number
    endDate?: Date
    mode?: 'daily' | 'track'
  }) => {
    const intAmount = Math.floor(startAmount)

    const updatedBudget: Budget = {
      ...budget,
      startAmount: intAmount,
      startDate: today,
      endDate: mode === 'daily' ? endDate : undefined,
      mode,
      autoSave: true
    }

    // Create the initial income transaction on the daily account
    const initialTransaction: Transaction = {
      id: uuidv4(),
      type: 'income',
      date: today,
      amount: intAmount,
      description: 'Initial deposit',
      account: 'daily'
    }

    // Set up daily account (and savings for daily mode)
    const existingDaily = accounts.find((a) => a.id === 'daily')
    let updatedAccounts: Account[]

    if (existingDaily) {
      updatedAccounts = accounts.map((acc) => {
        if (acc.id === 'daily') return { ...acc, balance: intAmount }
        return acc
      })
    } else {
      updatedAccounts = [
        { id: 'daily', name: 'Daily Budget', type: 'daily', balance: intAmount, icon: 'wallet' },
        ...accounts
      ]
    }

    // Ensure savings account exists in daily mode
    if (mode === 'daily' && !updatedAccounts.some((a) => a.id === 'savings')) {
      updatedAccounts.push({ id: 'savings', name: 'Savings', type: 'savings', balance: 0, icon: 'piggybank' })
    }

    setBudget(updatedBudget)
    setAccounts(updatedAccounts)
    setTransactions([initialTransaction, ...transactions])
    setIsSetup(true)

    // Recalculate daily allowance for daily mode
    if (mode === 'daily' && endDate) {
      const daysRemaining = differenceInDays(endDate, today) + 1
      if (daysRemaining > 0) {
        const allowance = intAmount / daysRemaining
        setDailyAllowance(allowance)
        setRemainingToday(allowance)
        setProgress(100)
      }
    } else {
      setDailyAllowance(0)
      setRemainingToday(0)
      setProgress(100)
    }
  }

  // Update budget configuration
  const updateConfig = ({
    startAmount,
    endDate,
    mode,
    autoSave
  }: {
    startAmount?: number
    endDate?: Date | undefined
    mode?: 'daily' | 'track'
    autoSave?: boolean
  }) => {
    // Get current daily account balance
    const dailyAccount = accounts.find((a) => a.id === 'daily')
    const currentBalance = dailyAccount ? dailyAccount.balance : 0

    // Calculate difference to add or subtract (if startAmount changed)
    const balanceDifference = startAmount !== undefined
      ? startAmount - budget.startAmount
      : 0

    // Determine new mode: explicit or derive from endDate
    const newMode = mode ?? (endDate === undefined ? 'track' : 'daily')

    // Update budget
    const updatedBudget = {
      ...budget,
      startAmount: startAmount ?? budget.startAmount,
      endDate,
      mode: newMode,
      autoSave: autoSave ?? budget.autoSave
    }

    // Update accounts based on mode change
    let updatedAccounts = [...accounts]

    // If switching to track mode, remove savings account
    if (newMode === 'track' && accounts.some(acc => acc.id === 'savings')) {
      updatedAccounts = updatedAccounts.filter(acc => acc.id !== 'savings')
    }

    // If switching from track to daily, add savings account if missing
    if (newMode === 'daily' && !accounts.some(acc => acc.id === 'savings')) {
      updatedAccounts.push({ id: 'savings', name: 'Savings', type: 'savings', balance: 0, icon: 'piggybank' })
    }

    // Update daily account balance if startAmount changed
    if (balanceDifference !== 0) {
      updatedAccounts = updatedAccounts.map((account) => {
        return { ...account, balance: currentBalance + balanceDifference }
      })

      // Create transaction
      const transaction: Transaction = {
        id: uuidv4(),
        type: 'transfer',
        date: today,
        amount: balanceDifference,
        description: 'Budget adjustment',
        account: 'daily'
      }
      setTransactions([transaction, ...transactions])
    }

    setBudget(updatedBudget)
    setAccounts(updatedAccounts)

    // Recalculate daily allowance only in daily mode with endDate
    if (newMode === 'daily' && endDate) {
      const daysRemaining = differenceInDays(endDate, today) + 1
      if (daysRemaining > 0) {
        const newDailyAllowance = (currentBalance + balanceDifference) / daysRemaining
        setDailyAllowance(newDailyAllowance)
        setRemainingToday(newDailyAllowance)
        setProgress(100)
      }
    } else {
      // Track mode or no endDate
      setDailyAllowance(0)
      setRemainingToday(0)
      setProgress(100)
    }
  }

  return {
    // Values
    accounts,
    budget,
    dailyAllowance,
    isSetup,
    progress,
    remainingToday,
    transactions,

    // Functions
    addAccount,
    addTransaction,
    clearData,
    deleteAccount,
    getRemainingDays,
    removeTransaction,
    setupBudget,
    setLastCheckedDay,
    toggleAutoSave,
    transferFunds,
    updateAccount,
    updateConfig,
    updateTransaction
  }
}