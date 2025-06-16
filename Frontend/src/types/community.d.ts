interface Community {
  _id: string
  id: string
  title: string
  description: string
  url: string
  members: number
  created_at: string
  image_url: string
  subtitle?: string
  buttonText?: string
  // Agrega otros campos si es necesario
}

// Opcional: Extiende la interfaz si necesitas variantes
interface CommunityPreview extends Omit<Community, 'description' | 'members'> {
  short_description?: string
}

// Exporta los tipos para importarlos donde los necesites
export type { Community, CommunityPreview }