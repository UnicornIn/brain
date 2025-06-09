"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Eye, FileText } from "lucide-react"
import { ContentSidebar } from "./ContentSidebar"
import { CommunityPreview } from "./CommunityPreview"
import { CommunityForm } from "./CommunityForm"
import type { CommunityData } from "../../types/community"

interface CommunityBuilderProps {
  communityData: CommunityData
  setCommunityData: (data: CommunityData | ((prev: CommunityData) => CommunityData)) => void
}

export function CommunityBuilder({ communityData, setCommunityData }: CommunityBuilderProps) {
  const [previewTab, setPreviewTab] = useState("vista-previa")

  const handleInputChange = (field: keyof CommunityData, value: string | number | boolean) => {
    setCommunityData((prev) => ({
      ...prev,
      [field]: value,
    }))

    if (field === "communityName" && !communityData.customUrl) {
      const autoUrl = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()

      setCommunityData((prev) => ({
        ...prev,
        customUrl: autoUrl,
      }))
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar */}
      <ContentSidebar communityData={communityData} onInputChange={handleInputChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Preview Tabs */}
        <div className="bg-white border-b px-6 py-2">
          <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full">
            <TabsList className="h-8">
              <TabsTrigger value="vista-previa" className="text-xs flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Vista Previa
              </TabsTrigger>
              <TabsTrigger value="formulario" className="text-xs flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Formulario
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div className="max-w-2xl mx-auto">
            {previewTab === "vista-previa" ? (
              <CommunityPreview communityData={communityData} />
            ) : (
              <CommunityForm communityData={communityData} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
