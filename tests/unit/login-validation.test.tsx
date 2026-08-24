import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage, { loginSchema, signUpSchema } from '@/app/login/page'
import { LanguageProvider } from '@/contexts/language-context'
import { AuthProvider } from '@/contexts/auth-context'

// Mocks necesarios: useRouter (LoginPage) y cliente Supabase (AuthProvider).
const { mockRouter, mockAuth } = vi.hoisted(() => ({
  mockRouter: {
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  },
  mockAuth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: mockAuth }),
}))

function renderLogin(language: 'en' | 'es' = 'es') {
  localStorage.setItem('language', language)
  render(
    <LanguageProvider>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </LanguageProvider>
  )
}

/** Espera a que el form de login esté listo (isLoading resuelto en AuthProvider). */
async function waitForLoginForm() {
  return screen.findByRole('tab', { name: /iniciar sesión|sign in/i })
}

describe('loginSchema', () => {
  it('rejects invalid email and short password', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: '' })
    expect(result.success).toBe(false)
  })

  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'secret123' })
    expect(result.success).toBe(true)
  })
})

describe('signUpSchema', () => {
  it('rejects password shorter than 8 chars', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.com',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid signup', () => {
    const result = signUpSchema.safeParse({
      email: 'a@b.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    })
    expect(result.success).toBe(true)
  })
})

describe('LoginPage form', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
    mockAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
  })

  it('shows translated validation errors when submitting empty login (es)', async () => {
    const user = userEvent.setup()
    renderLogin('es')
    await waitForLoginForm()
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(await screen.findByText('Ingresa un correo electrónico válido.')).toBeInTheDocument()
    expect(await screen.findByText('La contraseña es obligatoria.')).toBeInTheDocument()
  })

  it('shows translated validation errors in English', async () => {
    const user = userEvent.setup()
    renderLogin('en')
    await waitForLoginForm()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
  })

  it('calls signIn and navigates to / on valid credentials', async () => {
    const user = userEvent.setup()
    renderLogin('es')
    await waitForLoginForm()
    await user.type(screen.getByLabelText('Correo electrónico'), 'a@b.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secret123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() =>
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: 'secret123',
      })
    )
    expect(mockRouter.replace).toHaveBeenCalledWith('/')
    expect(mockRouter.refresh).toHaveBeenCalled()
  })

  it('shows server error message when credentials are invalid', async () => {
    const user = userEvent.setup()
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    })
    renderLogin('es')
    await waitForLoginForm()
    await user.type(screen.getByLabelText('Correo electrónico'), 'a@b.com')
    await user.type(screen.getByLabelText('Contraseña'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText('Correo o contraseña inválidos.')).toBeInTheDocument()
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it('shows translated rate limit error on signup (es)', async () => {
    const user = userEvent.setup()
    mockAuth.signUp.mockResolvedValue({
      data: {},
      error: { message: 'Email rate limit exceeded' },
    })
    renderLogin('es')
    await waitForLoginForm()
    await user.click(screen.getByRole('tab', { name: /crear cuenta/i }))
    await user.type(screen.getByLabelText('Correo electrónico'), 'new@b.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secret123')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'secret123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(
      await screen.findByText('Demasiados intentos. Inténtalo de nuevo en un momento.')
    ).toBeInTheDocument()
  })

  it('falls back to generic translated error for unknown server errors (es)', async () => {
    const user = userEvent.setup()
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'some cryptic upstream error' },
    })
    renderLogin('es')
    await waitForLoginForm()
    await user.type(screen.getByLabelText('Correo electrónico'), 'a@b.com')
    await user.type(screen.getByLabelText('Contraseña'), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText('Algo salió mal. Inténtalo de nuevo.')).toBeInTheDocument()
  })

  it('shows confirmation message after signup when email confirmation is required', async () => {
    const user = userEvent.setup()
    mockAuth.signUp.mockResolvedValue({ data: { session: null }, error: null })
    renderLogin('es')
    await waitForLoginForm()
    await user.click(screen.getByRole('tab', { name: /crear cuenta/i }))
    await user.type(screen.getByLabelText('Correo electrónico'), 'new@b.com')
    await user.type(screen.getByLabelText('Contraseña'), 'secret123')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'secret123')
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    expect(
      await screen.findByText('Revisa tu correo para confirmar tu cuenta y luego inicia sesión.')
    ).toBeInTheDocument()
  })
})
