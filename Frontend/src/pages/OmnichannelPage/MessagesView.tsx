"use client"

import { useEffect, useState } from "react"
import { Search, MessageSquare, ArrowLeft } from "lucide-react"
import { Input } from "../../components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../components/ui/select"
import { useOmnichannelData } from "../../hooks/useOmnichannelData"
import { ConversationList } from "./ConversationList"
import { ChatWindow } from "./ChatWindow"
import type { Conversacion } from "../../types/omnichannel"
import { useWebSocket } from "../../hooks/useWebSocket"
import { Button } from "../../components/ui/button"

export function MessagesView({ setEnChat }: { setEnChat: (value: boolean) => void }) {
  const { conversaciones, setConversaciones } = useOmnichannelData()
  const [selectedConversation, setSelectedConversation] = useState<Conversacion | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filtros, setFiltros] = useState({ canal: "todos", estado: "todos" })
  const { messages } = useWebSocket()

  useEffect(() => {
    setEnChat(!!selectedConversation) // true si hay una conversación
  }, [selectedConversation])

  useEffect(() => {
    if (!messages.length) return

    const ultimoMensaje = messages[messages.length - 1]

    setConversaciones((prev) => {
      const existe = prev.find(c => c.user_id === ultimoMensaje.user_id)

      if (existe) {
        return prev.map((conv) =>
          conv.user_id === ultimoMensaje.user_id
            ? {
              ...conv,
              ultimoMensaje: ultimoMensaje.text,
              timestamp: ultimoMensaje.timestamp,
              noLeido: true,
              remitente: ultimoMensaje.remitente,
              mensajes: [
                ...(conv.mensajes || []),
                {
                  id: crypto.randomUUID(),
                  contenido: ultimoMensaje.text,
                  timestamp: ultimoMensaje.timestamp,
                  esCliente: ultimoMensaje.direction === "inbound",
                  remitente: ultimoMensaje.remitente
                }
              ]
            }
            : conv
        )
      } else {
        const nueva: Conversacion = {
          id: crypto.randomUUID(),
          idConversacion: ultimoMensaje.conversation_id,
          user_id: ultimoMensaje.user_id,
          noLeido: true,
          urgente: false,
          tipo: "inbox",
          remitente: ultimoMensaje.remitente,
          canal: ultimoMensaje.platform as 'whatsapp' | 'instagram' | 'facebook' | 'tiktok',
          gestionado: false,
          mensajes: [{
            id: crypto.randomUUID(),
            contenido: ultimoMensaje.text,
            timestamp: ultimoMensaje.timestamp,
            esCliente: ultimoMensaje.direction === "inbound",
            remitente: ultimoMensaje.remitente
          }],
          ultimoMensaje: ultimoMensaje.text,
          timestamp: ultimoMensaje.timestamp
        }
        return [nueva, ...prev]
      }
    })
  }, [messages, setConversaciones])

  const filteredConversations = conversaciones.filter((conv: Conversacion) => {
    const remitente = conv.remitente?.toLowerCase?.() || ""
    const ultimoMensaje = conv.ultimoMensaje?.toLowerCase?.() || ""
    const query = searchQuery.toLowerCase()

    const matchesSearch = remitente.includes(query) || ultimoMensaje.includes(query)
    const matchesChannel = filtros.canal === "todos" || conv.canal === filtros.canal
    const matchesStatus =
      filtros.estado === "todos" ||
      (filtros.estado === "gestionado" && conv.gestionado) ||
      (filtros.estado === "pendiente" && !conv.gestionado)

    return matchesSearch && matchesChannel && matchesStatus
  })

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* Lista de conversaciones */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 p-4 space-y-4 ${selectedConversation ? "hidden md:block" : "block"}`}>
        <div className="flex items-center gap-2">
          <Search className="text-gray-500" />
          <Input
            placeholder="Buscar conversación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select
            value={filtros.canal}
            onValueChange={(value) => setFiltros({ ...filtros, canal: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filtros.estado}
            onValueChange={(value) => setFiltros({ ...filtros, estado: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="gestionado">Gestionados</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ConversationList
          conversations={filteredConversations}
          onSelectConversation={setSelectedConversation}
          selectedConversation={selectedConversation}
          onUpdateConversations={setConversaciones}
        />
      </div>

      {/* Chat window */}
      <div className={`w-full md:w-2/3 ${!selectedConversation ? "hidden md:block" : "block"}`}>
        {selectedConversation ? (
          <div className="h-full flex flex-col">
            {/* Botón volver en mobile */}
            <div className="md:hidden p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversation(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Volver
              </Button>
            </div>

            <ChatWindow
              conversacion={selectedConversation}
              onMarcarGestionado={() => { }}
              messages={messages}
            />
          </div>
        ) : (
          <div className="hidden md:flex items-center justify-center h-full text-gray-400">
            <div className="flex flex-col items-center">
              <MessageSquare size={48} />
              <p className="mt-2">Selecciona una conversación</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
