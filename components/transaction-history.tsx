"use client"

import { Fragment, useMemo, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale/es"
import { Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { useCurrency } from "@/contexts/currency-context"
import { Account, Transaction } from '@/types'
import { DeleteTransactionModal } from "@/components/modals/delete-transaction-modal"

interface TransactionHistoryProps {
  accounts: Account[]
  transactions: Transaction[]
  removeTransaction: (transactionId: string, refund?: boolean) => void
}

interface TransactionGroup {
  dateKey: string
  dateLabel: string
  items: Transaction[]
}

export function TransactionHistory({
  accounts,
  transactions,
  removeTransaction
}: TransactionHistoryProps) {
  const { t, language } = useLanguage()
  const { formatCurrency } = useCurrency()
  const [deleteTarget, setDeleteTarget] = useState<{
    transaction: Transaction
    accountName: string
  } | null>(null)

  // Set locale based on language
  const locale = language === "es" ? es : undefined

  // Newest -> oldest, grouped by calendar day
  const groupedTransactions = useMemo<TransactionGroup[]>(() => {
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const groups: TransactionGroup[] = []

    for (const transaction of sorted) {
      const date = new Date(transaction.date)
      const dateKey = format(date, "yyyy-MM-dd")
      const dateLabel = format(date, "d 'de' MMMM, yyyy", { locale })

      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.dateKey === dateKey) {
        lastGroup.items.push(transaction)
      } else {
        groups.push({ dateKey, dateLabel, items: [transaction] })
      }
    }

    return groups
  }, [transactions, locale])

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
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("description")}</TableHead>
                    <TableHead>{t("account")}</TableHead>
                    <TableHead className="text-right">{t("amount")}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedTransactions.map((group) => (
                    <Fragment key={group.dateKey}>
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={4}
                          className="bg-muted/50 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground capitalize"
                        >
                          {group.dateLabel}
                        </TableCell>
                      </TableRow>
                      {group.items.map((transaction) => {
                        const account = accounts.find((acc) => acc.id === transaction.account)
                        const accountName = account?.name || t("unknownAccount")
                        const description = transaction.description || "—"

                        return (
                          <TableRow key={transaction.id}>
                            <TableCell>{description}</TableCell>
                            <TableCell className="capitalize">{accountName}</TableCell>
                            <TableCell className={`text-right ${transaction.amount < 0 ? "text-red-500" : ""}`}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                aria-label={`${t("delete")}: ${description}`}
                                title={`${t("delete")}: ${description}`}
                                onClick={() =>
                                  setDeleteTarget({
                                    transaction,
                                    accountName
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-4 md:hidden">
              {groupedTransactions.map((group) => (
                <div key={group.dateKey} className="space-y-2">
                  <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground capitalize">
                    {group.dateLabel}
                  </h3>
                  <div className="space-y-3">
                    {group.items.map((transaction) => {
                      const account = accounts.find((acc) => acc.id === transaction.account)
                      const accountName = account?.name || t("unknownAccount")
                      const description = transaction.description || "—"

                      return (
                        <article
                          key={transaction.id}
                          className="rounded-lg border bg-card p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="break-words font-medium leading-5">{description}</p>
                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                <span className="capitalize break-words">{accountName}</span>
                              </div>
                            </div>
                            <p className={`shrink-0 text-right font-semibold ${transaction.amount < 0 ? "text-red-500" : ""}`}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </p>
                          </div>

                          <div className="mt-3 flex justify-end border-t pt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              aria-label={`${t("delete")}: ${description}`}
                              title={`${t("delete")}: ${description}`}
                              onClick={() =>
                                setDeleteTarget({
                                  transaction,
                                  accountName
                                })
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
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
