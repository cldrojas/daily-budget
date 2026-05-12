'use client'

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { Int, toInt } from "@/types";
import { Checkbox } from "./ui/checkbox";

/**
 * Component for setting up the initial budget.
 * @param onSetup - Callback function to handle setup with start amount and optional end date.
 * @returns JSX element for the setup form.
 * @example
 * <SetupForm onSetup={(data) => console.log(data)} />
 */
export function SetupForm({
  onSetup
}: {
  onSetup: (data: { startAmount: Int; endDate?: Date; hasEndDate: boolean }) => void
}) {
  const { t } = useLanguage()
  const [startAmount, setStartAmount] = useState<Int | null>(null)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [hasEndDate, setHasEndDate] = useState(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!startAmount || startAmount <= 0) return
    if (hasEndDate && !endDate) return

    onSetup({
      startAmount: startAmount,
      endDate: hasEndDate ? endDate : undefined,
      hasEndDate
    })
  }

  const isValid = startAmount !== null && startAmount > 0 && (!hasEndDate || endDate !== undefined)

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('setupTitle')}</CardTitle>
        <CardDescription>{t('setupDescription')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startAmount">{t('startingAmount')}</Label>
            <Input
              id="startAmount"
              type="number"
              placeholder="2750000"
              autoFocus
              value={startAmount ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStartAmount(toInt(e.target.valueAsNumber) || null)
              }
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasEndDate"
                checked={hasEndDate}
                onCheckedChange={(checked) => {
                  setHasEndDate(checked === true)
                  if (!checked) setEndDate(undefined)
                }}
              />
              <Label htmlFor="hasEndDate" className="cursor-pointer">{t('addEndDate')}</Label>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{t('addEndDateDescription')}</p>
          </div>
          {hasEndDate && (
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('endDate')}</Label>
              <DatePicker
                date={endDate}
                setDate={setEndDate}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid}
          >
            {t('startTracking')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}