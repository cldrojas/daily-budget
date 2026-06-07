import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Import — Saldo Cero',
  description: 'Import bank transactions from Gmail',
}

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
