"use client"

import { useState } from "react"
import { MessageCircle, BarChart3 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import { MessagesView } from "./MessagesView"
import AnalyticsView from "./AnalyticsView"

export default function OmnichannelPage() {
  const [activeTab, setActiveTab] = useState("messages")
  const [enChat, setEnChat] = useState(false) // 👈 NUEVO estado

  return (
    <div className="h-full bg-gray-20 flex flex-col">
      {/* Header solo si NO estamos en un chat */}
      {!enChat && (
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestión de Canales</h1>
              <p className="text-xl text-gray-600">
                Administra todas tus conversaciones desde un solo lugar
              </p>
            </div>

            <div className="flex-shrink-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-80 grid-cols-2">
                  <TabsTrigger value="messages" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Mensajes
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-grow">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsContent value="messages" className="h-full">
            <div className="h-full">
              <MessagesView setEnChat={setEnChat} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="h-full">
            <div className="h-full">
              <AnalyticsView />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
