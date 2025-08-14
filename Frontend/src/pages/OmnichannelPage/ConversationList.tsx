"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { ChannelIcon } from "./ChannelIcons"
import { Conversacion } from "../../types/omnichannel"
import { useWebSocket } from "../../hooks/useWebSocket"
import { useEffect } from "react"

interface ConversationListProps {
  conversations: Conversacion[]
  selectedConversation: Conversacion | null
  onSelectConversation: (conversacion: Conversacion) => void
  onUpdateConversations: (actualizadas: Conversacion[]) => void
}

function formatFecha(fechaIso: string) {
  const date = new Date(fechaIso)
  return date.toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  onUpdateConversations
}: ConversationListProps) {
  const { messages } = useWebSocket()

  useEffect(() => {
    if (!messages.length) return

    const lastMsg = messages[messages.length - 1]
    const convIndex = conversations.findIndex(c => c.user_id === lastMsg.user_id)

    if (convIndex !== -1) {
      const updated = [...conversations]
      const currentName = updated[convIndex].remitente

      updated[convIndex] = {
        ...updated[convIndex],
        ultimoMensaje: lastMsg.text,
        timestamp: lastMsg.timestamp,
        noLeido: true,
        remitente:
          currentName && currentName !== "Sin nombre" && currentName !== lastMsg.user_id
            ? currentName
            : lastMsg.remitente,
        mensajes: [
          ...(updated[convIndex].mensajes || []),
          {
            id: crypto.randomUUID(),
            contenido: lastMsg.text,
            timestamp: lastMsg.timestamp,
            esCliente: lastMsg.direction === "inbound",
            remitente: lastMsg.remitente
          }
        ]
      }

      onUpdateConversations(updated)
    }
  }, [messages, conversations, onUpdateConversations])

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4">
      <AnimatePresence>
        {conversations.map((conversacion, index) => (
          <motion.div
            key={conversacion.id ?? `temp-id-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.id === conversacion.id ? "bg-blue-50 border-blue-200" : ""
              }`}
            onClick={() => onSelectConversation(conversacion)}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="relative flex-shrink-0">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden ring-2 ring-offset-2 ring-white">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={conversacion.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gray-200 text-gray-700 font-medium">
                      {conversacion.remitente
                        ? conversacion.remitente
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                        : "??"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="absolute -bottom-1 -right-1 z-10">
                  <ChannelIcon
                    channel={conversacion.canal === "messenger" ? "facebook" : conversacion.canal}
                    size="sm"
                  />
                </div>
                {!conversacion.noLeido && conversacion.gestionado && (
                  <div className="absolute -top-1 -right-1 z-10">
                    <CheckCircle className="h-4 w-4 text-green-500 fill-green-100" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                    {conversacion.remitente ?? "Sin nombre"}
                  </h3>
                  <div className="flex items-center gap-1">
                    {conversacion.urgente && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-xs text-gray-500">
                      {formatFecha(conversacion.timestamp)}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 truncate mb-1">
                  {conversacion.ultimoMensaje}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {conversacion.gestionado ? (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs bg-green-100 text-green-800">
                        Gestionado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs bg-yellow-100 text-yellow-800">
                        Pendiente
                      </Badge>
                    )}
                    {conversacion.tipo && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        {conversacion.tipo}
                      </Badge>
                    )}
                  </div>
                  {conversacion.noLeido && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
