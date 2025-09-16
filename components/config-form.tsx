"use client"

import React, { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/date-picker"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { toInt, type Budget, type Int } from "@/types"
import ConfirmDialog from "@/components/modals/confirm-dialog"
import { Checkbox } from "./ui/checkbox"
import { useBudget } from "@/hooks/use-budget"

export function ConfigForm({ budget, onUpdateConfig, onClearData }: {
  budget: Budget, onClearData: () => void, onUpdateConfig: ({ startAmount, endDate, autoSave }: {
    startAmount: Int;
    endDate: Date;
    autoSave?: boolean
  }) => void,
}) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { setLastCheckedDay } = useBudget()
  const [isOpen, setIsOpen] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [autoSave, setAutoSave] = useState(budget.autoSave)
  const [startAmount, setStartAmount] = useState(budget.startAmount.toString())
  const [endDate, setEndDate] = useState(budget.endDate)

  const getYesterday = () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
      startAmount: toInt(newStartAmount),
      endDate,
      autoSave
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
              <div className="flex justify-between mb-4">
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => {
                    const data = localStorage.getItem('daily-budget-data')
                    if (data) {
                      const blob = new Blob([data], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'daily-budget-export.json'
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }
                  }}
                >
                  {t("exportData")}
                </Button>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="autosave">{t("toggleAutoSaving")}</Label>
                <Checkbox className="ml-2" checked={autoSave} onCheckedChange={() => setAutoSave(!autoSave)} />
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={() => setLastCheckedDay(getYesterday())}
                  title={t("close")}
                >
                  Mess with the time
                </Button>
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
              title={t('youSure')} // Confirm action (clear all data?, save changes?)
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
