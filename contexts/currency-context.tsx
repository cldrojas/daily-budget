"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useLanguage } from "./language-context"

// Define available currencies
export type Currency = "USD" | "EUR" | "CLP" | "MXN" | "ARS" | "BRL"

// Define currency configurations
export const currencies = {
  USD: {
    code: "USD",
    name: "US Dollar",
    locales: {
      en: "en-US",
      es: "es-US",
    },
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    locales: {
      en: "en-IE", // Using Ireland as an example for English Euro formatting
      es: "es-ES", // Using Spain for Spanish Euro formatting
    },
  },
  CLP: {
    code: "CLP",
    name: "Chilean Peso",
    locales: {
      en: "es-CL", // Using Chilean locale for both languages since it's specific to the currency
      es: "es-CL",
    },
  },
  MXN: {
    code: "MXN",
    name: "Mexican Peso",
    locales: {
      en: "en-MX",
      es: "es-MX",
    },
  },
  ARS: {
    code: "ARS",
    name: "Argentine Peso",
    locales: {
      en: "es-AR", // Using Argentine locale for both languages
      es: "es-AR",
    },
  },
  BRL: {
    code: "BRL",
    name: "Brazilian Real",
    locales: {
      en: "en-BR",
      es: "pt-BR", // Using Portuguese for Brazilian Real
    },
  },
}

// Create the context
type CurrencyContextType = {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatCurrency: (amount: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Create the provider
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage()
  const [currency, setCurrency] = useState<Currency>("CLP") // Default to CLP

  // Function to format currency using Intl.NumberFormat
  const formatCurrency = (amount: number) => {
    const currencyConfig = currencies[currency]
    const locale = currencyConfig.locales[language] || currencyConfig.locales.en

    // Use Intl.NumberFormat for proper currency formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      // Some currencies like CLP don't use decimal places
      minimumFractionDigits: currency === "CLP" ? 0 : undefined,
      maximumFractionDigits: currency === "CLP" ? 0 : undefined,
    })

    return formatter.format(amount)
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>{children}</CurrencyContext.Provider>
  )
}

// Custom hook to use the currency context
export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}
