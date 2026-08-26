"use client"

import { useState } from "react"
import { Menu, Sun, Moon, LogOut, User, Globe, CreditCard } from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage, type Language, translations } from "@/contexts/language-context"
import { useCurrency, type Currency, currencies } from "@/contexts/currency-context"
import { UserMenu } from "@/components/user-menu"
import { LanguageCurrencySelector } from "@/components/language-currency-selector"

export function HeaderMenu() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { t, language, setLanguage } = useLanguage()
  const { currency, setCurrency } = useCurrency()
  const router = useRouter()

  const isDarkMode = (theme || resolvedTheme) === "dark"

  const handleSignOut = async () => {
    await signOut()
    setOpen(false)
    router.replace("/login")
    router.refresh()
  }

  return (
    <>
      {/* Desktop: inline icons */}
      <div className="hidden sm:flex items-center space-x-2">
        <UserMenu />
        <LanguageCurrencySelector />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDarkMode ? "light" : "dark")}
          title={isDarkMode ? t("lightMode") : t("darkMode")}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile: hamburger + sheet */}
      <div className="sm:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <SheetHeader className="p-6 pb-4">
              <SheetTitle>{t("appName")}</SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col px-6 pb-6" aria-label="Menu options">
              {/* User info */}
              {user && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-none">
                      {user.email?.split("@")[0] ?? ""}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Language */}
              <div className="py-3">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("language") || "Language"}</span>
                </div>
                <div className="flex gap-2 pl-7">
                  {(Object.keys(translations) as Language[]).map((lang) => (
                    <Button
                      key={lang}
                      variant={language === lang ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => setLanguage(lang)}
                    >
                      {lang === "en" ? "English" : "Español"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div className="py-3">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("currency") || "Currency"}</span>
                </div>
                <div className="flex flex-wrap gap-2 pl-7">
                  {(Object.keys(currencies) as Currency[]).map((curr) => (
                    <Button
                      key={curr}
                      variant={currency === curr ? "default" : "outline"}
                      size="sm"
                      className="h-8"
                      onClick={() => setCurrency(curr)}
                    >
                      {curr}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Theme toggle */}
              <button
                className="flex items-center gap-3 py-3 w-full text-left hover:bg-muted/50 rounded-md px-1 -ml-1 transition-colors"
                onClick={() => setTheme(isDarkMode ? "light" : "dark")}
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {isDarkMode ? t("lightMode") : t("darkMode")}
                </span>
              </button>

              <Separator />

              {/* Sign out */}
              {user && (
                <button
                  className="flex items-center gap-3 py-3 w-full text-left hover:bg-muted/50 rounded-md px-1 -ml-1 transition-colors text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("authSignOut")}</span>
                </button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
