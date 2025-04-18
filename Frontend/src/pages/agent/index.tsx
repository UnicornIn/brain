"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import {
    AlertCircle,
    Bell,
    CheckCircle2,
    ChevronRight,
    Clock,
    Instagram,
    MessageCircle,
    MoreHorizontal,
    RefreshCw,
    Send,
    Settings,
    Smartphone,
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
import { Progress } from "../../components/ui/progress"

const channels = [
    { id: "whatsapp", name: "WhatsApp", icon: Smartphone, color: "text-green-500", count: 12 },
    { id: "instagram", name: "Instagram", icon: Instagram, color: "text-purple-500", count: 8 },
    { id: "web", name: "Chat Web", icon: MessageCircle, color: "text-blue-500", count: 5 },
]

const conversations = [
    {
        id: "1",
        channel: "whatsapp",
        name: "María González",
        lastMessage: "¿Tienen disponible el producto en color azul?",
        time: "12:30",
        unread: true,
    },
    {
        id: "2",
        channel: "instagram",
        name: "Juan Pérez",
        lastMessage: "Necesito información sobre envíos internacionales",
        time: "11:45",
        unread: false,
    },
    {
        id: "3",
        channel: "web",
        name: "Ana Rodríguez",
        lastMessage: "¿Cuál es el horario de atención?",
        time: "10:20",
        unread: true,
    },
    {
        id: "4",
        channel: "whatsapp",
        name: "Carlos López",
        lastMessage: "Quiero hacer un reclamo por mi pedido",
        time: "Ayer",
        unread: false,
    },
    {
        id: "5",
        channel: "instagram",
        name: "Laura Martínez",
        lastMessage: "¿Tienen descuentos para compras al por mayor?",
        time: "Ayer",
        unread: false,
    },
]

const messages = [
    {
        id: "1",
        sender: "user",
        content: "Hola, ¿cuáles son los horarios de atención?",
        time: "12:30",
    },
    {
        id: "2",
        sender: "agent",
        content: "¡Hola! Nuestros horarios de atención son de lunes a viernes de 9:00 a 18:00 horas.",
        time: "12:31",
    },
    {
        id: "3",
        sender: "user",
        content: "¿Y los fines de semana?",
        time: "12:32",
    },
    {
        id: "4",
        sender: "agent",
        content: "Los sábados atendemos de 10:00 a 14:00 horas. Los domingos permanecemos cerrados.",
        time: "12:33",
    },
    {
        id: "5",
        sender: "user",
        content: "¿Qué sucede en días festivos?",
        time: "12:34",
    },
    {
        id: "6",
        sender: "agent",
        isAlert: true,
        content:
            "No se encontró información sobre horarios en días festivos. Se ha generado una alerta para actualizar la base de conocimiento.",
        time: "12:35",
    },
]

const alerts = [
    {
        id: "1",
        title: "Información faltante sobre horarios en días festivos",
        description: "El agente no pudo responder a una consulta sobre horarios en días festivos",
        time: "Hace 5 minutos",
        status: "Pendiente",
        priority: "Alta",
    },
    {
        id: "2",
        title: "Producto no encontrado en catálogo",
        description: "Cliente consultó por un producto que no está en la base de conocimiento",
        time: "Hace 2 horas",
        status: "En proceso",
        priority: "Media",
    },
    {
        id: "3",
        title: "Información desactualizada sobre envíos",
        description: "La información proporcionada sobre tiempos de envío está desactualizada",
        time: "Hace 1 día",
        status: "Resuelta",
        priority: "Baja",
    },
]

export default function AgentePage() {
    const [activeTab, setActiveTab] = useState("chat")
    const [selectedConversation, setSelectedConversation] = useState("1")
    const [newMessage, setNewMessage] = useState("")

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            // In a real app, this would send the message
            setNewMessage("")
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Agente Omnicanal</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar Estado
                    </Button>
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuración
                    </Button>
                </div>
            </div>

            <div className="p-4 flex-1">
                <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab} className="h-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="chat">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Conversaciones
                        </TabsTrigger>
                        <TabsTrigger value="alerts">
                            <Bell className="h-4 w-4 mr-2" />
                            Alertas
                            <Badge className="ml-2">3</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="chat" className="mt-4 h-[calc(100%-40px)]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                            <Card className="md:col-span-1 h-full flex flex-col">
                                <CardHeader>
                                    <CardTitle>Conversaciones</CardTitle>
                                    <CardDescription>Gestiona las conversaciones en todos los canales</CardDescription>
                                    <div className="relative mt-2">
                                        <Input type="search" placeholder="Buscar conversación..." className="pl-8" />
                                        <MessageCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 overflow-auto">
                                    <div className="flex items-center gap-2 p-2 border-b">
                                        {channels.map((channel) => (
                                            <Button key={channel.id} variant="outline" size="sm" className="flex-1">
                                                <channel.icon className={`h-4 w-4 mr-1 ${channel.color}`} />
                                                <span className="text-xs">{channel.count}</span>
                                            </Button>
                                        ))}
                                    </div>
                                    <div className="divide-y">
                                        {conversations.map((conversation) => (
                                            <div
                                                key={conversation.id}
                                                className={`p-3 cursor-pointer hover:bg-muted/50 ${selectedConversation === conversation.id ? "bg-muted" : ""
                                                    }`}
                                                onClick={() => setSelectedConversation(conversation.id)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <Avatar>
                                                        <AvatarImage
                                                            src={`/placeholder.svg?height=40&width=40&text=${conversation.name.charAt(0)}`}
                                                        />
                                                        <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="font-medium truncate">{conversation.name}</p>
                                                            <p className="text-xs text-muted-foreground">{conversation.time}</p>
                                                        </div>
                                                        <p className="text-sm truncate">{conversation.lastMessage}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {conversation.channel === "whatsapp" && (
                                                                <Badge variant="outline" className="text-xs gap-1">
                                                                    <Smartphone className="h-3 w-3 text-green-500" />
                                                                    WhatsApp
                                                                </Badge>
                                                            )}
                                                            {conversation.channel === "instagram" && (
                                                                <Badge variant="outline" className="text-xs gap-1">
                                                                    <Instagram className="h-3 w-3 text-purple-500" />
                                                                    Instagram
                                                                </Badge>
                                                            )}
                                                            {conversation.channel === "web" && (
                                                                <Badge variant="outline" className="text-xs gap-1">
                                                                    <MessageCircle className="h-3 w-3 text-blue-500" />
                                                                    Web
                                                                </Badge>
                                                            )}
                                                            {conversation.unread && <Badge className="text-xs">Nuevo</Badge>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2 h-full flex flex-col">
                                <CardHeader className="border-b">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={`/placeholder.svg?height=40&width=40&text=M`} />
                                                <AvatarFallback>M</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle>María González</CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs gap-1">
                                                        <Smartphone className="h-3 w-3 text-green-500" />
                                                        WhatsApp
                                                    </Badge>
                                                    <span>+34 612 345 678</span>
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Más opciones</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem>Ver perfil del cliente</DropdownMenuItem>
                                                <DropdownMenuItem>Ver historial completo</DropdownMenuItem>
                                                <DropdownMenuItem>Transferir conversación</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">Finalizar conversación</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto p-4">
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.sender === "user" ? "justify-start" : "justify-end"}`}
                                            >
                                                {message.isAlert ? (
                                                    <Alert className="w-full">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertTitle>Alerta del Agente</AlertTitle>
                                                        <AlertDescription>{message.content}</AlertDescription>
                                                    </Alert>
                                                ) : (
                                                    <div
                                                        className={`max-w-[80%] rounded-lg p-3 ${message.sender === "user" ? "bg-muted" : "bg-primary text-primary-foreground"
                                                            }`}
                                                    >
                                                        <p>{message.content}</p>
                                                        <p
                                                            className={`text-xs mt-1 ${message.sender === "user" ? "text-muted-foreground" : "text-primary-foreground/80"
                                                                }`}
                                                        >
                                                            {message.time}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t p-4">
                                    <div className="flex items-center gap-2 w-full">
                                        <Input
                                            placeholder="Escribe un mensaje..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleSendMessage()
                                                }
                                            }}
                                        />
                                        <Button onClick={handleSendMessage}>
                                            <Send className="h-4 w-4" />
                                            <span className="sr-only">Enviar</span>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="alerts" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Alertas del Agente Omnicanal</CardTitle>
                                <CardDescription>
                                    Gestiona las alertas generadas cuando el agente no encuentra respuestas
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {alerts.map((alert) => (
                                        <div key={alert.id} className="rounded-lg border p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    {alert.status === "Pendiente" ? (
                                                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                                    ) : alert.status === "En proceso" ? (
                                                        <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                                                    ) : (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{alert.title}</p>
                                                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <p className="text-xs text-muted-foreground">{alert.time}</p>
                                                            <Badge
                                                                variant={
                                                                    alert.priority === "Alta"
                                                                        ? "destructive"
                                                                        : alert.priority === "Media"
                                                                            ? "default"
                                                                            : "secondary"
                                                                }
                                                                className="text-xs"
                                                            >
                                                                {alert.priority}
                                                            </Badge>
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs ${alert.status === "Pendiente"
                                                                    ? "border-destructive text-destructive"
                                                                    : alert.status === "En proceso"
                                                                        ? "border-amber-500 text-amber-500"
                                                                        : "border-green-500 text-green-500"
                                                                    }`}
                                                            >
                                                                {alert.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm">
                                                        Ver Detalles
                                                    </Button>
                                                    <Button size="sm">Asignar Acción</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle>Estado del Sistema</CardTitle>
                                <CardDescription>Monitoreo en tiempo real del agente omnicanal</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium">Conectores Activos</p>
                                            <Badge variant="outline">3/3 Activos</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm">WhatsApp</span>
                                                </div>
                                                <Badge variant="outline" className="text-green-500 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Conectado
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Instagram className="h-4 w-4 text-purple-500" />
                                                    <span className="text-sm">Instagram</span>
                                                </div>
                                                <Badge variant="outline" className="text-green-500 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Conectado
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <MessageCircle className="h-4 w-4 text-blue-500" />
                                                    <span className="text-sm">Chat Web</span>
                                                </div>
                                                <Badge variant="outline" className="text-green-500 gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Conectado
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium">Rendimiento del Agente</p>
                                            <Badge variant="outline">85% Efectividad</Badge>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs">Tasa de Respuesta</p>
                                                    <p className="text-xs font-medium">92%</p>
                                                </div>
                                                <Progress value={92} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs">Precisión de Respuestas</p>
                                                    <p className="text-xs font-medium">85%</p>
                                                </div>
                                                <Progress value={85} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs">Tiempo de Respuesta</p>
                                                    <p className="text-xs font-medium">78%</p>
                                                </div>
                                                <Progress value={78} className="h-2" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                    Ver Informe Completo
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
