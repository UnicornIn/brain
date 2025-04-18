import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { AlertCircle, CheckCircle2, Clock } from "lucide-react"

const alerts = [
    {
        id: "1",
        title: "Información desactualizada sobre horarios",
        description: "El agente no pudo responder correctamente sobre los horarios de fin de semana",
        time: "Hace 1 hora",
        priority: "Alta",
        status: "Pendiente",
    },
    {
        id: "2",
        title: "Consulta sobre producto no encontrado",
        description: "Cliente preguntó por un producto que no está en la base de conocimiento",
        time: "Hace 3 horas",
        priority: "Media",
        status: "En proceso",
    },
    {
        id: "3",
        title: "Política de devoluciones incompleta",
        description: "Falta información sobre devoluciones internacionales",
        time: "Hace 5 horas",
        priority: "Baja",
        status: "Resuelta",
    },
]

export function AlertsPanel() {
    return (
        <div className="space-y-4">
            {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
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
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                                    <Badge
                                        variant={
                                            alert.priority === "Alta" ? "destructive" : alert.priority === "Media" ? "default" : "secondary"
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
            <div className="flex justify-center">
                <Button variant="outline">Ver todas las alertas</Button>
            </div>
        </div>
    )
}
