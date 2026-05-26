'use client'

import React, { useState } from 'react'
import { Account, Budget, Int } from '@/types'
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Building,
  Briefcase,
  Gift,
  Heart,
  Home,
  Landmark,
  Plane,
  ShoppingBag,
  Smartphone,
  Utensils,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { AccountEditModal } from './modals/account-edit-modal'
import { AccountModal } from './modals/account-modal'

// Default account IDs that cannot be deleted
const DEFAULT_ACCOUNT_IDS = ['daily', 'savings', 'investment']

// Map of icon IDs to icon components
const iconMap = {
  wallet: Wallet,
  piggybank: PiggyBank,
  trending: TrendingUp,
  creditcard: CreditCard,
  building: Building,
  briefcase: Briefcase,
  gift: Gift,
  heart: Heart,
  home: Home,
  landmark: Landmark,
  plane: Plane,
  shopping: ShoppingBag,
  smartphone: Smartphone,
  utensils: Utensils
}

interface AccountsListProps {
  accounts: Account[]
  budget: Budget
  onAddAccount: (account: Omit<Account, 'id'>) => void
  onUpdateAccount: (account: Account) => void
  onDeleteAccount: (accountId: string) => boolean
}

export function AccountsList({
  accounts,
  budget,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}: AccountsListProps) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Filter accounts based on mode (hide savings in track mode)
  const isTrackMode =
    budget.mode === 'track' || (!budget.mode && !budget.endDate)
  const filteredAccounts = isTrackMode
    ? accounts.filter((acc) => acc.id !== 'savings')
    : accounts

  const handleEditClick = (account: Account) => {
    setEditingAccount(account)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = (updatedAccount: {
    id?: string
    name: string
    balance: Int
    icon: string
  }) => {
    if (editingAccount) {
      onUpdateAccount({
        ...editingAccount,
        ...updatedAccount
      })
    }
  }

  const getAccountIcon = (account: Account) => {
    const IconComponent =
      iconMap[account.icon as keyof typeof iconMap] || Wallet
    return <IconComponent className="h-10 w-10" />
  }

  const canDeleteAccount = (accountId: string) => {
    return !DEFAULT_ACCOUNT_IDS.includes(accountId)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 overflow-scroll">
        {filteredAccounts.map((account) => (
          <Card
            key={account.id}
            className="cursor-pointer aspect-square flex flex-col items-center justify-center gap-2 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
            onClick={() => handleEditClick(account)}
          >
            <div className="h-10 w-10 text-muted-foreground">
              {getAccountIcon(account)}
            </div>
            <span className="text-sm font-medium text-center truncate w-full">
              {account.name}
            </span>
            <span className="text-2xl font-bold">
              {formatCurrency(account.balance)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t(account.type)} {t('account')}
            </span>
          </Card>
        ))}

        {/* Add new account button matching square card style */}
        <Button
          variant="outline"
          className="aspect-square flex flex-col items-center justify-center gap-2 border-dashed h-auto"
          onClick={() => setIsAccountModalOpen(true)}
        >
          <Plus className="h-8 w-8" />
          <span className="text-sm">{t('addNewAccount')}</span>
        </Button>
      </div>

      {/* Account Creation Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onAddAccount={onAddAccount}
        accounts={accounts}
      />

      {/* Account Edit Modal */}
      {editingAccount && (
        <AccountEditModal
          account={editingAccount}
          key={editingAccount?.id}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
          onDeleteAccount={onDeleteAccount}
          accountId={editingAccount.id}
          canDelete={canDeleteAccount(editingAccount.id)}
        />
      )}
    </div>
  )
}
