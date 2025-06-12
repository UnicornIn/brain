"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { ArrowLeft, Save, Globe } from "lucide-react"
import { CommunityBuilder } from "../../../components/community/CommunityBuilder"
import type { CommunityData } from "../../../types/community"

export default function CreateCommunityPage() {
  const navigate = useNavigate()
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    // Here you would save as draft
  }

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
      <div className="bg-white border-b px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
            <Link to="/communities">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-sm lg:text-lg font-semibold truncate">
            <span className="hidden sm:inline">Constructor de Landing - Comunidades</span>
            <span className="sm:hidden">Constructor Landing</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="hidden sm:flex">
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
          <Button variant="outline" size="icon" onClick={handleSave} disabled={isSaving} className="sm:hidden">
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Globe className="h-3 w-3 mr-1 sm:mr-2" />
            {isPublishing ? (
              <span className="hidden sm:inline">Publicando...</span>
            ) : (
              <>
                <span className="hidden sm:inline">Publicar</span>
                <span className="sm:hidden">Pub</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <CommunityBuilder communityData={communityData} setCommunityData={setCommunityData} />
    </div>
  )
}
