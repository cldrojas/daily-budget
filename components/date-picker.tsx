'use client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useLanguage } from '@/contexts/language-context'

export function DatePicker({
  date,
  setDate,
  className,
  allowPrevious = false
}: {
  date: Date | undefined
  setDate: (date: Date) => void
  className?: string
  allowPrevious?: boolean
}) {
  const { language, t } = useLanguage()

  // Set locale based on language
  const locale = language === 'es' ? es : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP', { locale }) : <span>{t('pickDate')}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(date) => {
            date && setDate(date)
            // Close the popover after date selection
            const popover = document.querySelector("[data-radix-popper-content-wrapper]");
            if (popover) {
              popover.setAttribute("style", "opacity: 0; pointer-events: none;");

            }
          }}
          initialFocus
          disabled={(date) => (allowPrevious ? date > new Date() : date < new Date())}
          locale={locale}
        />
      </PopoverContent>
    </Popover>
  )
}
