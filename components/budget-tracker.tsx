"use client"

import { useState, useEffect } from "react"
import { format, isSameDay } from "date-fns"
import { CalendarIcon, PlusCircle, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

type Expense = {
  id: string
  description: string
  amount: number
  date: Date
}

type StoredData = {
  initialBalance: number
  endDate: string | null
  expenses: Array<{
    id: string
    description: string
    amount: number
    date: string
  }>
  fixedDailyAmount: number
  lastCalculationDate: string | null
  todayRemainingAmount: number
}

export function BudgetTracker() {
  const { toast } = useToast()
  const [initialBalance, setInitialBalance] = useState<number>(0)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [newExpense, setNewExpense] = useState<{ description: string; amount: string }>({
    description: "",
    amount: "",
  })

  const [remainingBalance, setRemainingBalance] = useState<number>(0)
  const [daysRemaining, setDaysRemaining] = useState<number>(0)
  const [fixedDailyAmount, setFixedDailyAmount] = useState<number>(0)
  const [todayRemainingAmount, setTodayRemainingAmount] = useState<number>(0)
  const [lastCalculationDate, setLastCalculationDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [budgetCalculated, setBudgetCalculated] = useState<boolean>(false)

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedData = localStorage.getItem("budgetTrackerData")
        if (savedData) {
          const parsedData: StoredData = JSON.parse(savedData)

          setInitialBalance(parsedData.initialBalance)

          if (parsedData.endDate) {
            setEndDate(new Date(parsedData.endDate))
          }

          const loadedExpenses = parsedData.expenses.map((exp) => ({
            ...exp,
            date: new Date(exp.date),
          }))

          setExpenses(loadedExpenses)
          setFixedDailyAmount(parsedData.fixedDailyAmount)

          if (parsedData.lastCalculationDate) {
            setLastCalculationDate(new Date(parsedData.lastCalculationDate))
          }

          // Check if it's a new day
          const today = new Date()
          const lastDate = parsedData.lastCalculationDate ? new Date(parsedData.lastCalculationDate) : null

          if (!lastDate || !isSameDay(today, lastDate)) {
            // It's a new day, reset the daily amount
            setTodayRemainingAmount(parsedData.fixedDailyAmount)
            setLastCalculationDate(today)
          } else {
            // Same day, use the saved remaining amount
            setTodayRemainingAmount(parsedData.todayRemainingAmount)
          }

          setBudgetCalculated(parsedData.fixedDailyAmount > 0)

          toast({
            title: "Data loaded",
            description: "Your budget data has been loaded successfully.",
          })
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error loading data",
          description: "There was a problem loading your saved data.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Save data to localStorage whenever it changes
  useEffect(() => {
    // Skip saving during initial load
    if (isLoading) return

    const saveData = () => {
      try {
        const dataToSave: StoredData = {
          initialBalance,
          endDate: endDate ? endDate.toISOString() : null,
          expenses: expenses.map((exp) => ({
            ...exp,
            date: exp.date.toISOString(),
          })),
          fixedDailyAmount,
          lastCalculationDate: lastCalculationDate ? lastCalculationDate.toISOString() : null,
          todayRemainingAmount,
        }

        localStorage.setItem("budgetTrackerData", JSON.stringify(dataToSave))
      } catch (error) {
        console.error("Error saving data:", error)
        toast({
          title: "Error saving data",
          description: "There was a problem saving your data.",
          variant: "destructive",
        })
      }
    }

    saveData()
  }, [initialBalance, endDate, expenses, fixedDailyAmount, lastCalculationDate, todayRemainingAmount, isLoading, toast])

  // Calculate days remaining
  useEffect(() => {
    if (endDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const end = new Date(endDate)
      end.setHours(0, 0, 0, 0)

      const diffTime = end.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      setDaysRemaining(diffDays > 0 ? diffDays : 0)
    } else {
      setDaysRemaining(0)
    }
  }, [endDate])

  // Calculate remaining balance
  useEffect(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const remaining = initialBalance - totalExpenses
    setRemainingBalance(remaining)
  }, [initialBalance, expenses])

  // Check if it's a new day and reset daily amount
  useEffect(() => {
    if (!lastCalculationDate || !budgetCalculated) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const lastDate = new Date(lastCalculationDate)
    lastDate.setHours(0, 0, 0, 0)

    if (!isSameDay(today, lastDate)) {
      setTodayRemainingAmount(fixedDailyAmount)
      setLastCalculationDate(today)

      toast({
        title: "New day started",
        description: "Your daily budget has been reset.",
      })
    }
  }, [lastCalculationDate, fixedDailyAmount, budgetCalculated, toast])

  const calculateBudget = () => {
    if (initialBalance <= 0 || !endDate || daysRemaining <= 0) {
      toast({
        title: "Cannot calculate budget",
        description: "Please set a valid initial balance and end date.",
        variant: "destructive",
      })
      return
    }

    const dailyAmount = Math.floor(remainingBalance / daysRemaining)
    setFixedDailyAmount(dailyAmount)
    setTodayRemainingAmount(dailyAmount)
    setLastCalculationDate(new Date())
    setBudgetCalculated(true)

    toast({
      title: "Budget calculated",
      description: `Your daily budget is CLP ${dailyAmount.toLocaleString()}.`,
    })
  }

  const handleAddExpense = () => {
    if (newExpense.description && newExpense.amount) {
      const amount = Number.parseInt(newExpense.amount)
      if (!isNaN(amount) && amount > 0) {
        const expense: Expense = {
          id: Date.now().toString(),
          description: newExpense.description,
          amount,
          date: new Date(),
        }

        // Add the expense
        setExpenses([...expenses, expense])

        // Reduce today's remaining amount
        const newRemainingAmount = Math.max(0, todayRemainingAmount - amount)
        setTodayRemainingAmount(newRemainingAmount)

        setNewExpense({ description: "", amount: "" })

        if (newRemainingAmount === 0) {
          toast({
            title: "Daily budget depleted",
            description: "You've used all of your daily budget for today.",
            variant: "destructive",
          })
        }
      }
    }
  }

  const handleRemoveExpense = (id: string) => {
    const expenseToRemove = expenses.find((expense) => expense.id === id)

    if (expenseToRemove) {
      // Check if the expense is from today
      const today = new Date()
      if (isSameDay(expenseToRemove.date, today)) {
        // If it's today's expense, add the amount back to today's remaining amount
        setTodayRemainingAmount((prev) => prev + expenseToRemove.amount)
      }

      setExpenses(expenses.filter((expense) => expense.id !== id))
    }
  }

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setInitialBalance(0)
      setEndDate(undefined)
      setExpenses([])
      setFixedDailyAmount(0)
      setTodayRemainingAmount(0)
      setLastCalculationDate(null)
      setBudgetCalculated(false)
      localStorage.removeItem("budgetTrackerData")
      toast({
        title: "Data cleared",
        description: "All your budget data has been cleared.",
      })
    }
  }

  const getTodaysExpenses = () => {
    const today = new Date()
    return expenses.filter((expense) => isSameDay(expense.date, today))
  }

  const getTodaysExpensesTotal = () => {
    return getTodaysExpenses().reduce((sum, expense) => sum + expense.amount, 0)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Loading your budget data...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Budget Settings</CardTitle>
          <CardDescription>Set your initial balance and end date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="initial-balance">Initial Balance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">CLP</span>
              <Input
                id="initial-balance"
                type="number"
                min="0"
                step="1"
                className="pl-12"
                value={initialBalance || ""}
                onChange={(e) => setInitialBalance(Number.parseInt(e.target.value) || 0)}
                disabled={budgetCalculated}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="end-date"
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  disabled={budgetCalculated}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  disabled={(date) => date < new Date() || budgetCalculated}
                />
              </PopoverContent>
            </Popover>
          </div>

          {!budgetCalculated ? (
            <Button
              className="w-full mt-4"
              onClick={calculateBudget}
              disabled={initialBalance <= 0 || !endDate || daysRemaining <= 0}
            >
              Calculate Daily Budget
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                setBudgetCalculated(false)
                setFixedDailyAmount(0)
                setTodayRemainingAmount(0)
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Recalculate Budget
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
          <div className="w-full grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Days Remaining</p>
              <p className="text-2xl font-bold">{daysRemaining}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Daily Allowance</p>
              <p className="text-2xl font-bold">CLP {fixedDailyAmount.toLocaleString()}</p>
            </div>
          </div>

          {budgetCalculated && (
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-muted-foreground">Today's Remaining</p>
                <p className="text-sm font-medium">
                  CLP {todayRemainingAmount.toLocaleString()} / {fixedDailyAmount.toLocaleString()}
                </p>
              </div>
              <Progress value={(todayRemainingAmount / fixedDailyAmount) * 100} className="h-2" />
            </div>
          )}

          <div className="w-full">
            <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
            <p className="text-3xl font-bold">CLP {Math.floor(remainingBalance).toLocaleString()}</p>
          </div>

          <Button variant="outline" className="w-full mt-4" onClick={handleClearData}>
            Clear All Data
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>Track your spending</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[1fr,auto] gap-2">
            <Input
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">CLP</span>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="Amount"
                className="pl-12 w-32"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={handleAddExpense}
            disabled={!newExpense.description || !newExpense.amount || !budgetCalculated}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>

          {budgetCalculated && (
            <div className="p-3 border rounded-md bg-muted/50">
              <h3 className="font-medium mb-1">Today's Expenses</h3>
              <p className="text-sm text-muted-foreground">
                {getTodaysExpenses().length === 0
                  ? "No expenses today"
                  : `${getTodaysExpenses().length} expense(s) totaling CLP ${getTodaysExpensesTotal().toLocaleString()}`}
              </p>
            </div>
          )}

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No expenses yet</p>
            ) : (
              expenses.map((expense) => (
                <div
                  key={expense.id}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-md",
                    isSameDay(expense.date, new Date()) && "border-primary/50 bg-primary/5",
                  )}
                >
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">{format(expense.date, "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">CLP {expense.amount.toLocaleString()}</p>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveExpense(expense.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}