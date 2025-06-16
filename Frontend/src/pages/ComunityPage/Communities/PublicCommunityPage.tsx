"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from "../../../components/ui/button"
import { Card } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"

interface Community {
  id: string
  title: string
  description: string
  url: string
  members: number
  created_at: string
  image: string
}

interface FormData {
  full_name: string
  email: string
  phone: string
  join_reason: string
  community_id: string
}

export default function CommunityPublicPage() {
  const { slug } = useParams<{ slug: string }>()
  const [community, setCommunity] = useState<Community | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    join_reason: '',
    community_id: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true)
        const response = await fetch(`http://127.0.0.1:8000/community/communities/by-slug/${slug}`)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }

        const data = await response.json()
        setCommunity(data)
        setFormData(prev => ({ ...prev, community_id: data.id }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchCommunity()
  }, [slug])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFormError(null)
    
    try {
      if (!community) return
      
      // Validación básica
      if (!formData.full_name || !formData.email || !formData.phone || !formData.join_reason) {
        throw new Error('Todos los campos son requeridos')
      }

      // Enviar datos del formulario para crear un nuevo miembro
      const response = await fetch('http://127.0.0.1:8000/community/CreateMember', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.detail || 
          (errorData.errors ? JSON.stringify(errorData.errors) : 'Error al registrar miembro')
        )
      }

      await response.json()
      
      alert('¡Registro exitoso!')
      setShowForm(false)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        join_reason: '',
        community_id: community.id
      })
      
      // Actualizar los datos de la comunidad para reflejar el nuevo miembro
      const updatedResponse = await fetch(`http://127.0.0.1:8000/community/communities/by-slug/${slug}`)
      const updatedData = await updatedResponse.json()
      setCommunity(updatedData)
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
      setFormError(
        error instanceof Error ? 
        error.message.replace(/[\[\]"]+/g, '') : 
        'Error desconocido al procesar la solicitud'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )

  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-red-500">{error}</p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          Volver al inicio
        </Button>
      </div>
    </div>
  )

  if (!community) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center p-6 bg-yellow-50 rounded-lg max-w-md">
        <h2 className="text-xl font-semibold text-yellow-600 mb-2">Comunidad no encontrada</h2>
        <p className="text-yellow-500">No se pudo cargar la información de la comunidad</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl overflow-hidden shadow-lg bg-white">
        {/* Header with stats */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600 text-sm">
                  {community.members.toLocaleString()}
                  <span className="hidden sm:inline"> miembros</span>
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Activa
              </Badge>
            </div>
            <span className="text-xs text-gray-500">
              Creada el {new Date(community.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">{community.title}</h1>
          <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto">{community.description}</p>

          {/* Media Preview */}
          <div className="mb-6 rounded-xl overflow-hidden bg-gray-100">
            <img
              src={community.image}
              alt={`Imagen de ${community.title}`}
              className="w-full aspect-video object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg'
              }}
            />
          </div>

          {/* CTA Button */}
          <div className="flex items-center justify-center">
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="px-8 bg-black text-white hover:bg-gray-800 rounded-xl h-12 text-base font-medium w-full sm:w-auto"
            >
              ÚNETE A LA COMUNIDAD
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Al unirte, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </Card>

      {/* Modal del formulario - Versión mejorada */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Únete a {community.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Completa el formulario para unirte a nuestra comunidad
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {formError}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-gray-700">
                Nombre completo *
              </Label>
              <Input
                type="text"
                id="full_name"
                name="full_name"
                required
                placeholder="Tu nombre completo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={formData.full_name}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email *
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                required
                placeholder="tu@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700">
                Teléfono *
              </Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                required
                placeholder="+1 234 567 8900"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join_reason" className="text-gray-700">
                ¿Por qué quieres unirte? *
              </Label>
              <Textarea
                id="join_reason"
                name="join_reason"
                required
                rows={4}
                placeholder="Cuéntanos qué esperas obtener de la comunidad..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                value={formData.join_reason}
                onChange={handleInputChange}
              />
            </div>

            <div className="text-xs text-gray-500 text-center">
              <p>Al unirte, aceptas nuestros términos de servicio y política de privacidad.</p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-md text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                "ENVIAR SOLICITUD"
              )}
            </Button> 
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}