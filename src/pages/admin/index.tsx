"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Switch } from "../../components/ui/switch"
import {
    AlertCircle,
    Check,
    Edit,
    Key,
    MoreHorizontal,
    Plus,
    Search,
    Settings,
    Shield,
    Trash,
    User,
    UserPlus,
    Smartphone,
    Instagram,
    MessageCircle,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"

const users = [
    {
        id: "1",
        name: "Admin Usuario",
        email: "admin@ejemplo.com",
        role: "Administrador",
        status: "Activo",
        lastLogin: "Hoy, 10:30",
    },
    {
        id: "2",
        name: "María González",
        email: "maria@ejemplo.com",
        role: "Agente de Conocimiento",
        status: "Activo",
        lastLogin: "Ayer, 15:45",
    },
    {
        id: "3",
        name: "Juan Pérez",
        email: "juan@ejemplo.com",
        role: "Agente de Soporte",
        status: "Inactivo",
        lastLogin: "15/03/2023",
    },
    {
        id: "4",
        name: "Ana Rodríguez",
        email: "ana@ejemplo.com",
        role: "Supervisor",
        status: "Activo",
        lastLogin: "Hoy, 09:15",
    },
    {
        id: "5",
        name: "Carlos López",
        email: "carlos@ejemplo.com",
        role: "Agente de Soporte",
        status: "Activo",
        lastLogin: "Ayer, 12:20",
    },
]

const integrations = [
    {
        id: "1",
        name: "WhatsApp Business API",
        status: "Conectado",
        lastSync: "Hoy, 10:30",
    },
    {
        id: "2",
        name: "Instagram Messaging",
        status: "Conectado",
        lastSync: "Hoy, 09:45",
    },
    {
        id: "3",
        name: "Chat Web",
        status: "Conectado",
        lastSync: "Hoy, 08:15",
    },
    {
        id: "4",
        name: "Facebook Messenger",
        status: "Desconectado",
        lastSync: "Nunca",
    },
    {
        id: "5",
        name: "Telegram",
        status: "Desconectado",
        lastSync: "Nunca",
    },
]

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState("usuarios")

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Panel de Administración</h1>
            </div>

            <div className="p-4 flex-1">
                <Tabs defaultValue="usuarios" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="usuarios">
                            <User className="h-4 w-4 mr-2" />
                            Usuarios y Roles
                        </TabsTrigger>
                        <TabsTrigger value="integraciones">
                            <Settings className="h-4 w-4 mr-2" />
                            Integraciones
                        </TabsTrigger>
                        <TabsTrigger value="seguridad">
                            <Shield className="h-4 w-4 mr-2" />
                            Seguridad y Logs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="usuarios" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Gestión de Usuarios y Roles</CardTitle>
                                        <CardDescription>Administra los usuarios y sus permisos en el sistema</CardDescription>
                                    </div>
                                    <Button>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Nuevo Usuario
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 w-full max-w-sm">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="search" placeholder="Buscar usuarios..." className="pl-8 w-full" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Select defaultValue="todos">
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Filtrar por rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todos">Todos los roles</SelectItem>
                                                <SelectItem value="admin">Administrador</SelectItem>
                                                <SelectItem value="conocimiento">Agente de Conocimiento</SelectItem>
                                                <SelectItem value="soporte">Agente de Soporte</SelectItem>
                                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nombre</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Rol</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead>Último Acceso</TableHead>
                                                <TableHead className="w-[80px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{user.role}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={user.status === "Activo" ? "default" : "secondary"}>{user.status}</Badge>
                                                    </TableCell>
                                                    <TableCell>{user.lastLogin}</TableCell>
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
                                                                <DropdownMenuItem>Editar usuario</DropdownMenuItem>
                                                                <DropdownMenuItem>Cambiar rol</DropdownMenuItem>
                                                                <DropdownMenuItem>Restablecer contraseña</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem className="text-destructive">Desactivar usuario</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="integraciones" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Integraciones y Conectores</CardTitle>
                                        <CardDescription>Gestiona las integraciones con canales de comunicación</CardDescription>
                                    </div>
                                    <Button>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Nueva Integración
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {integrations.map((integration) => (
                                        <div key={integration.id} className="rounded-lg border p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {integration.name === "WhatsApp Business API" && (
                                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                            <Smartphone className="h-5 w-5 text-green-500" />
                                                        </div>
                                                    )}
                                                    {integration.name === "Instagram Messaging" && (
                                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                            <Instagram className="h-5 w-5 text-purple-500" />
                                                        </div>
                                                    )}
                                                    {integration.name === "Chat Web" && (
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <MessageCircle className="h-5 w-5 text-blue-500" />
                                                        </div>
                                                    )}
                                                    {integration.name === "Facebook Messenger" && (
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <MessageCircle className="h-5 w-5 text-blue-500" />
                                                        </div>
                                                    )}
                                                    {integration.name === "Telegram" && (
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <MessageCircle className="h-5 w-5 text-blue-500" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{integration.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge
                                                                variant={integration.status === "Conectado" ? "default" : "secondary"}
                                                                className="text-xs"
                                                            >
                                                                {integration.status}
                                                            </Badge>
                                                            {integration.status === "Conectado" && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    Última sincronización: {integration.lastSync}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Label htmlFor={`status-${integration.id}`} className="text-sm">
                                                            Activo
                                                        </Label>
                                                        <Switch id={`status-${integration.id}`} checked={integration.status === "Conectado"} />
                                                    </div>
                                                    <Button variant="outline" size="sm">
                                                        <Settings className="h-4 w-4 mr-2" />
                                                        Configurar
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="seguridad" className="mt-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configuración de Seguridad</CardTitle>
                                    <CardDescription>Gestiona la configuración de seguridad del sistema</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Autenticación de dos factores</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Requiere verificación adicional al iniciar sesión
                                                </p>
                                            </div>
                                            <Switch />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Bloqueo automático de cuentas</Label>
                                                <p className="text-sm text-muted-foreground">Bloquea cuentas después de 5 intentos fallidos</p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>Política de contraseñas seguras</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Requiere contraseñas complejas para todos los usuarios
                                                </p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tiempo de expiración de sesión</Label>
                                        <Select defaultValue="30">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar tiempo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 minutos</SelectItem>
                                                <SelectItem value="30">30 minutos</SelectItem>
                                                <SelectItem value="60">1 hora</SelectItem>
                                                <SelectItem value="120">2 horas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full">
                                        <Check className="h-4 w-4 mr-2" />
                                        Guardar Configuración
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Registro de Actividad</CardTitle>
                                    <CardDescription>Visualiza los registros de actividad del sistema</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Fecha</TableHead>
                                                        <TableHead>Usuario</TableHead>
                                                        <TableHead>Acción</TableHead>
                                                        <TableHead>IP</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Array.from({ length: 5 }).map((_, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{new Date(2023, 3, 15 - index, 10 + index).toLocaleString()}</TableCell>
                                                            <TableCell>
                                                                {index % 3 === 0 ? "Admin Usuario" : index % 3 === 1 ? "María González" : "Juan Pérez"}
                                                            </TableCell>
                                                            <TableCell>
                                                                {index === 0
                                                                    ? "Inicio de sesión"
                                                                    : index === 1
                                                                        ? "Actualización de base de conocimiento"
                                                                        : index === 2
                                                                            ? "Configuración de integración"
                                                                            : index === 3
                                                                                ? "Creación de usuario"
                                                                                : "Exportación de datos"}
                                                            </TableCell>
                                                            <TableCell>192.168.1.{100 + index}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>

                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Información</AlertTitle>
                                            <AlertDescription>
                                                Los registros de actividad se conservan durante 90 días. Para acceder al historial completo,
                                                descarga los registros.
                                            </AlertDescription>
                                        </Alert>

                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline">Descargar Registros</Button>
                                            <Button variant="outline">Ver Todos</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Claves API y Tokens</CardTitle>
                                    <CardDescription>Gestiona las claves API y tokens de acceso para integraciones</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Nombre</TableHead>
                                                    <TableHead>Tipo</TableHead>
                                                    <TableHead>Creado</TableHead>
                                                    <TableHead>Último Uso</TableHead>
                                                    <TableHead>Estado</TableHead>
                                                    <TableHead className="w-[100px]">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Array.from({ length: 3 }).map((_, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">
                                                            {index === 0 ? "API WhatsApp" : index === 1 ? "API Instagram" : "API Web Chat"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {index === 0 ? "Clave API" : index === 1 ? "Token OAuth" : "Token JWT"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{new Date(2023, 2, 15 - index * 5).toLocaleDateString()}</TableCell>
                                                        <TableCell>
                                                            {index === 0 ? "Hoy, 10:30" : index === 1 ? "Ayer, 15:45" : "15/03/2023"}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={index === 2 ? "secondary" : "default"}>
                                                                {index === 2 ? "Expirado" : "Activo"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1">
                                                                <Button variant="ghost" size="icon">
                                                                    <Key className="h-4 w-4" />
                                                                    <span className="sr-only">Ver clave</span>
                                                                </Button>
                                                                <Button variant="ghost" size="icon">
                                                                    <Edit className="h-4 w-4" />
                                                                    <span className="sr-only">Editar</span>
                                                                </Button>
                                                                <Button variant="ghost" size="icon">
                                                                    <Trash className="h-4 w-4" />
                                                                    <span className="sr-only">Eliminar</span>
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="flex justify-end mt-4">
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Generar Nueva Clave
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
