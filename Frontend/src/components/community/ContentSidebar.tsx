"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Separator } from "../ui/separator"
import { Button } from "../ui/button"
import { Upload, X } from "lucide-react"
import { cn } from "../../lib/utils"
import type { CommunityData } from "../../types/community"

interface ContentSidebarProps {
  communityData: CommunityData
  onInputChange: (field: keyof CommunityData, value: string | number | boolean) => void
  onClose?: () => void
  fixedButtonText?: boolean
}

export function ContentSidebar({ communityData, onInputChange, onClose, fixedButtonText }: ContentSidebarProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateField = (field: keyof CommunityData, value: string | number) => {
    const newErrors = { ...errors }

    if (field === "title" && (!value || String(value).trim() === "")) {
      newErrors.title = "El título es obligatorio"
    } else if (field === "title") {
      delete newErrors.title
    }

    if (field === "subtitle" && (!value || String(value).trim() === "")) {
      newErrors.subtitle = "El subtítulo es obligatorio"
    } else if (field === "subtitle") {
      delete newErrors.subtitle
    }

    if (field === "description" && (!value || String(value).trim() === "")) {
      newErrors.description = "La descripción es obligatoria"
    } else if (field === "description") {
      delete newErrors.description
    }

    if (field === "communityName" && (!value || String(value).trim() === "")) {
      newErrors.communityName = "El nombre de la comunidad es obligatorio"
    } else if (field === "communityName") {
      delete newErrors.communityName
    }

    if (field === "members" && (!value || Number(value) <= 0)) {
      newErrors.members = "El número de miembros debe ser mayor a 0"
    } else if (field === "members") {
      delete newErrors.members
    }

    if (field === "rating" && (!value || Number(value) <= 0 || Number(value) > 5)) {
      newErrors.rating = "El rating debe estar entre 0.1 y 5"
    } else if (field === "rating") {
      delete newErrors.rating
    }

    if (field === "category" && (!value || String(value).trim() === "")) {
      newErrors.category = "El tipo de comunidad es obligatorio"
    } else if (field === "category") {
      delete newErrors.category
    }

    if (field === "customUrl" && (!value || String(value).trim() === "")) {
      newErrors.customUrl = "La URL personalizada es obligatoria"
    } else if (field === "customUrl") {
      delete newErrors.customUrl
    }

    setErrors(newErrors)
  }

  const handleInputChange = (field: keyof CommunityData, value: string | number | boolean) => {
    if (fixedButtonText && field === 'buttonText') return
    
    onInputChange(field, value)

    if (typeof value === "string" || typeof value === "number") {
      validateField(field, value)
    }

    if (field === "communityName" && !communityData.customUrl) {
      const autoUrl = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()

      onInputChange("customUrl", autoUrl)
      validateField("customUrl", autoUrl)
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const previewUrl = URL.createObjectURL(file)
      onInputChange("mediaFile", file as any)
      onInputChange("mediaPreview", previewUrl)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeMedia = () => {
    if (communityData.mediaPreview) {
      URL.revokeObjectURL(communityData.mediaPreview)
    }
    onInputChange("mediaFile", null as any)
    onInputChange("mediaPreview", "")
  }

  const isVideoFile = communityData.mediaFile?.type.startsWith("video/")

  return (
    <div className="w-full h-full bg-white border-r overflow-y-auto">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Contenido</h2>
        {onClose && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Sección Hero */}
        <div>
          <h3 className="font-medium text-sm mb-3 text-gray-900">Sección Hero</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Título de la comunidad *</Label>
              <Input
                value={communityData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.title ? "border-red-500" : ""}`}
                placeholder=""
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* <div>
              <Label className="text-xs text-gray-600 mb-2 block">Subtítulo *</Label>
              <Input
                value={communityData.subtitle}
                onChange={(e) => handleInputChange("subtitle", e.target.value)}
                className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.subtitle ? "border-red-500" : ""}`}
                placeholder=""
              />
              {errors.subtitle && <p className="text-xs text-red-500 mt-1">{errors.subtitle}</p>}
            </div> */}

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Descripción *</Label>
              <Textarea
                value={communityData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={`rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[80px] resize-none ${errors.description ? "border-red-500" : ""}`}
                placeholder=""
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Texto del botón</Label>
              <Input
                value={communityData.buttonText}
                onChange={(e) => handleInputChange("buttonText", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-gray-100"
                placeholder="Únete Ahora"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Este texto está fijado como "Únete Ahora"</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Media Upload */}
        <div>
          <h3 className="font-medium text-sm mb-3 text-gray-900">Media Principal</h3>

          {!communityData.mediaFile ? (
            <div
              className={cn(
                "border-2 border-dashed rounded-xl p-4 lg:p-6 text-center transition-colors cursor-pointer relative",
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-6 w-6 lg:h-8 lg:w-8 text-gray-400" />
                <p className="text-xs text-gray-600">
                  <span className="hidden sm:inline">Arrastra una imagen o video</span>
                  <span className="sm:hidden">Toca para subir media</span>
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="border rounded-xl overflow-hidden">
                {isVideoFile ? (
                  <video src={communityData.mediaPreview} className="w-full h-32 object-cover" controls />
                ) : (
                  <img
                    src={communityData.mediaPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                  />
                )}
              </div>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full"
                onClick={removeMedia}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <Label className="text-xs text-gray-600 mb-2 block">URL personalizada *</Label>
          <div className="flex">
            <div className="flex items-center bg-gray-100 px-2 lg:px-3 rounded-l-xl border border-r-0 text-xs text-gray-500">
              <span className="hidden sm:inline">/comunity/</span>
              <span className="sm:hidden">/c/</span>
            </div>
            <Input
              value={communityData.customUrl}
              onChange={(e) => handleInputChange("customUrl", e.target.value)}
              className={`rounded-l-none rounded-r-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${errors.customUrl ? "border-red-500" : ""}`}
              placeholder=""
            />
          </div>
          {errors.customUrl && <p className="text-xs text-red-500 mt-1">{errors.customUrl}</p>}
        </div>
      </div>
    </div>
  )
}