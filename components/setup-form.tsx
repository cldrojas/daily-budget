'use client'

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { Int, toInt } from "@/types";

/**
 * Component for setting up the initial budget.
 * @param onSetup - Callback function to handle setup with start amount and end date.
 * @returns JSX element for the setup form.
 * @example
 * <SetupForm onSetup={(data) => console.log(data)} />
 */
export function SetupForm({
  onSetup
}: {
  onSetup: (data: { startAmount: Int; endDate: Date }) => void
}) {
  const { t } = useLanguage()
  const [startAmount, setStartAmount] = useState(0 as Int)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!startAmount || startAmount <= 0 || !endDate) return

    onSetup({
      startAmount: startAmount,
      endDate
    })
  }

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
              value={startAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStartAmount(toInt(e.target.valueAsNumber))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{t('endDate')}</Label>
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              className="w-full"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
          >
            {t('startTracking')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}