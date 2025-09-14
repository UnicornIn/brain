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
import { toast } from "sonner"
import { useAuth } from "../../../contexts/AuthContext" // Importa el hook useAuth

export default function CreateCommunityPage() {
  const navigate = useNavigate()  
  const { user, logout } = useAuth() // Obtén user y logout del contexto
  const [isPublishing, setIsPublishing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  const [communityData, setCommunityData] = useState<CommunityData>({
    title: "",
    subtitle: "",
    description: "",
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
    setError(null)
    setUrlError(null)

    // Verificar autenticación usando el contexto
    if (!user || !user.token) {
      setError('No estás autenticado. Por favor inicia sesión.')
      setIsPublishing(false)
      toast.error('Autenticación requerida', {
        position: 'top-center',
        duration: 4000
      })
      return
    }

    try {
      // Validación básica
      if (!communityData.title || !communityData.description) {
        throw new Error('El título y la descripción son obligatorios')
      }

      if (!communityData.mediaFile) {
        throw new Error('Debes subir una imagen para la comunidad')
      }

      if (!communityData.customUrl) {
        throw new Error('La URL personalizada es obligatoria')
      }

      const formData = new FormData()
      formData.append('title', communityData.title)
      formData.append('description', communityData.description)
      formData.append('subtitle', communityData.subtitle)
      formData.append('buttonText', communityData.buttonText)
      formData.append('communityName', communityData.communityName)
      formData.append('url', communityData.customUrl)

      if (communityData.mediaFile) {
        formData.append('image', communityData.mediaFile)
      }

      const response = await fetch('https://staging-brain.rizosfelices.co/community/communities/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}` // Usa el token del contexto
        },
        body: formData
      })

      // Manejar errores de respuesta
      if (!response.ok) {
        const errorData = await response.json()
        
        // Error de autenticación
        if (response.status === 401 || response.status === 403) {
          logout() // Cierra la sesión si el token es inválido
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.')
        }
        
        // Error de URL duplicada
        if (errorData.error?.includes('URL already exists') || errorData.message?.includes('URL already in use')) {
          setUrlError('Esta URL ya está en uso. Por favor elige otra.')
          return
        }
        
        throw new Error(errorData.message || errorData.error || 'Error al publicar la comunidad')
      }

      await response.json()
      setShowSuccessModal(true)
      toast.success('Comunidad publicada exitosamente', {
        position: 'top-center',
        duration: 3000
      })

    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al publicar'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-center',
        duration: 4000
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const copyToClipboard = () => {
    const communityUrl = `${window.location.origin}/community/${communityData.customUrl}`
    navigator.clipboard.writeText(communityUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Enlace copiado al portapapeles', {
      position: 'top-center',
      duration: 2000
    })
  }

  const closeModal = () => {
    setShowSuccessModal(false)
    navigate('/communities')
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
            Creador de Comunidad
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Globe className="h-3 w-3 mr-2" />
            {isPublishing ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      </div>

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 mt-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {urlError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mx-4 mt-4">
          <p className="font-bold">Advertencia</p>
          <p>{urlError}</p>
        </div>
      )}

      <CommunityBuilder
        communityData={communityData}
        setCommunityData={setCommunityData}
        fixedButtonText
      />

      {/* Modal de éxito */}
      <Dialog open={showSuccessModal} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-center">Comunidad creada</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Enlace
              </Label>
              <Input
                id="link"
                defaultValue={`${window.location.origin}/community/${communityData.customUrl}`}
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