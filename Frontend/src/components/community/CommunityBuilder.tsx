"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Eye, FileText, Menu } from "lucide-react"
import { Button } from "../ui/button"
import { ContentSidebar } from "./ContentSidebar"
import { CommunityPreview } from "./CommunityPreview"
import { CommunityForm } from "./CommunityForm"
import { cn } from "../../lib/utils"
import type { CommunityData } from "../../types/community"

interface CommunityBuilderProps {
  communityData: CommunityData
  setCommunityData: (data: CommunityData | ((prev: CommunityData) => CommunityData)) => void
}

export function CommunityBuilder({ communityData, setCommunityData }: CommunityBuilderProps) {
  const [previewTab, setPreviewTab] = useState("vista-previa")
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    <div className="flex flex-1 overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <ContentSidebar
          communityData={communityData}
          onInputChange={handleInputChange}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Mobile Menu Button */}
        <div className="bg-white border-b px-4 lg:px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>

            {/* Preview Tabs */}
            <Tabs value={previewTab} onValueChange={setPreviewTab} className="w-full">
              <TabsList className="h-8">
                <TabsTrigger value="vista-previa" className="text-xs flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">Vista Previa</span>
                  <span className="sm:hidden">Vista</span>
                </TabsTrigger>
                <TabsTrigger value="formulario" className="text-xs flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span className="hidden sm:inline">Formulario</span>
                  <span className="sm:hidden">Form</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 lg:p-8">
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
