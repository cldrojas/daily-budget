"use client"

import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { useCurrency } from "@/contexts/currency-context"

export function ExpenseModal({ isOpen, onClose, onAddExpense, accounts, remainingToday }) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [account, setAccount] = useState("daily")

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: t("invalidAmount"),
        description: t("invalidAmountDescription"),
        variant: "destructive",
      })
      return
    }

    const expenseAmount = Number.parseFloat(amount)

    onAddExpense({
      amount: expenseAmount,
      description,
      account,
    })

    // Reset form
    setAmount("")
    setDescription("")
    setAccount("daily")
    onClose()

    // Show toast
    toast({
      title: t("expenseAdded"),
      description: t("expenseAddedDescription", { amount: formatCurrency(expenseAmount) }),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("addExpense")}</DialogTitle>
          <DialogDescription>{t("addExpenseDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t("amount")}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {Number.parseFloat(amount) > remainingToday && (
              <p className="text-sm text-yellow-500 dark:text-yellow-400">{t("expenseExceedsWarning")}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              placeholder={t("whatExpenseFor")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">{t("account")}</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("addExpense")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
