import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { AlertCircle, CheckCircle2, Clock, Filter, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"

const alerts = [
    {
        id: "1",
        title: "Información desactualizada sobre horarios",
        description: "El agente no pudo responder correctamente sobre los horarios de fin de semana",
        time: "Hace 1 hora",
        priority: "Alta",
        status: "Pendiente",
        source: "Agente Omnicanal",
        client: "María González",
    },
    {
        id: "2",
        title: "Consulta sobre producto no encontrado",
        description: "Cliente preguntó por un producto que no está en la base de conocimiento",
        time: "Hace 3 horas",
        priority: "Media",
        status: "En proceso",
        source: "Agente Omnicanal",
        client: "Juan Pérez",
    },
    {
        id: "3",
        title: "Política de devoluciones incompleta",
        description: "Falta información sobre devoluciones internacionales",
        time: "Hace 5 horas",
        priority: "Baja",
        status: "Resuelta",
        source: "Agente Omnicanal",
        client: "Ana Rodríguez",
    },
    {
        id: "4",
        title: "Error en la información de envíos",
        description: "La información proporcionada sobre tiempos de envío está desactualizada",
        time: "Hace 1 día",
        priority: "Media",
        status: "Resuelta",
        source: "Agente Omnicanal",
        client: "Carlos López",
    },
    {
        id: "5",
        title: "Falta información sobre métodos de pago",
        description: "No se encontró información sobre pagos con criptomonedas",
        time: "Hace 2 días",
        priority: "Baja",
        status: "Resuelta",
        source: "Agente Omnicanal",
        client: "Laura Martínez",
    },
]

export default function AlertasPage() {
    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Gestión de Alertas</h1>
            </div>

            <div className="p-4">
                <Tabs defaultValue="todas">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="todas">Todas</TabsTrigger>
                            <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
                            <TabsTrigger value="en-proceso">En Proceso</TabsTrigger>
                            <TabsTrigger value="resueltas">Resueltas</TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Buscar alertas..." className="pl-8 w-[250px]" />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                                <span className="sr-only">Filtrar</span>
                            </Button>
                            <Select defaultValue="todas">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Prioridad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todas las prioridades</SelectItem>
                                    <SelectItem value="alta">Alta</SelectItem>
                                    <SelectItem value="media">Media</SelectItem>
                                    <SelectItem value="baja">Baja</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <TabsContent value="todas" className="mt-0">
                        <div className="space-y-4">
                            {alerts.map((alert) => (
                                <Card key={alert.id}>
                                    <CardContent className="p-0">
                                        <div className="p-6">
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
                                                        <h3 className="font-medium">{alert.title}</h3>
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
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <p className="text-xs text-muted-foreground">Fuente: {alert.source}</p>
                                                            <p className="text-xs text-muted-foreground">Cliente: {alert.client}</p>
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
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="pendientes" className="mt-0">
                        <div className="space-y-4">
                            {alerts
                                .filter((alert) => alert.status === "Pendiente")
                                .map((alert) => (
                                    <Card key={alert.id}>
                                        <CardContent className="p-0">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                                                        <div>
                                                            <h3 className="font-medium">{alert.title}</h3>
                                                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <p className="text-xs text-mute-foreground">{alert.time}</p>
                                                                <Badge variant="destructive" className="text-xs">
                                                                    {alert.priority}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs border-destructive text-destructive">
                                                                    {alert.status}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-muted-foreground">Fuente: {alert.source}</p>
                                                                <p className="text-xs text-muted-foreground">Cliente: {alert.client}</p>
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
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="en-proceso" className="mt-0">
                        <div className="space-y-4">
                            {alerts
                                .filter((alert) => alert.status === "En proceso")
                                .map((alert) => (
                                    <Card key={alert.id}>
                                        <CardContent className="p-0">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
                                                        <div>
                                                            <h3 className="font-medium">{alert.title}</h3>
                                                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <p className="text-xs text-muted-foreground">{alert.time}</p>
                                                                <Badge variant="default" className="text-xs">
                                                                    {alert.priority}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
                                                                    {alert.status}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-muted-foreground">Fuente: {alert.source}</p>
                                                                <p className="text-xs text-muted-foreground">Cliente: {alert.client}</p>
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
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="resueltas" className="mt-0">
                        <div className="space-y-4">
                            {alerts
                                .filter((alert) => alert.status === "Resuelta")
                                .map((alert) => (
                                    <Card key={alert.id}>
                                        <CardContent className="p-0">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                                        <div>
                                                            <h3 className="font-medium">{alert.title}</h3>
                                                            <p className="text-sm text-muted-foreground">{alert.description}</p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <p className="text-xs text-muted-foreground">{alert.time}</p>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {alert.priority}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                                                                    {alert.status}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <p className="text-xs text-muted-foreground">Fuente: {alert.source}</p>
                                                                <p className="text-xs text-muted-foreground">Cliente: {alert.client}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm">
                                                            Ver Detalles
                                                        </Button>
                                                        <Button variant="outline" size="sm">
                                                            Reabrir
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">Mostrando 5 de 24 alertas</p>
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
