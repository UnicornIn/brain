import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Filter, MessageSquare, MoreHorizontal, Search } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"

const interactions = [
    {
        id: "1",
        client: "María González",
        message: "Necesito información sobre los horarios de atención",
        date: "15/04/2023 12:30",
        channel: "WhatsApp",
        status: "Respondido",
        agent: "Ana Rodríguez",
    },
    {
        id: "2",
        client: "Juan Pérez",
        message: "¿Cuáles son las políticas de devolución?",
        date: "15/04/2023 11:45",
        channel: "Instagram",
        status: "Pendiente",
        agent: "-",
    },
    {
        id: "3",
        client: "Ana Rodríguez",
        message: "Quiero hacer un reclamo por mi pedido #12345",
        date: "15/04/2023 10:20",
        channel: "Web",
        status: "Escalado",
        agent: "Carlos López",
    },
    {
        id: "4",
        client: "Carlos López",
        message: "¿Tienen disponible el producto en color azul?",
        date: "14/04/2023 15:45",
        channel: "WhatsApp",
        status: "Respondido",
        agent: "María González",
    },
    {
        id: "5",
        client: "Laura Martínez",
        message: "¿Tienen descuentos para compras al por mayor?",
        date: "14/04/2023 14:20",
        channel: "Instagram",
        status: "Respondido",
        agent: "Ana Rodríguez",
    },
    {
        id: "6",
        client: "Pedro Sánchez",
        message: "¿Cuál es el tiempo estimado de entrega?",
        date: "14/04/2023 11:30",
        channel: "Web",
        status: "Respondido",
        agent: "Carlos López",
    },
    {
        id: "7",
        client: "Sofía García",
        message: "Necesito cambiar la dirección de envío de mi pedido",
        date: "13/04/2023 16:15",
        channel: "WhatsApp",
        status: "Escalado",
        agent: "María González",
    },
    {
        id: "8",
        client: "Miguel Fernández",
        message: "¿Puedo pagar con tarjeta de crédito internacional?",
        date: "13/04/2023 10:45",
        channel: "Instagram",
        status: "Respondido",
        agent: "Ana Rodríguez",
    },
]

export default function InteraccionesPage() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Gestión de Interacciones</h1>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 w-full max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Buscar interacciones..." className="pl-8 w-full" />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                            <span className="sr-only">Filtrar</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            Todos
                        </Button>
                        <Button variant="outline" size="sm">
                            Pendientes
                        </Button>
                        <Button variant="outline" size="sm">
                            Respondidos
                        </Button>
                        <Button variant="outline" size="sm">
                            Escalados
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Mensaje</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Canal</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Agente</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {interactions.map((interaction) => (
                                <TableRow key={interaction.id}>
                                    <TableCell className="font-medium">{interaction.client}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">{interaction.message}</TableCell>
                                    <TableCell>{interaction.date}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{interaction.channel}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                interaction.status === "Respondido"
                                                    ? "default"
                                                    : interaction.status === "Pendiente"
                                                        ? "secondary"
                                                        : "destructive"
                                            }
                                        >
                                            {interaction.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{interaction.agent}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Acciones</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Ver conversación
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Asignar agente</DropdownMenuItem>
                                                <DropdownMenuItem>Ver perfil del cliente</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>Marcar como resuelta</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">Mostrando 8 de 120 interacciones</p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled>
                            Anterior
                        </Button>
                        <Button variant="outline" size="sm">
                            Siguiente
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
