import { Card } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Users, Play, ImageIcon } from "lucide-react"
import type { CommunityData } from "../../types/community"

interface CommunityPreviewProps {
  communityData: CommunityData
}

export function CommunityPreview({ communityData }: CommunityPreviewProps) {
  const isVideoFile = communityData.mediaFile?.type.startsWith("video/")

  return (
    <Card className="overflow-hidden shadow-lg bg-white">
      {/* Header with stats */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">{communityData.members.toLocaleString()} miembros</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="text-gray-600">{communityData.rating}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {communityData.isActive ? "Activa" : "Inactiva"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">{communityData.title}</h1>
        <p className="text-lg text-gray-600 mb-4">{communityData.subtitle}</p>
        <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">{communityData.description}</p>

        {/* Media Preview */}
        {communityData.mediaPreview ? (
          <div className="mb-8 rounded-xl overflow-hidden bg-gray-100">
            {isVideoFile ? (
              <div className="relative aspect-video">
                <video src={communityData.mediaPreview} className="w-full h-full object-cover" muted />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={communityData.mediaPreview || "/placeholder.svg"}
                alt="Community preview"
                className="w-full aspect-video object-cover"
              />
            )}
          </div>
        ) : (
          <div className="mb-8 aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Vista previa del media</p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="flex items-center justify-center">
          <Button size="lg" className="px-8 bg-black text-white hover:bg-gray-800 rounded-xl">
            {communityData.buttonText}
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Al unirte, aceptas nuestros términos de servicio y política de privacidad.
        </p>
      </div>
    </Card>
  )
}
