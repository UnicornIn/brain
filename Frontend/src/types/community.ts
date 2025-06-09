export interface CommunityData {
  // Sección Hero
  title: string
  subtitle: string
  description: string
  buttonText: string
  mediaFile: File | null
  mediaPreview: string

  // Información de la Comunidad
  communityName: string
  members: number
  rating: number

  // Características
  isActive: boolean
  category: string
  customUrl: string
}

export interface ValidationErrors {
  title?: string
  mediaFile?: string
  customUrl?: string
  communityName?: string
}
