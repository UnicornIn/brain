import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Badge } from "../../components/ui/badge"
import { Download, Filter, MoreHorizontal, Plus, Search, Upload } from "lucide-react"

const clients = [
    {
        id: "1",
        name: "María González",
        email: "maria@ejemplo.com",
        phone: "+34 612 345 678",
        source: "WhatsApp",
        status: "Activo",
        lastInteraction: "2023-04-15",
    },
    {
        id: "2",
        name: "Juan Pérez",
        email: "juan@ejemplo.com",
        phone: "+34 623 456 789",
        source: "Instagram",
        status: "Activo",
        lastInteraction: "2023-04-14",
    },
    {
        id: "3",
        name: "Ana Rodríguez",
        email: "ana@ejemplo.com",
        phone: "+34 634 567 890",
        source: "Web",
        status: "Inactivo",
        lastInteraction: "2023-03-20",
    },
    {
        id: "4",
        name: "Carlos López",
        email: "carlos@ejemplo.com",
        phone: "+34 645 678 901",
        source: "WhatsApp",
        status: "Activo",
        lastInteraction: "2023-04-10",
    },
    {
        id: "5",
        name: "Laura Martínez",
        email: "laura@ejemplo.com",
        phone: "+34 656 789 012",
        source: "Instagram",
        status: "Inactivo",
        lastInteraction: "2023-02-28",
    },
    {
        id: "6",
        name: "Pedro Sánchez",
        email: "pedro@ejemplo.com",
        phone: "+34 667 890 123",
        source: "Web",
        status: "Activo",
        lastInteraction: "2023-04-05",
    },
    {
        id: "7",
        name: "Sofía García",
        email: "sofia@ejemplo.com",
        phone: "+34 678 901 234",
        source: "WhatsApp",
        status: "Activo",
        lastInteraction: "2023-04-12",
    },
    {
        id: "8",
        name: "Miguel Fernández",
        email: "miguel@ejemplo.com",
        phone: "+34 689 012 345",
        source: "Instagram",
        status: "Inactivo",
        lastInteraction: "2023-03-15",
    },
]

export default function ClientesPage() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Gestión de Clientes</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                    <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Importar
                    </Button>
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 w-full max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="search" placeholder="Buscar clientes..." className="pl-8 w-full" />
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
                            Activos
                        </Button>
                        <Button variant="outline" size="sm">
                            Inactivos
                        </Button>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Origen</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Última Interacción</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell>{client.email}</TableCell>
                                    <TableCell>{client.phone}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{client.source}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={client.status === "Activo" ? "default" : "secondary"}>{client.status}</Badge>
                                    </TableCell>
                                    <TableCell>{client.lastInteraction}</TableCell>
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
                                                <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                                <DropdownMenuItem>Ver interacciones</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">Mostrando 8 de 120 clientes</p>
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
