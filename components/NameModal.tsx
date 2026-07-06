import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface NameModalProps {
  open: boolean
  onSubmit: (firstName: string, lastName: string) => void
}

export function NameModal({ open, onSubmit }: NameModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async () => {
    setIsSaving(true)
    await onSubmit(firstName.trim(), lastName.trim())
    setIsSaving(false)
    setFirstName('')
    setLastName('')
  }

  return (
    <Dialog open={open}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} hideClose>
        <DialogHeader>
          <DialogTitle>Ingresá tu nombre para guardar tu puntaje</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <input
            className="w-full p-2 border rounded"
            placeholder="Nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isSaving}
          />
          <input
            className="w-full p-2 border rounded"
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={isSaving}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!firstName || !lastName || isSaving}
          >
            {isSaving ? 'Guardando...' : 'Guardar puntaje'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
