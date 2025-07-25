"use client"

import { FormEvent, useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/date-picker"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { Budget } from "@/types"
import ConfirmDialog from "./confirm-dialog"

export function ConfigForm({ budget, onUpdateConfig, onClearData }: {
  budget: Budget, onClearData: () => void, onUpdateConfig: ({ startAmount, endDate }: {
    startAmount: number;
    endDate: Date;
  }) => void
}) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [startAmount, setStartAmount] = useState(budget.startAmount.toString())
  const [endDate, setEndDate] = useState(budget.endDate)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (!startAmount || !endDate) {
      toast({
        title: t("missingInformation"),
        description: t("missingInformationDescription"),
        variant: "destructive",
      })
      return
    }

    const newStartAmount = Number.parseFloat(startAmount)

    if (isNaN(newStartAmount) || newStartAmount <= 0) {
      toast({
        title: t("invalidAmount"),
        description: t("invalidAmountDescription"),
        variant: "destructive",
      })
      return
    }

    onUpdateConfig({
      startAmount: newStartAmount,
      endDate,
    })

    setIsOpen(false)

    toast({
      title: t("configUpdated"),
      description: t("configUpdatedDescription"),
    })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="flex items-center justify-between w-full">
          <span>{t("budgetConfiguration")}</span>
          <Settings className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("updateBudgetSettings")}</CardTitle>
            <CardDescription>{t("modifyBudgetConfig")}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startAmount">{t("startingAmount")}</Label>
                <Input
                  id="startAmount"
                  type="number"
                  step="1"
                  placeholder="1000"
                  value={startAmount}
                  onChange={(e) => setStartAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t("endDate")}</Label>
                <DatePicker date={endDate} setDate={setEndDate} className="w-full" />
              </div>
              <div>
                <Button variant="destructive" onClick={(e) => {
                  e.preventDefault()
                  setShowConfirm(true)
                }}>{t("clearData")}</Button>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit">{t("updateSettings")}</Button>
            </CardFooter>
            <ConfirmDialog
              open={showConfirm}
              onOpenChange={setShowConfirm}
              onConfirm={onClearData}
              title={t('youSure')}
              description={t("undoable")}
              confirmText={t("confirm")}
              cancelText={t("cancel")}
            />
          </form>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}
