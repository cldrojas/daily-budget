'use client'

import { useState } from "react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";

export function SetupForm({
  onSetup
}: {
  onSetup: (data: { startAmount: number; endDate: Date }) => void
}) {
  const { t } = useLanguage()
  const [startAmount, setStartAmount] = useState(0)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!startAmount || !endDate) return

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
              placeholder="1000.00"
              value={startAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setStartAmount(e.target.valueAsNumber)
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