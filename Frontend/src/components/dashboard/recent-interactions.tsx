import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { MessageSquare } from "lucide-react"

const recentInteractions = [
    {
        id: "1",
        client: "María González",
        message: "Necesito información sobre los horarios de atención",
        date: "Hace 30 minutos",
        channel: "WhatsApp",
        status: "Respondido",
    },
    {
        id: "2",
        client: "Juan Pérez",
        message: "¿Cuáles son las políticas de devolución?",
        date: "Hace 1 hora",
        channel: "Instagram",
        status: "Pendiente",
    },
    {
        id: "3",
        client: "Ana Rodríguez",
        message: "Quiero hacer un reclamo por mi pedido #12345",
        date: "Hace 2 horas",
        channel: "Web",
        status: "Escalado",
    },
    {
        id: "4",
        client: "Carlos López",
        message: "¿Tienen disponible el producto en color azul?",
        date: "Hace 3 horas",
        channel: "WhatsApp",
        status: "Respondido",
    },
]

export function RecentInteractions() {
    return (
        <div className="space-y-4">
            {recentInteractions.map((interaction) => (
                <div key={interaction.id} className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                        <Avatar className="mt-1">
                            <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${interaction.client.charAt(0)}`} />
                            <AvatarFallback>{interaction.client.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{interaction.client}</p>
                            <p className="text-xs">{interaction.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">{interaction.date}</p>
                                <Badge variant="outline" className="text-xs">
                                    {interaction.channel}
                                </Badge>
                                <Badge
                                    variant={
                                        interaction.status === "Respondido"
                                            ? "default"
                                            : interaction.status === "Pendiente"
                                                ? "secondary"
                                                : "destructive"
                                    }
                                    className="text-xs"
                                >
                                    {interaction.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">Ver interacción</span>
                    </Button>
                </div>
            ))}
            <div className="flex justify-center">
                <Button variant="outline" size="sm">
                    Ver todas las interacciones
                </Button>
            </div>
        </div>
    )
}
