"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { AlertCircle } from "lucide-react"
import type { CommunityData } from "../../types/community"

interface CommunityFormProps {
  communityData: CommunityData
}

export function CommunityForm({ communityData }: CommunityFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    reason: "",
  })

  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    phone: "",
    reason: "",
  })

  const validateField = (name: string, value: string) => {
    let error = ""

    switch (name) {
      case "fullName":
        if (!value.trim()) error = "El nombre completo es obligatorio"
        break
      case "email":
        if (!value.trim()) {
          error = "El email es obligatorio"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Ingresa un email válido"
        }
        break
      case "phone":
        if (!value.trim()) error = "El teléfono es obligatorio"
        break
      case "reason":
        if (!value.trim()) error = "Este campo es obligatorio"
        break
    }

    return error
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Validar el campo y limpiar error si es válido
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleBlur = (name: string, value: string) => {
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const isFormValid = () => {
    return (
      Object.values(formData).every((value) => value.trim() !== "") &&
      Object.values(errors).every((error) => error === "")
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validar todos los campos
    const newErrors = {
      fullName: validateField("fullName", formData.fullName),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      reason: validateField("reason", formData.reason),
    }

    setErrors(newErrors)

    if (Object.values(newErrors).every((error) => error === "")) {
      // Aquí enviarías el formulario
      console.log("Formulario válido:", formData)
    }
  }

  return (
    <Card className="overflow-hidden shadow-lg bg-white">
      {/* Header */}
      <div className="text-center p-4 lg:p-6 border-b bg-gray-50">
        <h1 className="text-xl lg:text-2xl font-bold mb-2 text-gray-900 leading-tight">{communityData.title}</h1>
        <p className="text-sm lg:text-base text-gray-600">Completa el formulario para unirte a nuestra comunidad</p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-5 lg:space-y-6">
        {/* Form Fields */}
        <div className="space-y-4 lg:space-y-5">
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Nombre completo <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              onBlur={(e) => handleBlur("fullName", e.target.value)}
              placeholder="Tu nombre completo"
              className={`w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-11 lg:h-12 ${errors.fullName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
            />
            {errors.fullName && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.fullName}</span>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              placeholder="tu@email.com"
              className={`w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-11 lg:h-12 ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
            />
            {errors.email && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Teléfono <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              onBlur={(e) => handleBlur("phone", e.target.value)}
              placeholder="+1 234 567 8900"
              className={`w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-11 lg:h-12 ${errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
            />
            {errors.phone && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.phone}</span>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              ¿Por qué quieres unirte? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              onBlur={(e) => handleBlur("reason", e.target.value)}
              placeholder="Cuéntanos qué esperas obtener de la comunidad..."
              className={`w-full min-h-[100px] lg:min-h-[120px] resize-none rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.reason ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                }`}
            />
            {errors.reason && (
              <div className="flex items-center gap-1 mt-1 text-red-500 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-2 lg:py-4">
          <Button
            type="submit"
            size="lg"
            disabled={!isFormValid()}
            className={`w-full mb-4 rounded-xl h-11 lg:h-12 text-sm lg:text-base font-medium transition-all ${isFormValid() ? "bg-black text-white hover:bg-gray-800" : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            {communityData.buttonText}
          </Button>

          <p className="text-xs text-gray-500 px-2">
            Al unirte, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </form>
    </Card>
  )
}
