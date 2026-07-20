import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatTime } from '@/lib/utils'
import type { GameResult } from './simon-game'

interface NameModalProps {
  open: boolean
  result: GameResult | null
  onSubmit: (firstName: string, lastName: string) => void
  onClose: () => void
}

export function NameModal({ open, result, onSubmit, onClose }: NameModalProps) {
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-2">
            <Trophy className="w-12 h-12 text-yellow-500" />
            <DialogTitle className="text-2xl">¡Juego terminado!</DialogTitle>
          </div>
        </DialogHeader>
        {result && (
          <p className="text-center text-gray-700">
            Completaste {result.rounds} {result.rounds === 1 ? 'vuelta' : 'vueltas'}, acertaste{' '}
            {result.keysInRound} {result.keysInRound === 1 ? 'tecla' : 'teclas'} en la vuelta {result.rounds + 1}, en{' '}
            {formatTime(result.time)}.
          </p>
        )}
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
