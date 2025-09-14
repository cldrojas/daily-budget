'use client'

import { useEffect, useState } from 'react'
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
  Utensils
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useLanguage } from '@/contexts/language-context'
import { Account } from '@/types'

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

export function AccountEditModal({ account, isOpen, onClose, onSave }: {account: Account | null, isOpen: boolean, onClose: () => void, onSave: (account: Account) => void }) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [accountName, setAccountName] = useState(account?.name || '')
  const [accountBalance, setAccountBalance] = useState(account?.balance || 0)
  const [selectedIcon, setSelectedIcon] = useState(account?.icon || 'wallet')
  const [parentId, setParentId] = useState(account?.parentId || '')

  useEffect(() => {
    if (account) {
      setAccountName(account.name)
      setAccountBalance(account.balance)
      setSelectedIcon(account.icon || 'wallet')
      setParentId(account.parentId || '')
    }
  }, [account])

  const handleSubmit = (e: React.FormEvent) => {
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
      id: account?.id,
      name: accountName,
      icon: selectedIcon,
      balance: Number(accountBalance) || 0,
      parentId: parentId || null
    })

    toast({
      title: t('accountUpdated'),
      description: t('accountUpdatedDescription', { name: accountName })
    })

    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('editAccount')}</DialogTitle>
            <DialogDescription>{t('editAccountDescription')}</DialogDescription>
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
                value={accountBalance}
                onChange={(e) => setAccountBalance(Number(e.target.value))}
                placeholder={t('accountBalancePlaceholder')}
                type="number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="parentId">{t('parentAccount')}</Label>
              <Input
                id="parentId"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                placeholder={t('parentAccountPlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label>{t('accountIcon')}</Label>
              <div className="grid grid-cols-7 gap-2">
                {availableIcons.map((iconObj) => {
                  const IconComponent = iconObj.icon
                  return (
                    <Button
                      key={iconObj.id}
                      type="button"
                      variant={selectedIcon === iconObj.id ? 'default' : 'outline'}
                      className="h-10 w-10 p-0"
                      onClick={() => setSelectedIcon(iconObj.id)}
                      title={iconObj.name}
                    >
                      <IconComponent className="h-5 w-5" />
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              {t('cancel')}
            </Button>
            <Button type="submit">{t('saveChanges')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
