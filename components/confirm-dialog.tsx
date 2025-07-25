'use client'

import { Root, Portal, Overlay, Content, Title, Description, Cancel, Action } from '@radix-ui/react-alert-dialog'
import { Button } from '@/components/ui/button'

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = '¿Estás seguro?',
  description = 'Esta acción no se puede deshacer.',
  confirmText = 'Sí, continuar',
  cancelText = 'Cancelar',
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
}) {
  return (
    <Root open={open} onOpenChange={onOpenChange}>
      <Portal>
        <Overlay className="fixed inset-0 bg-black/50" />
        <Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <Title className="text-lg font-bold text-black/80">{title}</Title>
          <Description className="mt-2  text-gray-600">{description}</Description>
          <div className="mt-6 flex justify-end gap-2">
            <Cancel asChild>
              <Button variant="outline">{cancelText}</Button>
            </Cancel>
            <Action asChild>
              <Button variant='destructive' onClick={onConfirm}>{confirmText}</Button>
            </Action>
          </div>
        </Content>
      </Portal>
    </Root>
  )
}