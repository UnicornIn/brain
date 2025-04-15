import { Bell, Search, User } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"

export function DashboardHeader() {
    return (
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
            <div className="flex flex-1 items-center gap-4 md:gap-6">
                <form className="relative flex-1 md:max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Buscar..." className="pl-8 md:w-[300px] lg:w-[400px]" />
                </form>
                <div className="ml-auto flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="relative">
                                <Bell className="h-4 w-4" />
                                <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                                    3
                                </Badge>
                                <span className="sr-only">Notificaciones</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Nueva alerta del agente omnicanal</DropdownMenuItem>
                            <DropdownMenuItem>Actualización de base de conocimiento pendiente</DropdownMenuItem>
                            <DropdownMenuItem>5 nuevos clientes registrados hoy</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <User className="h-4 w-4" />
                                <span className="sr-only">Perfil</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Perfil</DropdownMenuItem>
                            <DropdownMenuItem>Configuración</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Avatar>
                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    )
}
