import { Card } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import type { CommunityData } from "../../types/community"

interface CommunityFormProps {
  communityData: CommunityData
}

export function CommunityForm({ communityData }: CommunityFormProps) {
  return (
    <Card className="overflow-hidden shadow-lg bg-white">
      {/* Header */}
      <div className="text-center p-6 border-b bg-gray-50">
        <h1 className="text-2xl font-bold mb-2 text-gray-900">{communityData.title}</h1>
        <p className="text-gray-600">Completa el formulario para unirte a nuestra comunidad</p>
      </div>

      {/* Form Content */}
      <div className="p-6 space-y-6">
        {/* Form Fields */}
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Nombre completo</Label>
            <Input
              placeholder="Tu nombre completo"
              className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-12"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Email</Label>
            <Input
              placeholder="tu@email.com"
              className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-12"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Teléfono (opcional)</Label>
            <Input
              placeholder="+1 234 567 8900"
              className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-12"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">¿Por qué quieres unirte?</Label>
            <Textarea
              placeholder="Cuéntanos qué esperas obtener de la comunidad..."
              className="w-full min-h-[120px] resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-4">
          <Button
            size="lg"
            className="w-full mb-4 bg-black text-white hover:bg-gray-800 rounded-xl h-12 text-base font-medium"
          >
            {communityData.buttonText}
          </Button>

          <p className="text-xs text-gray-500">
            Al unirte, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>
    </Card>
  )
}
