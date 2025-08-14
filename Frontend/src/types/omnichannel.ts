export interface Mensaje {
  id: string;
  remitente: string;
  contenido: string;
  timestamp: string;
  esCliente: boolean;
}


export interface Conversacion {
  id: string;
  user_id: string; // 👈 Agregado
  canal: 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'messenger';
  idConversacion: string
  remitente: string;
  avatar?: string;
  ultimoMensaje: string;
  timestamp: string;
  noLeido: boolean;
  urgente: boolean;
  gestionado: boolean;
  tipo: string;
  mensajes: Mensaje[];
}

export interface EstadisticasCanal {
  canal: string;
  total: number;
  activas: number;
  gestionadas: number;
  engagement: string;
}

export interface EstadisticasDashboard {
  totalInteracciones: number;
  interaccionesHoy: number;
  tiempoRespuestaPromedio: string;
  tasaEngagement: string;
  mensajesGestionados: number;
  mensajesPendientes: number;
}