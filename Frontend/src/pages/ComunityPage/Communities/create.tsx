"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CommunityBuilder } from "../../../components/community/CommunityBuilder"
import type { CommunityData } from "../../../types/community"

export default function CreateCommunityPage() {
  const navigate = useNavigate()
  const [isPublishing, setIsPublishing] = useState(false)

  const [communityData, setCommunityData] = useState<CommunityData>({
    // Sección Hero
    title: "Únete a Nuestra Comunidad Exclusiva",
    subtitle: "Aprende, Conecta y Crece",
    description:
      "Una comunidad vibrante de emprendedores, creativos y profesionales que comparten conocimientos y se apoyan mutuamente para alcanzar el éxito.",
    buttonText: "Únete Ahora",
    mediaFile: null,
    mediaPreview: "",

    // Información de la Comunidad
    communityName: "Emprendedores Pro",
    members: 1248,
    rating: 4.8,

    // Características
    isActive: true,
    category: "Comunidad privada",
    customUrl: "",
  })

  const handlePublish = async () => {
    setIsPublishing(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const communities = JSON.parse(localStorage.getItem("communities") || "[]")
    const newCommunity = {
      id: Date.now().toString(),
      ...communityData,
      createdAt: new Date().toISOString(),
    }

    communities.push(newCommunity)
    localStorage.setItem("communities", JSON.stringify(communities))
    navigate(`/communities/${newCommunity.id}`)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/communities">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-lg font-semibold">Constructor de Landing - Comunidades</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Guardar
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-black text-white hover:bg-gray-800"
          >
            {isPublishing ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      </div>

      <CommunityBuilder communityData={communityData} setCommunityData={setCommunityData} />
    </div>
  )
}
