"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { Separator } from "../ui/separator"
import { Button } from "../ui/button"
import { Upload, X } from "lucide-react"
import { cn } from "../../lib/utils"
import type { CommunityData } from "../../types/community"

interface ContentSidebarProps {
  communityData: CommunityData
  onInputChange: (field: keyof CommunityData, value: string | number | boolean) => void
}

export function ContentSidebar({ communityData, onInputChange }: ContentSidebarProps) {
  const [isDragging, setIsDragging] = useState(false)

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
    <div className="w-80 bg-white border-r overflow-y-auto">
      {/* Header */}
      <div className="border-b p-4">
        <h2 className="font-medium text-gray-900">Contenido</h2>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Sección Hero */}
        <div>
          <h3 className="font-medium text-sm mb-3 text-gray-900">Sección Hero</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Título principal</Label>
              <Input
                value={communityData.title}
                onChange={(e) => onInputChange("title", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Únete a Nuestra Comunidad Exclusiva"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Subtítulo</Label>
              <Input
                value={communityData.subtitle}
                onChange={(e) => onInputChange("subtitle", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Aprende, Conecta y Crece"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Descripción</Label>
              <Textarea
                value={communityData.description}
                onChange={(e) => onInputChange("description", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[80px] resize-none"
                placeholder="Una comunidad vibrante de emprendedores..."
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Texto del botón</Label>
              <Input
                value={communityData.buttonText}
                onChange={(e) => onInputChange("buttonText", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Únete Ahora"
              />
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
                "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-xs text-gray-600">Arrastra una imagen o video</p>
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

        {/* Información de la Comunidad */}
        <div>
          <h3 className="font-medium text-sm mb-3 text-gray-900">Información de la Comunidad</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Nombre de la comunidad</Label>
              <Input
                value={communityData.communityName}
                onChange={(e) => onInputChange("communityName", e.target.value)}
                className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                placeholder="Emprendedores Pro"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">Miembros</Label>
                <Input
                  type="number"
                  value={communityData.members}
                  onChange={(e) => onInputChange("members", Number.parseInt(e.target.value) || 0)}
                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-600 mb-2 block">Rating</Label>
                <Input
                  type="number"
                  step="0.1"
                  max="5"
                  value={communityData.rating}
                  onChange={(e) => onInputChange("rating", Number.parseFloat(e.target.value) || 0)}
                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">Tipo</Label>
              <Select value={communityData.category} onValueChange={(value) => onInputChange("category", value)}>
                <SelectTrigger className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Comunidad privada">Comunidad privada</SelectItem>
                  <SelectItem value="Comunidad pública">Comunidad pública</SelectItem>
                  <SelectItem value="Curso online">Curso online</SelectItem>
                  <SelectItem value="Membresía">Membresía</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-600">Comunidad Activa</Label>
              <Switch
                checked={communityData.isActive}
                onCheckedChange={(checked) => onInputChange("isActive", checked)}
              />
            </div>

            <div>
              <Label className="text-xs text-gray-600 mb-2 block">URL personalizada</Label>
              <div className="flex">
                <div className="flex items-center bg-gray-100 px-3 rounded-l-xl border border-r-0 text-xs text-gray-500">
                  /comunidades/
                </div>
                <Input
                  value={communityData.customUrl}
                  onChange={(e) => onInputChange("customUrl", e.target.value)}
                  className="rounded-l-none rounded-r-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="mi-comunidad"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
