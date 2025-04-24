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
import { useEffect, useState } from "react"

export default function InteraccionesPage() {
    // Estado para manejar la búsqueda y filtros (se implementará luego con el backend)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentFilter, setCurrentFilter] = useState("all")
    const [isLoading, setIsLoading] = useState(true)
    interface Interaction {
        id: string
        client: string
        message: string
        date: string
        channel: string
        status: string
        agent: string
    }

    const [interactions] = useState<Interaction[]>([])

    // Efecto para cargar datos (se implementará con el backend)
    useEffect(() => {
        // Aquí irá la llamada a la API
        setIsLoading(false)
    }, [])

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
                            <Input 
                                type="search" 
                                placeholder="Buscar interacciones..." 
                                className="pl-8 w-full" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                            <span className="sr-only">Filtrar</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant={currentFilter === "all" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setCurrentFilter("all")}
                        >
                            Todos
                        </Button>
                        <Button 
                            variant={currentFilter === "pending" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setCurrentFilter("pending")}
                        >
                            Pendientes
                        </Button>
                        <Button 
                            variant={currentFilter === "answered" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setCurrentFilter("answered")}
                        >
                            Respondidos
                        </Button>
                        <Button 
                            variant={currentFilter === "escalated" ? "default" : "outline"} 
                            size="sm"
                            onClick={() => setCurrentFilter("escalated")}
                        >
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
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        Cargando interacciones...
                                    </TableCell>
                                </TableRow>
                            ) : interactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8">
                                        No se encontraron interacciones
                                    </TableCell>
                                </TableRow>
                            ) : (
                                interactions.map((interaction) => (
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
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        {interactions.length > 0 ? `Mostrando ${interactions.length} interacciones` : 'No hay interacciones para mostrar'}
                    </p>
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