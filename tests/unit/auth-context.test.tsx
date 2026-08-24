import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/auth-context'

// Mock del cliente Supabase: auth-context crea el cliente a nivel de módulo.
const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: mockAuth }),
}))

// Componente sonda para leer el estado del contexto.
function Probe({ onReady }: { onReady: (ctx: ReturnType<typeof useAuth>) => void }) {
  const ctx = useAuth()
  onReady(ctx)
  return <div>user:{ctx.user?.email ?? 'none'}</div>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })
  })

  it('initializes isLoading=false with no session', async () => {
    let captured: ReturnType<typeof useAuth> | undefined
    render(
      <AuthProvider>
        <Probe onReady={(ctx) => (captured = ctx)} />
      </AuthProvider>
    )
    await waitFor(() => expect(captured?.isLoading).toBe(false))
    expect(captured?.user).toBeNull()
    expect(mockAuth.getSession).toHaveBeenCalled()
  })

  it('exposes the user when a session exists', async () => {
    const fakeUser = { id: 'u-1', email: 'a@b.com' }
    mockAuth.getSession.mockResolvedValue({
      data: { session: { user: fakeUser } },
      error: null,
    })
    let captured: ReturnType<typeof useAuth> | undefined
    render(
      <AuthProvider>
        <Probe onReady={(ctx) => (captured = ctx)} />
      </AuthProvider>
    )
    await waitFor(() => expect(captured?.user?.email).toBe('a@b.com'))
    expect(captured?.isLoading).toBe(false)
  })

  it('signIn delegates to signInWithPassword', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
    let captured: ReturnType<typeof useAuth> | undefined
    render(
      <AuthProvider>
        <Probe onReady={(ctx) => (captured = ctx)} />
      </AuthProvider>
    )
    await waitFor(() => expect(captured?.isLoading).toBe(false))

    const result = await captured!.signIn('a@b.com', 'secret123')
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret123',
    })
    expect(result.error).toBeNull()
  })

  it('signIn propagates errors', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    })
    let captured: ReturnType<typeof useAuth> | undefined
    render(
      <AuthProvider>
        <Probe onReady={(ctx) => (captured = ctx)} />
      </AuthProvider>
    )
    await waitFor(() => expect(captured?.isLoading).toBe(false))

    const result = await captured!.signIn('a@b.com', 'bad')
    expect(result.error?.message).toBe('Invalid login credentials')
  })

  it('signUp flags requiresEmailConfirmation when no session is returned', async () => {
    mockAuth.signUp.mockResolvedValue({ data: { session: null }, error: null })
    let captured: ReturnType<typeof useAuth> | undefined
    render(
      <AuthProvider>
        <Probe onReady={(ctx) => (captured = ctx)} />
      </AuthProvider>
    )
    await waitFor(() => expect(captured?.isLoading).toBe(false))

    const result = await captured!.signUp('new@b.com', 'secret123')
    expect(mockAuth.signUp).toHaveBeenCalledWith({ email: 'new@b.com', password: 'secret123' })
    expect(result.requiresEmailConfirmation).toBe(true)
    expect(result.error).toBeNull()
  })

  it('signUp does not require confirmation when a session is returned', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { session: { user: { id: 'u-2', email: 'new@b.com' } } },
      error: null,
    })
    let captured: ReturnType<typeof useAuth> | undefined
    render(
      <AuthProvider>
        <Probe onReady={(ctx) => (captured = ctx)} />
      </AuthProvider>
    )
    await waitFor(() => expect(captured?.isLoading).toBe(false))

    const result = await captured!.signUp('new@b.com', 'secret123')
    expect(result.requiresEmailConfirmation).toBe(false)
  })

  it('signOut delegates to auth.signOut', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null })
    let captured: ReturnType<typeof useAuth> | undefined
    render(
      <AuthProvider>
        <Probe onReady={(ctx) => (captured = ctx)} />
      </AuthProvider>
    )
    await waitFor(() => expect(captured?.isLoading).toBe(false))

    const result = await captured!.signOut()
    expect(mockAuth.signOut).toHaveBeenCalled()
    expect(result.error).toBeNull()
  })

  it('subscribes to auth state changes', async () => {
    let captured: ReturnType<typeof useAuth> | undefined
    render(
      <AuthProvider>
        <Probe onReady={(ctx) => (captured = ctx)} />
      </AuthProvider>
    )
    await waitFor(() => expect(captured?.isLoading).toBe(false))
    expect(mockAuth.onAuthStateChange).toHaveBeenCalled()
  })
})
