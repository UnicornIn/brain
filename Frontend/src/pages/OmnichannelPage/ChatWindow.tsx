"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, Sparkles } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Textarea } from "../../components/ui/textarea"
import { ChannelIcon } from "./ChannelIcons"
import type { Conversacion, Mensaje } from "../../types/omnichannel"
import { format } from "date-fns"

interface ChatWindowProps {
  conversacion: Conversacion
  onMarcarGestionado: (id: string) => void
  token?: string
  messages: any[]
}

const sugerenciasIA = [
  "¡Hola! Gracias por tu interés en nuestros servicios. Te envío información sobre nuestras promociones actuales.",
  "¡Nos alegra que te guste nuestro contenido! Subimos nuevos tutoriales cada martes y viernes.",
  "¡Excelente pregunta! Definitivamente haremos más contenido de este estilo. ¡Mantente atento!",
]

export function ChatWindow({ conversacion, onMarcarGestionado, token, messages }: ChatWindowProps) {
  const [textoRespuesta, setTextoRespuesta] = useState("")
  const [mostrarSugerenciasIA, setMostrarSugerenciasIA] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])

  let user: any = null
  let esAdmin = false
  let authToken: string | null = token || null

  if (typeof window !== "undefined") {
    try {
      const storedUser = sessionStorage.getItem("crm-user")
      const storedToken = sessionStorage.getItem("crm-token")

      user = storedUser ? JSON.parse(storedUser) : null
      esAdmin = user?.role === "admin"

      // Prioridad: props.token > crm-token > crm-user.token
      if (!authToken && storedToken) {
        authToken = storedToken
      } else if (!authToken && user?.token) {
        authToken = user.token
      }
    } catch (error) {
      console.error("Error leyendo datos del sessionStorage:", error)
    }
  }

  if (!authToken) {
    console.warn("⚠️ No se encontró token de autenticación, la API responderá con 401")
  }

  // Cargar historial inicial
  useEffect(() => {
    const fetchMensajes = async () => {
      try {
        const res = await fetch(
          `https://staging-brain.rizosfelices.co/conversations/conversations/messages/${conversacion.user_id}`
        )
        const data = await res.json()

        if (data?.messages) {
          const mensajesPlanos: Mensaje[] = data.messages.map((msg: any, index: number) => ({
            id: `${data._id}-${index}`,
            contenido: msg.content,
            timestamp: msg.timestamp,
            esCliente: msg.sender === "user",
            remitente: conversacion.remitente,
          }))
          setMensajes(mensajesPlanos)
        }
      } catch (error) {
        console.error("Error al cargar mensajes:", error)
      }
    }

    if (conversacion.user_id) {
      fetchMensajes()
    }
  }, [conversacion.user_id, conversacion.remitente])

  // Escuchar mensajes nuevos del WebSocket
  useEffect(() => {
    if (messages.length) {
      const ultimoMensaje = messages[messages.length - 1]
      if (ultimoMensaje.user_id === conversacion.user_id && ultimoMensaje.platform === conversacion.canal) {
        setMensajes((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            contenido: ultimoMensaje.text,
            timestamp: ultimoMensaje.timestamp,
            esCliente: ultimoMensaje.direction === "inbound",
            remitente: ultimoMensaje.remitente,
          },
        ])
      }
    }
  }, [messages, conversacion.user_id, conversacion.canal])

  const puedeResponder = esAdmin

  const manejarEnviarRespuesta = async () => {
    if (!textoRespuesta.trim()) return

    // Normalizar canal messenger -> facebook
    const canal = conversacion.canal === "messenger" ? "facebook" : conversacion.canal
    const texto = textoRespuesta
    const id = conversacion.user_id

    const endpoint =
      canal === "whatsapp"
        ? "https://staging-brain.rizosfelices.co/whatsapp/whatsapp/send-message"
        : canal === "instagram"
        ? "https://staging-brain.rizosfelices.co/instagram/send"
        : canal === "facebook"
        ? "https://staging-brain.rizosfelices.co/facebook/send/messenger"
        : null

    if (!endpoint) {
      console.warn("❌ Canal no soportado aún:", canal)
      return
    }

    const esWhatsApp = canal === "whatsapp"

    const payload = esWhatsApp
      ? { wa_id: id, text: texto }
      : {
          data: {
            user_id: id,
            text: texto,
          },
          allowed_roles: [],
        }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      console.log("✅ Mensaje enviado:", result)
      setTextoRespuesta("")
      setMostrarSugerenciasIA(false)

      setMensajes((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          contenido: texto,
          timestamp: new Date().toISOString(),
          esCliente: false,
          remitente: user?.name || "Agente",
        },
      ])
    } catch (error) {
      console.error("❌ Error al enviar mensaje:", error)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={conversacion.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {conversacion.remitente
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                <ChannelIcon
                  channel={conversacion.canal === "messenger" ? "facebook" : conversacion.canal}
                  size="sm"
                />
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{conversacion.remitente}</h2>
              <p className="text-sm text-gray-500 capitalize">{conversacion.canal}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onMarcarGestionado(conversacion.id)}>
              <Tag className="h-4 w-4 mr-1" />
              Marcar como Gestionado
            </Button>
            {esAdmin && (
              <Button variant="outline" size="sm" onClick={() => setMostrarSugerenciasIA(true)}>
                <Sparkles className="h-4 w-4 mr-1" />
                Asistente IA
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* MENSAJES */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-y-4 px-4 py-2 bg-gray-5">
        {mensajes.length > 0 ? (
          mensajes.map((mensaje) => (
            <motion.div
              key={mensaje.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${mensaje.esCliente ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  mensaje.esCliente ? "bg-gray-100 text-gray-900" : "bg-blue-500 text-white"
                }`}
              >
                <p className="text-sm">{mensaje.contenido}</p>
                <p
                  className={`text-xs mt-1 ${
                    mensaje.esCliente ? "text-gray-500" : "text-blue-100"
                  }`}
                >
                  {format(new Date(mensaje.timestamp), "hh:mm:ss")}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No hay mensajes recientes.</p>
        )}
      </div>

      {/* INPUT Y SUGERENCIAS */}
      {puedeResponder && (
        <div className="p-4 bg-white border-t border-gray-200">
          <AnimatePresence>
            {mostrarSugerenciasIA && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 max-h-40 overflow-y-auto"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Respuestas Sugeridas por IA</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sugerenciasIA.map((sugerencia, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full text-left justify-start h-auto p-2 text-sm"
                        onClick={() => setTextoRespuesta(sugerencia)}
                      >
                        {sugerencia}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Textarea
                placeholder="Escribe tu respuesta..."
                value={textoRespuesta}
                onChange={(e) => setTextoRespuesta(e.target.value)}
                onFocus={() => setMostrarSugerenciasIA(true)}
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button size="sm" onClick={manejarEnviarRespuesta} disabled={!textoRespuesta.trim()}>
                Enviar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarSugerenciasIA(!mostrarSugerenciasIA)}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
