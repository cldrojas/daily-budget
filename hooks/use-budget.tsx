'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { differenceInDays, startOfDay, isSameDay, isToday } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { Account, Budget, Int, toInt, Transaction, TransactionType } from '@/types'

// This would be replaced with actual KV database calls
const LOCAL_STORAGE_KEY = 'daily-budget-data'

// Default account IDs that cannot be deleted
const DEFAULT_ACCOUNT_IDS = ['daily', 'savings', 'investment']

/**
 * Hook to manage budget state.
 * @returns Object with budget state and functions to manage budget, accounts, and transactions.
 * @example
 * const { budget, accounts, transactions, setupBudget, addTransaction } = useBudget();
 */
export function useBudget() {
  const [isSetup, setIsSetup] = useState(false)
  const [budget, setBudget] = useState<Budget>({
    startAmount: 0 as Int,
    endDate: undefined,
    startDate: undefined,
    autoSave: true
  })
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 'daily', name: 'Daily Budget', type: 'daily', balance: 0 as Int, icon: 'wallet' },
    { id: 'savings', name: 'Savings', type: 'savings', balance: 0 as Int, icon: 'piggybank' }
  ])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dailyAllowance, setDailyAllowance] = useState(0)
  const [remainingToday, setRemainingToday] = useState(0)
  const [progress, setProgress] = useState(100)
  const [lastCheckedDay, setLastCheckedDay] = useState<Date | null>(null)

  const today = useMemo(() => {
    return startOfDay(new Date())
  }, [])

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedData) {
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

      setBudget(parsedData.budget || budget)
      setAccounts(parsedData.accounts && parsedData.accounts.length > 0 ? parsedData.accounts : accounts)
      setTransactions(parsedData.transactions || transactions)
      setDailyAllowance(parsedData.dailyAllowance || 0)
      setRemainingToday(parsedData.remainingToday || 0)
      setProgress(parsedData.progress || 100)
      setLastCheckedDay(parsedData.lastCheckedDay || null)
      setIsSetup(parsedData.isSetup || false)
    }
  }, [])

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
    const totalBalance = mainAccount ? mainAccount.balance : 0 as Int

    const newDailyAllowance = totalBalance / daysRemaining
    setDailyAllowance(newDailyAllowance)
    setRemainingToday(newDailyAllowance)
    // Calculate progress as percentage of daily allowance used
    const usedToday = transactions
      .filter((t) => t.account === 'daily' && isToday(t.date))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const _progress = (remainingToday - usedToday) / newDailyAllowance * 100
    console.log(`DEBUG:_progress:`, _progress)
    setProgress(_progress)
  }, [budget, accounts, today])

  // Check for day change and update budget
  useEffect(() => {
    if (!isSetup) return

    // If this is the first check or a new day has started
    if (!lastCheckedDay || !isSameDay(today, lastCheckedDay)) {
      console.log(`DEBUG:here should enter:`)
      // If there was a previous day, move remaining amount to savings
      if (lastCheckedDay && remainingToday > 0) {
        // Add remaining amount to savings and discount from daily
        const updatedAccounts = accounts.map((account) => {
          console.log(`DEBUG:[accounts.map] account:`, account)
          if (account.id === 'savings') {
            const savingAcc = { ...account, balance: toInt(Math.floor(account.balance) + Math.floor(remainingToday)) ?? 0 as Int }
            return savingAcc
          }
          if (account.id === 'daily') {
            const dailyAcc = { ...account, balance: toInt(Math.floor(account.balance) - Math.floor(remainingToday)) ?? 0 as Int }
            return dailyAcc
          }
          return account
        })

        // Record the transaction
        const savingsTransaction: Transaction = {
          id: uuidv4(),
          type: 'transfer',
          date: today,
          amount: toInt(remainingToday) ?? 0 as Int,
          description: 'Daily budget savings',
          account: 'savings'
        }

        setAccounts(updatedAccounts)
        setTransactions([savingsTransaction, ...transactions])
      }

      // Recalculate daily allowance
      calculateDailyAllowance()

      // Update last checked day
      if (today !== lastCheckedDay) setLastCheckedDay(today)
    }
  }, [isSetup, lastCheckedDay, accounts, calculateDailyAllowance, remainingToday, today, transactions])

  // Get remaining days until end date
  const getRemainingDays = () => {
    if (!budget.endDate) return 0

    return Math.max(0, differenceInDays(budget.endDate, today) + 1)
  }

  // Set up initial budget
  const setupBudget = ({
    startAmount,
    endDate
  }: {
    startAmount: Int
    endDate: Date
  }) => {

    // Create initial budget
    const newBudget: Budget = {
      startAmount,
      startDate: today,
      endDate,
      autoSave: true
    }

    // Update daily account with starting amount
    const updatedAccounts = accounts.map((account) => {
      if (account.id === 'daily') {
        return { ...account, balance: startAmount }
      }
      return account
    })

    // Record the initial deposit transaction
    const initialTransaction: Transaction = {
      id: uuidv4(),
      type: 'income',
      date: today,
      amount: startAmount,
      description: 'Initial deposit',
      account: 'daily'
    }

    setBudget(newBudget)
    setAccounts(updatedAccounts)
    setTransactions([initialTransaction])
    setLastCheckedDay(startOfDay(today))
    setIsSetup(true)

    // Calculate initial daily allowance
    const daysRemaining = differenceInDays(endDate, today) + 1
    const newDailyAllowance = startAmount / daysRemaining
    setDailyAllowance(newDailyAllowance)
    setRemainingToday(newDailyAllowance)
    setProgress(100)
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
      return;
    }

    if (type === 'expense') {

      // Create transaction record
      const transaction = {
        id: uuidv4(),
        type,
        date,
        amount: toInt(-amount) ?? 0 as Int, // Negative for expenses
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
            if (acc.id === 'daily') {
              return { ...acc, balance: toInt(acc.balance - amount) ?? 0 as Int }
            }
            return acc
          })
        } else {
          // Update accounts
          updatedAccounts = accounts.map((acc) => {
            if (acc.id === 'daily') {
              return { ...acc, balance: toInt(acc.balance - amount) ?? 0 as Int }
            }
            return acc
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
          if (acc.id === account) {
            return { ...acc, balance: toInt(acc.balance - amount) ?? 0 as Int }
          }
          return acc
        })

        setTransactions([transaction, ...transactions])
      }

      setAccounts(updatedAccounts)
    }
  }

  // Remove an existing transaction
  const removeTransaction = (transactionId: string) => {
    // Get transaction object
    const transaction = transactions.find((t) => t.id === transactionId)
    if (transaction) {
      const { account, amount } = transaction
      // Update accounts based on expense logic
      let updatedAccounts = [...accounts]

      updatedAccounts = accounts.map((acc) => {
        if (acc.id === account) {
          return { ...acc, balance: toInt(acc.balance + Math.abs(amount)) ?? 0 as Int }
        }
        return acc
      })

      if (isToday(transaction.date)) {
        setRemainingToday(remainingToday + Math.abs(amount))
        setProgress(((remainingToday + Math.abs(amount)) / dailyAllowance) * 100)
      }
      setTransactions(transactions.filter((transaction) => transaction.id !== transactionId))
      setAccounts(updatedAccounts)
    }
  }

  const updateTransaction = (updatedTransaction: Transaction) => {
    // Find the original transaction
    const originalTransaction = transactions.find(t => t.id === updatedTransaction.id)
    if (!originalTransaction) return

    // Update the transaction in the list
    const updatedTransactions = transactions.map(t =>
      t.id === updatedTransaction.id ? updatedTransaction : t
    )

    // Recalculate account balances
    let updatedAccounts = [...accounts]

    // First, reverse the original transaction's effect
    updatedAccounts = updatedAccounts.map(acc => {
      if (acc.id === originalTransaction.account) {
        return { ...acc, balance: toInt(acc.balance - originalTransaction.amount) ?? 0 as Int }
      }
      return acc
    })

    // Then apply the updated transaction's effect
    updatedAccounts = updatedAccounts.map(acc => {
      if (acc.id === updatedTransaction.account) {
        return { ...acc, balance: toInt(acc.balance + updatedTransaction.amount) ?? 0 as Int }
      }
      return acc
    })

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
    balance = 0 as Int,
    icon = 'wallet'
  }: {
    name: string
    type: string
    balance: Int
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
    const updatedAccounts = accounts.map((account) => {
      if (account.id === updatedAccount.id) {
        return { ...account, ...updatedAccount }
      }
      return account
    })

    setAccounts(updatedAccounts)
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
        amount: toInt(-accountToDelete.balance) ?? 0 as Int,
        description: `Account deleted: ${accountToDelete.name}`,
        account: accountId
      }

      // Update savings account balance
      const updatedAccounts = accounts
        .filter((acc) => acc.id !== accountId)
        .map((acc) => {
          if (acc.id === 'savings') {
            return { ...acc, balance: toInt(acc.balance + accountToDelete.balance) ?? 0 as Int }
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
    amount: Int
    fromAccount: string
    toAccount: string
    description?: string
  }) => {
    // Create withdrawal transaction
    const withdrawalTransaction: Transaction = {
      id: uuidv4(),
      type: 'expense',
      date: today,
      amount: toInt(-amount) ?? 0 as Int,
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
        return { ...account, balance: toInt(account.balance - amount) ?? 0 as Int }
      }
      if (account.id === toAccount) {
        return { ...account, balance: toInt(account.balance + amount) ?? 0 as Int }
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

  // Update budget configuration
  const updateConfig = ({
    startAmount,
    endDate
  }: {
    startAmount: Int
    endDate: Date
  }) => {
    // Get current daily account balance
    const dailyAccount = accounts.find((a) => a.id === 'daily')
    const currentBalance = dailyAccount ? dailyAccount.balance : 0

    // Calculate difference to add or subtract
    const balanceDifference = toInt(startAmount - budget.startAmount) ?? 0 as Int

    // Update budget
    const updatedBudget = {
      ...budget,
      startAmount,
      endDate
    }

    // Update daily account balance
    const updatedAccounts = accounts.map((account) => {
      if (account.id === 'daily') {
        return { ...account, balance: toInt(currentBalance + balanceDifference) ?? 0 as Int }
      }
      return account
    })

    // Create transaction if balance changed
    if (balanceDifference !== 0) {
      const transaction: Transaction = {
        id: uuidv4(),
        type: 'transfer',
        date: today,
        amount: balanceDifference ?? 0 as Int,
        description: 'Budget adjustment',
        account: 'daily'
      }
      setTransactions([transaction, ...transactions])
    }

    setBudget(updatedBudget)
    setAccounts(updatedAccounts)

    // Recalculate daily allowance
    const daysRemaining = differenceInDays(endDate, today) + 1

    if (daysRemaining > 0) {
      const newDailyAllowance = (currentBalance + (balanceDifference ?? 0)) / daysRemaining
      setDailyAllowance(newDailyAllowance)
      setRemainingToday(newDailyAllowance)
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
