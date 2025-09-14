"use client"

import { ArrowLeft, Tags, Sparkles } from "lucide-react"
import { Button } from "./ui/button"

export default function ChatHeader({
  onBack,
  name,
  platformIcon
}: {
  onBack: () => void
  name: string
  platformIcon: React.ReactNode
}) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Botón Volver */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-700">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Volver
          </button>
          <div>
            <p className="text-base font-semibold text-gray-900">{name}</p>
            <div className="flex items-center text-sm text-gray-500">
              {platformIcon}
              <span className="ml-1">Instagram</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Tags className="h-4 w-4" />
            Marcar como Gestionado
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Sparkles className="h-4 w-4" />
            Asistente IA
          </Button>
        </div>
      </div>
    </div>
  )
}
