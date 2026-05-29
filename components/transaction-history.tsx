"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale/es"
import { Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useCurrency } from "@/contexts/currency-context"
import { useBudget } from "@/hooks/use-budget"
import { Transaction } from '@/types'
import { DeleteTransactionModal } from "@/components/modals/delete-transaction-modal"

export function TransactionHistory({ transactions }: { transactions: Transaction[] }) {
  const { t, language } = useLanguage()
  const { formatCurrency } = useCurrency()
  const { accounts, removeTransaction } = useBudget()
  const [deleteTarget, setDeleteTarget] = useState<{
    transaction: Transaction
    accountName: string
  } | null>(null)

  // Set locale based on language
  const locale = language === "es" ? es : undefined

  const handleDelete = (refund: boolean) => {
    if (!deleteTarget) return
    removeTransaction(deleteTarget.transaction.id, refund)
    setDeleteTarget(null)
  }

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
                <TableHead className="w-10"></TableHead>
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            transaction,
                            accountName: account?.name || t("unknownAccount")
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <DeleteTransactionModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        transaction={deleteTarget?.transaction ?? null}
        onDelete={handleDelete}
        accountName={deleteTarget?.accountName}
      />
    </Card>
  )
}
