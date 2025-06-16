"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { ArrowLeft, Globe, Copy, Check } from "lucide-react"
import { CommunityBuilder } from "../../../components/community/CommunityBuilder"
import type { CommunityData } from "../../../types/community"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"

export default function CreateCommunityPage() {
  const navigate = useNavigate()
  const [isPublishing, setIsPublishing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const [communityData, setCommunityData] = useState<CommunityData>({
    title: "Únete a Nuestra Comunidad Exclusiva",
    subtitle: "Aprende, Conecta y Crece",
    description: "Una comunidad vibrante de emprendedores, creativos y profesionales que comparten conocimientos y se apoyan mutuamente para alcanzar el éxito.",
    buttonText: "Únete Ahora",
    mediaFile: null,
    mediaPreview: "",
    communityName: "Emprendedores Pro",
    members: 1248,
    rating: 4.8,
    isActive: true,
    category: "Comunidad privada",
    customUrl: "",
  })

  const handlePublish = async () => {
    setIsPublishing(true)
    
    try {
      const formData = new FormData()
      formData.append('title', communityData.title)
      formData.append('description', communityData.description)
      formData.append('url', communityData.customUrl)
      if (communityData.mediaFile) {
        formData.append('image', communityData.mediaFile)
      }

      const response = await fetch('http://127.0.0.1:8000/community/communities/', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Error al publicar la comunidad')
      }

      await response.json()
      setShowSuccessModal(true)
      
    } catch (error) {
      console.error('Error:', error)
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setIsPublishing(false)
    }
  }

  const copyToClipboard = () => {
    const communityUrl = `${window.location.origin}/comunidades/${communityData.customUrl}`
    navigator.clipboard.writeText(communityUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const closeModal = () => {
    setShowSuccessModal(false)
    navigate('/communitiespage')
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

      <CommunityBuilder 
        communityData={communityData} 
        setCommunityData={setCommunityData} 
        fixedButtonText
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">¡Comunidad publicada con éxito!</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                defaultValue={`${window.location.origin}/comunidades/${communityData.customUrl}`}
                readOnly
              />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={copyToClipboard}>
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={closeModal}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}