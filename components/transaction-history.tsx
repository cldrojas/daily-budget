"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/contexts/language-context"
import { useCurrency } from "@/contexts/currency-context"
import { useBudget } from "@/hooks/use-budget"
import { Transaction } from '@/types'

export function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  const { t, language } = useLanguage()
  const { formatCurrency } = useCurrency()
  const { accounts } = useBudget()

  // Set locale based on language
  const locale = language === "es" ? es : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("transactionHistory")}</CardTitle>
        <CardDescription>{t("transactionDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">{t("noTransactions")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead>{t("account")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction: Transaction) => {
                const account = accounts.find((acc) => acc.id === transaction.account)
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), "d MMM yyyy", { locale })}</TableCell>
                    <TableCell>{transaction.description || "—"}</TableCell>
                    <TableCell className="capitalize">{account ? account.name : t("unknownAccount")}</TableCell>
                    <TableCell className={`text-right ${transaction.amount < 0 ? "text-red-500" : ""}`}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
