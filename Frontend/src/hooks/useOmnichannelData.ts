import { useEffect, useState } from "react"
import type { Conversacion } from "../types/omnichannel"

interface Filtros {
  canal: string
  estado: string
}

export function useOmnichannelData() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [filtros, setFiltros] = useState<Filtros>({
    canal: "todos",
    estado: "todos",
  })

  useEffect(() => {
    const fetchConversaciones = async () => {
      try {
        const res = await fetch("https://staging-brain.rizosfelices.co/conversations/get-conversations/")
        const data = await res.json()

        const normalizadas: Conversacion[] = data.map((c: any) => ({
          id: c._id,
          idConversacion: c._id,
          user_id: c.user_id, 
          canal: c.platform || "whatsapp",
          remitente: c.name || "Sin nombre",
          avatar: undefined,
          ultimoMensaje: c.last_message || "",
          timestamp: c.timestamp,
          noLeido: c.unread > 0,
          urgente: false, // Cambiar si tienes lógica para urgencia
          gestionado: c.unread === 0,
          mensajes: [],
        }))

        setConversaciones(normalizadas)
      } catch (error) {
        console.error("Error al obtener conversaciones:", error)
      }
    }

    fetchConversaciones()
  }, [])

  return {
    conversaciones,
    setConversaciones,
    filtros,
    setFiltros,
  }
}
