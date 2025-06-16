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

export default function CreateCommunityPage() {
  const navigate = useNavigate()
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
    
    try {
      // Basic validation
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

      const response = await fetch('https://apibrain.rizosfelices.co/community/communities/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if error is due to duplicate URL
        if (data.error?.includes('URL already exists') || data.message?.includes('URL already in use')) {
          setUrlError('This URL is already in use. Please choose another one.')
          return
        }
        
        const errorMessage = data.message || data.error || 'Esa URL ya está en uso. Por favor, elige otra.'
        throw new Error(errorMessage)
      }

      setShowSuccessModal(true)
      toast.success('Community published successfully', {
        position: 'top-center',
        duration: 3000
      })
      
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error while publishing'
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
    toast.success('Link copied to clipboard', {
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
            Community Landing Builder
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

      {/* Show error if exists */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mx-4 mt-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {urlError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mx-4 mt-4">
          <p className="font-bold">Warning</p>
          <p>{urlError}</p>
        </div>
      )}

      <CommunityBuilder 
        communityData={communityData} 
        setCommunityData={setCommunityData} 
        fixedButtonText
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Community published successfully!</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
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
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}