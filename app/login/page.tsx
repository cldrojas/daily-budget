"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { useFormContext } from "react-hook-form"

const loginSchema = z.object({
  email: z.string().email("authInvalidEmail"),
  password: z.string().min(1, "authPasswordRequired"),
})

const signUpSchema = z
  .object({
    email: z.string().email("authInvalidEmail"),
    password: z.string().min(8, "authPasswordMin"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "authPasswordMismatch",
  })

type LoginValues = z.infer<typeof loginSchema>
type SignUpValues = z.infer<typeof signUpSchema>

export { loginSchema, signUpSchema }

/** Muestra el mensaje de error de un campo traduciendo la key que devuelve zod. */
function TranslatedFormMessage({ name }: { name: "email" | "password" | "confirmPassword" }) {
  const { t } = useLanguage()
  const { formState } = useFormContext()
  const error = formState.errors[name]
  if (!error) return null
  return <p className="text-sm font-medium text-destructive">{t(String(error.message))}</p>
}

/** Mapea mensajes conocidos de Supabase a claves i18n. */
function translateAuthError(t: (key: string) => string, message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("invalid login credentials")) return t("authInvalidCredentials")
  if (lower.includes("email not confirmed")) return t("authCheckEmail")
  if (lower.includes("already registered")) return t("authEmailInUse")
  if (lower.includes("password should be at least")) return t("authPasswordMin")
  if (lower.includes("email_address_invalid")) return t("authInvalidEmail")
  if (lower.includes("rate limit")) return t("authRateLimit")
  return t("authGenericError")
}

function LoginForm() {
  const { t } = useLanguage()
  const { signIn } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = async (values: LoginValues) => {
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(values.email, values.password)
    setSubmitting(false)

    if (error) {
      setError(translateAuthError(t, error.message))
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("authEmail")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("authEmailPlaceholder")}
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <TranslatedFormMessage name="email" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("authPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <TranslatedFormMessage name="password" />
            </FormItem>
          )}
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? t("authSigningIn") : t("authSignIn")}
        </Button>
      </form>
    </Form>
  )
}

function SignUpForm() {
  const { t } = useLanguage()
  const { signUp } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })

  const onSubmit = async (values: SignUpValues) => {
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    const { error, requiresEmailConfirmation } = await signUp(values.email, values.password)
    setSubmitting(false)

    if (error) {
      setError(translateAuthError(t, error.message))
      return
    }

    if (requiresEmailConfirmation) {
      setSuccess(t("authCheckEmail"))
      form.reset()
      return
    }

    // Si el provider no exige confirmación, la sesión ya existe → app.
    router.replace("/")
    router.refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("authEmail")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("authEmailPlaceholder")}
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <TranslatedFormMessage name="email" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("authPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <TranslatedFormMessage name="password" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("authConfirmPassword")}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <TranslatedFormMessage name="confirmPassword" />
            </FormItem>
          )}
        />
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        {success && <p className="text-sm font-medium text-emerald-600">{success}</p>}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitting ? t("authCreatingAccount") : t("authSignUp")}
        </Button>
      </form>
    </Form>
  )
}

export default function LoginPage() {
  const { t } = useLanguage()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Si ya hay sesión (p. ej. recarga directa con cookies), el middleware también
  // redirige, pero esto evita parpadeo en el cliente.
  useEffect(() => {
    if (!isLoading && user) router.replace("/")
  }, [isLoading, user, router])

  // Evita flash del formulario mientras se resuelve la sesión inicial.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {t("authWelcomeBack")}
          </CardTitle>
          <CardDescription>{t("authWelcomeBackDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("authSignIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("authSignUp")}</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="pt-4">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="pt-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
