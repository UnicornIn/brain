"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from "../../../components/ui/button"
import { Card } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Users, Loader2, AlertCircle } from "lucide-react"
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
import { toast } from 'sonner'

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
        setError(null)

        const response = await fetch(
          `https://apibrain.rizosfelices.co/community/communities/by-slug/${slug}`,
          {
            headers: {
              'Cache-Control': 'no-cache',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            }
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(
            errorData.message ||
            errorData.detail ||
            `Error al cargar la comunidad (${response.status})`
          )
        }

        const data = await response.json()
        setCommunity(data)
        setFormData(prev => ({ ...prev, community_id: data.id }))
      } catch (err) {
        console.error('Error fetching community:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar la comunidad')
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

  const validateForm = () => {
    if (!formData.full_name.trim()) {
      setFormError('El nombre completo es requerido')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('Por favor ingresa un email válido')
      return false
    }

    if (!formData.phone.trim()) {
      setFormError('El teléfono es requerido')
      return false
    }

    if (!formData.join_reason.trim()) {
      setFormError('Por favor dinos por qué quieres unirte')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setFormError(null)

    try {
      const response = await fetch('https://apibrain.rizosfelices.co/community/CreateMember', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Verificar si el error es porque el usuario ya está registrado
        if (errorData.detail?.includes("already exists") || errorData.message?.includes("ya está registrado")) {
          toast.custom((t) => (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg w-full max-w-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-blue-800">¡Ya eres parte de esta comunidad!</h3>
                  <div className="mt-2 text-sm text-blue-600">
                    <p>Gracias por tu interés, pero ya tienes una solicitud activa en esta comunidad.</p>
                  </div>
                  <div className="mt-4 flex">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => toast.dismiss(t)}
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ), {
            duration: 8000,
            position: 'top-center'
          })
          setShowForm(false)
          return
        }
        throw new Error(
          errorData.detail ||
          errorData.message ||
          (errorData.errors ? Object.values(errorData.errors).join(', ') : 'Error al registrar')
        )
      }

      await response.json()

      // Toast de éxito personalizado
      toast.custom((t) => (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-lg w-full max-w-md text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-green-800">¡Bienvenido a la comunidad!</h3>
          <div className="mt-2 text-sm text-green-600">
            <p>Ahora eres parte de <span className="font-semibold">{community?.title}</span></p>
            <p className="mt-1">Te contactaremos pronto con más información.</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => toast.dismiss(t)}
            >
              ¡Genial!
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        position: 'top-center'
      })

      setShowForm(false)
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        join_reason: '',
        community_id: community?.id || ''
      })

      if (community) {
        setCommunity({
          ...community,
          members: community.members + 1
        })
      }
    } catch (error) {
      console.error('Submission error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setFormError(errorMessage)
      toast.error('Error al enviar', {
        description: errorMessage,
        classNames: {
          toast: 'bg-red-50 border-red-200',
          title: 'text-red-800',
          description: 'text-red-600',
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen px-4">
        <Card className="p-6 max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error al cargar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full mb-2 bg-black text-white hover:bg-gray-800 border-2 border-gray-900"
          >
            Reintentar
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full border-2 border-gray-300"
          >
            Volver al inicio
          </Button>
        </Card>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="flex justify-center items-center h-screen px-4">
        <Card className="p-6 max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Comunidad no encontrada</h2>
          <p className="text-gray-600 mb-4">No existe una comunidad con esta URL</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="w-full bg-black text-white hover:bg-gray-800 border-2 border-gray-900"
          >
            Volver al inicio
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center py-8 px-4 sm:px-6">
        <div className="max-w-3xl w-full">
          <Card className="overflow-hidden shadow-lg bg-white">
            {/* Header */}
            <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-5 w-5 text-gray-700" />
                    <span className="text-gray-700 font-medium">
                      {community.members.toLocaleString()} miembros
                    </span>
                  </div>
                  <Badge variant="default" className="bg-gray-800 text-white border-2 border-gray-900">
                    Activa
                  </Badge>
                </div>
                <span className="text-sm text-gray-500">
                  Creada el {new Date(community.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {community.title}
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  {community.description}
                </p>
              </div>

              {/* Image */}
              {community.image && (
                <div className="mb-8 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                  <img
                    src={community.image}
                    alt={community.title}
                    className="w-full h-auto max-h-80 object-cover"
                    onError={(e) => {
                      const target = e.target as EventTarget & { src?: string; classList?: DOMTokenList }
                      if (target && typeof target.src === 'string' && target.classList) {
                        target.src = '/placeholder-community.svg'
                        target.classList.add('object-contain', 'p-8')
                      }
                    }}
                  />
                </div>
              )}

              {/* CTA */}
              <div className="text-center mt-8">
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold bg-black text-white hover:bg-gray-800 rounded-lg border-2 border-gray-900 transition-all transform hover:scale-105 shadow-lg"
                >
                  ÚNETE A LA COMUNIDAD
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Join Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-lg border-2 border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Unirse a {community.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Completa el formulario para unirte a nuestra comunidad
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border-2 border-red-200">
                {formError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-gray-700 font-medium">
                Nombre completo *
              </Label>
              <Input
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Ej: María González"
                className="border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Correo electrónico *
              </Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Ej: ejemplo@email.com"
                className="border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700 font-medium">
                Teléfono *
              </Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Ej: +57 300 1234567"
                className="border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join_reason" className="text-gray-700 font-medium">
                ¿Por qué quieres unirte? *
              </Label>
              <Textarea
                name="join_reason"
                value={formData.join_reason}
                onChange={handleInputChange}
                placeholder="Cuéntanos qué te motiva a ser parte de esta comunidad..."
                rows={4}
                className="border-2 border-gray-300 focus:border-gray-500 focus:ring-gray-500 rounded-lg"
              />
            </div>

            <p className="text-xs text-gray-500">
              * Campos requeridos. Al enviar aceptas nuestros términos y condiciones.
            </p>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full py-6 text-lg font-semibold bg-black text-white hover:bg-gray-800 rounded-lg border-2 border-gray-900 transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  'UNIRME'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}