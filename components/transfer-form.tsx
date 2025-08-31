"use client"

import { useState, FormEvent, ChangeEvent } from "react"
import { ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { useCurrency } from "@/contexts/currency-context"

export function TransferForm({ accounts, onTransfer }: { accounts: { id: string; name: string; balance: number }[]; onTransfer: (payload: { amount: number; fromAccount: string; toAccount: string; description?: string }) => void }) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [amount, setAmount] = useState<string>("")
  const [fromAccount, setFromAccount] = useState("")
  const [toAccount, setToAccount] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!fromAccount || !toAccount) {
      toast({
        title: t("missingAccounts"),
        description: t("missingAccountsDescription"),
        variant: "destructive",
      })
      return
    }

    if (fromAccount === toAccount) {
      toast({
        title: t("invalidTransfer"),
        description: t("invalidTransferDescription"),
        variant: "destructive",
      })
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: t("invalidAmount"),
        description: t("invalidAmountDescription"),
        variant: "destructive",
      })
      return
    }

    const transferAmount = Number.parseFloat(amount)
    const sourceAccount = accounts.find((acc) => acc.id === fromAccount)

    if (sourceAccount && sourceAccount.balance < transferAmount) {
      toast({
        title: t("insufficientFunds"),
        description: t("insufficientFundsDescription", { account: sourceAccount.name }),
        variant: "destructive",
      })
      return
    }

    onTransfer({
      amount: transferAmount,
      fromAccount,
      toAccount,
      description: description || t("transferDescription"),
    })

    // Reset form
    setAmount("")
    setDescription("")
    setFromAccount("")
    setToAccount("")

    // Show toast
    toast({
      title: t("transferComplete"),
      description: t("transferCompleteDescription", { amount: formatCurrency(transferAmount) }),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("transferFunds")}</CardTitle>
        <CardDescription>{t("transferDescription")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fromAccount">{t("fromAccount")}</Label>
            <Select value={fromAccount} onValueChange={setFromAccount}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectSourceAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAccount">{t("toAccount")}</Label>
            <Select value={toAccount} onValueChange={setToAccount}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectDestinationAccount")} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t("amount")}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Input
              id="description"
              placeholder={t("whatTransferFor")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {t("transferFunds")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
