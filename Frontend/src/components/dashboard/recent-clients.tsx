import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Eye } from "lucide-react"

const recentClients = [
    {
        id: "1",
        name: "María González",
        email: "maria@ejemplo.com",
        date: "Hace 2 horas",
        source: "WhatsApp",
    },
    {
        id: "2",
        name: "Juan Pérez",
        email: "juan@ejemplo.com",
        date: "Hace 3 horas",
        source: "Instagram",
    },
    {
        id: "3",
        name: "Ana Rodríguez",
        email: "ana@ejemplo.com",
        date: "Hace 5 horas",
        source: "Web",
    },
    {
        id: "4",
        name: "Carlos López",
        email: "carlos@ejemplo.com",
        date: "Hace 1 día",
        source: "WhatsApp",
    },
]

export function RecentClients() {
    return (
        <div className="space-y-4">
            {recentClients.map((client) => (
                <div key={client.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={`/placeholder.svg?height=40&width=40&text=${client.name.charAt(0)}`} />
                            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-sm font-medium">{client.name}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">{client.date}</p>
                                <Badge variant="outline" className="text-xs">
                                    {client.source}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver cliente</span>
                    </Button>
                </div>
            ))}
            <div className="flex justify-center">
                <Button variant="outline" size="sm">
                    Ver todos los clientes
                </Button>
            </div>
        </div>
    )
}
