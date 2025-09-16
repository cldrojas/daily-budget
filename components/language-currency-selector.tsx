"use client"
import { Globe, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage, type Language, translations } from "@/contexts/language-context"
import { useCurrency, type Currency, currencies } from "@/contexts/currency-context"

export function LanguageCurrencySelector() {
  const { language, setLanguage } = useLanguage()
  const { currency, setCurrency } = useCurrency()

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Globe className="h-4 w-4" />
            <span>{language.toUpperCase()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(translations) as Language[]).map((lang) => (
            <DropdownMenuItem
              key={lang}
              onClick={() => setLanguage(lang)}
              className={language === lang ? "bg-accent" : ""}
            >
              {lang === "en" ? "English" : "Español"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <CreditCard className="h-4 w-4" />
            <span>{currency}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(currencies) as Currency[]).map((curr) => (
            <DropdownMenuItem
              key={curr}
              onClick={() => setCurrency(curr)}
              className={currency === curr ? "bg-accent" : ""}
            >
              {currencies[curr].name} ({curr})
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
