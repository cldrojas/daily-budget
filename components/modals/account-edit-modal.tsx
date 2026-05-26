'use client'

import { useState } from 'react'
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
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/language-context'
import { useCurrency } from '@/contexts/currency-context'
import { Int, toInt } from '@/types'

// Define available icons
const availableIcons = [
  { id: 'wallet', icon: Wallet, name: 'Wallet' },
  { id: 'piggybank', icon: PiggyBank, name: 'Piggy Bank' },
  { id: 'trending', icon: TrendingUp, name: 'Trending' },
  { id: 'creditcard', icon: CreditCard, name: 'Credit Card' },
  { id: 'building', icon: Building, name: 'Building' },
  { id: 'briefcase', icon: Briefcase, name: 'Briefcase' },
  { id: 'gift', icon: Gift, name: 'Gift' },
  { id: 'heart', icon: Heart, name: 'Heart' },
  { id: 'home', icon: Home, name: 'Home' },
  { id: 'landmark', icon: Landmark, name: 'Landmark' },
  { id: 'plane', icon: Plane, name: 'Plane' },
  { id: 'shopping', icon: ShoppingBag, name: 'Shopping' },
  { id: 'smartphone', icon: Smartphone, name: 'Smartphone' },
  { id: 'utensils', icon: Utensils, name: 'Utensils' }
]

export function AccountEditModal({
  account,
  isOpen,
  onClose,
  onSave,
  onDeleteAccount,
  accountId,
  canDelete
}: {
  account: { id: string; name: string; balance: Int; icon: string } | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedAccount: { id?: string; name: string; balance: Int; icon: string }) => void
  onDeleteAccount?: (accountId: string) => boolean
  accountId: string
  canDelete: boolean
}) {
  const { t } = useLanguage()
  const { formatCurrency } = useCurrency()
  const { toast } = useToast()
  const [accountName, setAccountName] = useState(account?.name || '')
  const [accountBalance, setAccountBalance] = useState(
    toInt(account?.balance || 0)
  )
  const [selectedIcon, setSelectedIcon] = useState(account?.icon || 'wallet')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!accountName.trim()) {
      toast({
        title: t('invalidAccountName'),
        description: t('invalidAccountNameDescription'),
        variant: 'destructive'
      })
      return
    }

    onSave({
      ...account,
      name: accountName,
      icon: selectedIcon,
      balance: accountBalance || (0 as Int)
    })

    toast({
      title: t('accountUpdated'),
      description: t('accountUpdatedDescription', { name: accountName })
    })

    onClose()
  }

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (onDeleteAccount && accountId) {
      onDeleteAccount(accountId)
    }
    setIsDeleteDialogOpen(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('editAccount')}</DialogTitle>
            <DialogDescription>
              {t('editAccountDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="accountName">{t('accountName')}</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder={t('accountNamePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="accountBalance">{t('Balance')}</Label>
              <Input
                id="accountBalance"
                autoFocus
                data-testid="edit-account-balance"
                value={accountBalance || ''}
                onChange={(e) =>
                  setAccountBalance(toInt(Number(e.target.value) || 0))
                }
                placeholder={t('accountBalancePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('accountIcon')}</Label>
              <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
                {availableIcons.map(({ id, icon, name }) => {
                  const IconComponent = icon
                  return (
                    <Button
                      key={id}
                      type="button"
                      variant={selectedIcon === id ? 'default' : 'outline'}
                      className="h-10 w-10 p-0"
                      onClick={() => setSelectedIcon(id)}
                      title={name}
                    >
                      <IconComponent className="h-5 w-5" />
                    </Button>
                  )
                })}
              </div>
            </div>
            {canDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteClick}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('deleteAccount')}
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit">{t('saveChanges')}</Button>
          </DialogFooter>
        </form>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteAccount')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteAccountConfirmation', { name: account?.name || '' })}
                {account && account.balance > 0 && (
                  <span className="mt-2 font-medium block">
                    {t('deleteAccountBalance', {
                      balance: formatCurrency(account.balance),
                      savings: t('savings')
                    })}
                  </span>
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
      </DialogContent>
    </Dialog>
  )
}
