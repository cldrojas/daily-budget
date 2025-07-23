'use client'

import { useState, useEffect } from 'react'
import { differenceInDays, startOfDay, isSameDay, isToday } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { Budget, Account, Transaction } from '@/next-env'



// This would be replaced with actual KV database calls
const LOCAL_STORAGE_KEY = 'daily-budget-data'

// Default account IDs that cannot be deleted
const DEFAULT_ACCOUNT_IDS = ['daily', 'savings', 'investment']

export function useBudget() {
  const [isSetup, setIsSetup] = useState(false)
  const [budget, setBudget] = useState<Budget>({
    startAmount: 0,
    endDate: null,
    startDate: null
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
      setAccounts(parsedData.accounts || accounts)
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

  // Check for day change and update budget
  useEffect(() => {
    if (!isSetup) return

    const today = startOfDay(new Date())

    // If this is the first check or a new day has started
    if (!lastCheckedDay || !isSameDay(today, lastCheckedDay)) {
      // If there was a previous day, move remaining amount to savings
      if (lastCheckedDay && remainingToday > 0) {
        // Add remaining amount to savings and discount from daily
        const updatedAccounts = accounts.map((account) => {
          if (account.id === 'savings') {
            return { ...account, balance: account.balance + remainingToday }
          }
          if (account.id === 'daily') {
            return { ...account, balance: account.balance - remainingToday }
          }
          return account
        })

        // Record the transaction
        const savingsTransaction = {
          id: uuidv4(),
          date: new Date(),
          amount: remainingToday,
          description: 'Daily budget savings',
          account: 'savings'
        }

        setAccounts(updatedAccounts)
        setTransactions([savingsTransaction, ...transactions])
      }

      // Recalculate daily allowance
      calculateDailyAllowance()

      // Update last checked day
      setLastCheckedDay(today)
    }
  }, [isSetup, lastCheckedDay])

  // Calculate daily allowance based on remaining amount and days
  const calculateDailyAllowance = () => {
    if (!budget.endDate) return

    const today = new Date()
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
    setProgress(100)
  }

  // Get remaining days until end date
  const getRemainingDays = () => {
    if (!budget.endDate) return 0

    const today = new Date()
    return Math.max(0, differenceInDays(budget.endDate, today) + 1)
  }

  // Set up initial budget
  const setupBudget = ({
    startAmount,
    endDate
  }: {
    startAmount: number
    endDate: Date
  }) => {
    const today = new Date()

    // Create initial budget
    const newBudget: Budget = {
      startAmount,
      startDate: today,
      endDate
    }

    // Update daily account with starting amount
    const updatedAccounts = accounts.map((account) => {
      if (account.id === 'daily') {
        return { ...account, balance: startAmount }
      }
      return account
    })

    // Record the initial deposit transaction
    const initialTransaction = {
      id: uuidv4(),
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

  // Add a new expense
  const addExpense = ({
    amount,
    description,
    account,
    date = new Date()
  }: {
    amount: number
    description: string
    account: string
    date?: Date
  }) => {
    // Create transaction record
    const transaction = {
      id: uuidv4(),
      date,
      amount: -amount, // Negative for expenses
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
            return { ...acc, balance: acc.balance - amount }
          }
          return acc
        })
      } else {
        // Update accounts
        updatedAccounts = accounts.map((acc) => {
          if (acc.id === 'daily') {
            return { ...acc, balance: acc.balance - amount }
          }
          return acc
        })

        setTransactions([transaction, ...transactions])
        // Recalculate daily allowance with remaining balance
        const dailyAccount = updatedAccounts.find((acc) => acc.id === 'daily')
        const today = new Date()
        const daysRemaining = differenceInDays(budget.endDate || '', today) + 1

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
          return { ...acc, balance: acc.balance - amount }
        }
        return acc
      })

      setTransactions([transaction, ...transactions])
    }

    setAccounts(updatedAccounts)
  }

  // Remove an existing transaction
  const removeTransaction = (id: string) => {
    // Get transaction object
    const transaction = transactions.find((t) => t.id === id)
    if (transaction) {
      const { account, amount } = transaction
      // Update accounts based on expense logic
      let updatedAccounts = [...accounts]

      updatedAccounts = accounts.map((acc) => {
        if (acc.id === account) {
          return { ...acc, balance: acc.balance + Math.abs(amount) }
        }
        return acc
      })

      if (isToday(transaction.date)) {
        console.log(`DEBUG:transaction.date:`, transaction.date)
        setRemainingToday(remainingToday + Math.abs(amount))
        setProgress(((remainingToday + Math.abs(amount)) / dailyAllowance) * 100)
      }
      setTransactions(transactions.filter((transaction) => transaction.id !== id))
      setAccounts(updatedAccounts)
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
      id: uuidv4(),
      name,
      type,
      balance,
      icon
    }

    setAccounts([...accounts, newAccount])

    // If initial balance is provided, create a transaction
    if (balance > 0) {
      const transaction = {
        id: uuidv4(),
        date: new Date(),
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
      const transferTransaction = {
        id: uuidv4(),
        date: new Date(),
        amount: accountToDelete.balance,
        description: `Transfer from deleted account: ${accountToDelete.name}`,
        account: 'savings'
      }

      // Create deletion transaction
      const deletionTransaction = {
        id: uuidv4(),
        date: new Date(),
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
    const withdrawalTransaction = {
      id: uuidv4(),
      date: new Date(),
      amount: -amount,
      description:
        description || 'Transfer to ' + accounts.find((a) => a.id === toAccount)?.name,
      account: fromAccount
    }

    // Create deposit transaction
    const depositTransaction = {
      id: uuidv4(),
      date: new Date(),
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

  // Update budget configuration
  const updateConfig = ({
    startAmount,
    endDate
  }: {
    startAmount: number
    endDate: Date
  }) => {
    // Get current daily account balance
    const dailyAccount = accounts.find((a) => a.id === 'daily')
    const currentBalance = dailyAccount ? dailyAccount.balance : 0

    // Calculate difference to add or subtract
    const balanceDifference = startAmount - budget.startAmount

    // Update budget
    const updatedBudget = {
      ...budget,
      startAmount,
      endDate
    }

    // Update daily account balance
    const updatedAccounts = accounts.map((account) => {
      if (account.id === 'daily') {
        return { ...account, balance: currentBalance + balanceDifference }
      }
      return account
    })

    // Create transaction if balance changed
    if (balanceDifference !== 0) {
      const transaction = {
        id: uuidv4(),
        date: new Date(),
        amount: balanceDifference,
        description: 'Budget adjustment',
        account: 'daily'
      }
      setTransactions([transaction, ...transactions])
    }

    setBudget(updatedBudget)
    setAccounts(updatedAccounts)

    // Recalculate daily allowance
    const today = new Date()
    const daysRemaining = differenceInDays(endDate, today) + 1

    if (daysRemaining > 0) {
      const newDailyAllowance = (currentBalance + balanceDifference) / daysRemaining
      setDailyAllowance(newDailyAllowance)
      setRemainingToday(newDailyAllowance)
      setProgress(100)
    }
  }

  return {
    budget,
    accounts,
    transactions,
    dailyAllowance,
    remainingToday,
    progress,
    isSetup,
    setupBudget,
    addExpense,
    removeTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    transferFunds,
    updateConfig,
    getRemainingDays
  }
}
