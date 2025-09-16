'use client'

import React, { useState } from 'react'
import { Account, Int, toInt } from '@/types'
import {
  PlusCircle,
  Wallet,
  PiggyBank,
  TrendingUp,
  Edit,
  Trash2,
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
  Utensils
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { AccountEditModal } from './modals/account-edit-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

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
  onAddAccount: (account: Omit<Account, 'id'>) => void
  onUpdateAccount: (account: Account) => void
  onDeleteAccount: (accountId: string) => boolean
}

export function AccountsList({
  accounts,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount
}: AccountsListProps) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [isAddingAccount, setIsAddingAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState('savings')
  const [newAccountIcon, setNewAccountIcon] = useState('piggybank')
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newAccountName.trim()) {
      toast({
        title: t('invalidAccountName'),
        description: t('invalidAccountNameDescription'),
        variant: 'destructive'
      })
      return
    }

    onAddAccount({
      name: newAccountName,
      type: newAccountType,
      icon: newAccountIcon,
      balance: toInt(0)
    })

    // Reset form
    setNewAccountName('')
    setNewAccountType('savings')
    setNewAccountIcon('piggybank')
    setIsAddingAccount(false)

    // Show toast
    toast({
      title: t('accountAdded'),
      description: t('accountAddedDescription', { name: newAccountName })
    })
  }

  const handleEditClick = (account: Account) => {
    setEditingAccount(account)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (accountToDelete) {
      const success = onDeleteAccount(accountToDelete.id)
      if (success) {
        toast({
          title: t('accountDeleted'),
          description: t('accountDeletedDescription', { name: accountToDelete.name })
        })
      }
    }
    setIsDeleteDialogOpen(false)
    setAccountToDelete(null)
  }

  const handleSaveEdit = (updatedAccount: { id?: string; name: string; balance: Int; icon: string }) => {
    if (editingAccount) {
      onUpdateAccount({
        ...editingAccount,
        ...updatedAccount
      })
    }
  }

  const getAccountIcon = (account: Account) => {
    const IconComponent = iconMap[account.icon as keyof typeof iconMap] || Wallet
    return <IconComponent className="h-5 w-5" />
  }

  const canDeleteAccount = (accountId: string) => {
    return !DEFAULT_ACCOUNT_IDS.includes(accountId)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="h-5 w-5 text-muted-foreground">
                  {getAccountIcon(account)}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEditClick(account)}
                  title={t('editAccount')}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                {canDeleteAccount(account.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => handleDeleteClick(account)}
                    title={t('deleteAccount')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
              <p className="text-xs text-muted-foreground">
                {t(account.type)} {t('account')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isAddingAccount ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('addNewAccount')}</CardTitle>
            <CardDescription>{t('createNewAccount')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleAddAccount}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">{t('accountName')}</Label>
                <Input
                  id="accountName"
                  placeholder="Vacation Fund"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">{t('accountType')}</Label>
                <Select
                  value={newAccountType}
                  onValueChange={setNewAccountType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectAccountType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">{t('savings')}</SelectItem>
                    <SelectItem value="investment">{t('investment')}</SelectItem>
                    <SelectItem value="expense">{t('expense')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('accountIcon')}</Label>
                <div className="grid grid-cols-7 gap-2">
                  {Object.entries(iconMap).map(([id, Icon]) => (
                    <Button
                      key={id}
                      type="button"
                      variant={newAccountIcon === id ? 'default' : 'outline'}
                      className="h-10 w-10 p-0"
                      onClick={() => setNewAccountIcon(id)}
                    >
                      <Icon className="h-5 w-5" />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setIsAddingAccount(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit">{t('createAccount')}</Button>
            </CardFooter>
          </form>
        </Card>
      ) : (
        <Button onClick={() => setIsAddingAccount(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('addNewAccount')}
        </Button>
      )}

      {editingAccount && (
        <AccountEditModal
          account={editingAccount}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Account Confirmation Dialog */}
      {isDeleteDialogOpen && accountToDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteAccount')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteAccountConfirmation', { name: accountToDelete.name })}
                {accountToDelete.balance > 0 && (
                  <p className="mt-2 font-medium">
                    {t('deleteAccountBalance', {
                      balance: formatCurrency(accountToDelete.balance),
                      savings: t('savings')
                    })}
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground"
              >
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
