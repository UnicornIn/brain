import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  Facebook,
  Instagram,
  Search,
  Mail,
  Filter,
  RefreshCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

export default function OmnichannelPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brain Omnicanal</h1>
          <p className="text-muted-foreground">Alertas de mensajes que requieren intervención humana</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Marcar Todo Revisado
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alertas de Intervención</CardTitle>
              <CardDescription>Mensajes que la IA no ha podido resolver automáticamente</CardDescription>
            </div>
            <Badge variant="destructive" className="text-base">
              12
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pendientes{" "}
                <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
                  12
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="inprogress">
                En Proceso{" "}
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800">
                  5
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="resolved">
                Resueltos{" "}
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                  28
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar alertas..." className="pl-8" />
              </div>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="email">Correo</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value="pending" className="m-0">
              <div className="border rounded-md">
                <div className="grid grid-cols-1 divide-y">
                  {[
                    {
                      name: "María González",
                      message: "Necesito cancelar mi pedido #45982 que realicé ayer, pero el sistema no me lo permite.",
                      time: "Hace 5 min",
                      channel: "whatsapp",
                      priority: "high",
                      reason: "Solicitud de cancelación fuera del flujo estándar",
                    },
                    {
                      name: "Carlos Rodríguez",
                      message:
                        "He intentado usar el cupón DESCUENTO20 pero me dice que no es válido, aunque su agente me confirmó que sí lo es.",
                      time: "Hace 15 min",
                      channel: "facebook",
                      priority: "medium",
                      reason: "Conflicto en validación de cupones",
                    },
                    {
                      name: "Ana Martínez",
                      message:
                        "Mi pedido llegó incompleto, faltan 2 artículos de los 5 que compré. Necesito una solución urgente.",
                      time: "Hace 30 min",
                      channel: "email",
                      priority: "high",
                      reason: "Reclamación de pedido incompleto",
                    },
                    {
                      name: "Juan López",
                      message: "Necesito cambiar la dirección de entrega de mi pedido #34521 que está en camino.",
                      time: "Hace 1 hora",
                      channel: "instagram",
                      priority: "high",
                      reason: "Cambio de dirección en pedido en tránsito",
                    },
                    {
                      name: "Laura Sánchez",
                      message:
                        "El producto que recibí no coincide con la descripción del sitio web. Es de otro color y tamaño.",
                      time: "Hace 2 horas",
                      channel: "tiktok",
                      priority: "medium",
                      reason: "Discrepancia entre producto recibido y descripción",
                    },
                  ].map((alert, i) => (
                    <div key={i} className="p-4 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {alert.priority === "high" ? (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          ) : alert.priority === "medium" ? (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium flex items-center gap-2">
                              {alert.name}
                              {alert.priority === "high" && <Badge variant="destructive">Urgente</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground">{alert.time}</div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                          <div className="bg-muted/50 p-2 rounded-md text-xs mb-2">
                            <span className="font-medium">Motivo de alerta:</span> {alert.reason}
                          </div>
                          <div className="flex items-center gap-2">
                            {alert.channel === "facebook" && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Facebook className="h-3 w-3 text-blue-600" />
                                <span>Facebook</span>
                              </Badge>
                            )}
                            {alert.channel === "instagram" && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Instagram className="h-3 w-3 text-pink-600" />
                                <span>Instagram</span>
                              </Badge>
                            )}
                            {alert.channel === "whatsapp" && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <svg
                                  className="h-3 w-3 text-green-600"
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                                  <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                                  <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                                  <path d="M9.5 13.5c.5 1 1.5 1 2 1s1.5 0 2-1" />
                                </svg>
                                <span>WhatsApp</span>
                              </Badge>
                            )}
                            {alert.channel === "tiktok" && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <svg
                                  className="h-3 w-3"
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                </svg>
                                <span>TikTok</span>
                              </Badge>
                            )}
                            {alert.channel === "email" && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-gray-600" />
                                <span>Correo</span>
                              </Badge>
                            )}
                            <div className="ml-auto">
                              <Button size="sm">Atender</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inprogress" className="m-0">
              <div className="border rounded-md p-6 text-center">
                <p className="text-muted-foreground">
                  Seleccione "En Proceso" para ver las alertas que están siendo atendidas
                </p>
              </div>
            </TabsContent>

            <TabsContent value="resolved" className="m-0">
              <div className="border rounded-md p-6 text-center">
                <p className="text-muted-foreground">
                  Seleccione "Resueltos" para ver el historial de alertas resueltas
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rendimiento de Agentes IA</CardTitle>
          <CardDescription>Monitoreo y configuración de agentes de inteligencia artificial</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Canales</TableHead>
                <TableHead>Tasa de Resolución</TableHead>
                <TableHead>Alertas Generadas</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Asistente General",
                  channels: ["facebook", "instagram", "whatsapp", "tiktok", "email"],
                  resolution: "85%",
                  alerts: "5",
                },
                {
                  name: "Soporte Técnico",
                  channels: ["whatsapp", "email"],
                  resolution: "92%",
                  alerts: "2",
                },
                {
                  name: "Ventas",
                  channels: ["facebook", "instagram", "whatsapp"],
                  resolution: "78%",
                  alerts: "8",
                },
                {
                  name: "Atención al Cliente",
                  channels: ["whatsapp", "email"],
                  resolution: "88%",
                  alerts: "3",
                },
                {
                  name: "Consultas de Productos",
                  channels: ["facebook", "instagram", "tiktok"],
                  resolution: "90%",
                  alerts: "4",
                },
              ].map((agent, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="font-medium">{agent.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {agent.channels.includes("facebook") && <Facebook className="h-4 w-4 text-blue-600" />}
                      {agent.channels.includes("instagram") && <Instagram className="h-4 w-4 text-pink-600" />}
                      {agent.channels.includes("whatsapp") && (
                        <svg
                          className="h-4 w-4 text-green-600"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                          <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                          <path d="M14 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1Z" />
                          <path d="M9.5 13.5c.5 1 1.5 1 2 1s1.5 0 2-1" />
                        </svg>
                      )}
                      {agent.channels.includes("tiktok") && (
                        <svg
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                        </svg>
                      )}
                      {agent.channels.includes("email") && <Mail className="h-4 w-4 text-gray-600" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${Number.parseInt(agent.resolution) > 90
                            ? "bg-green-500"
                            : Number.parseInt(agent.resolution) > 80
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                        style={{ width: agent.resolution }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">{agent.resolution}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={Number.parseInt(agent.alerts) > 5 ? "destructive" : "outline"}>
                      {agent.alerts}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Configurar
                    </Button>
                    <Button variant="ghost" size="sm">
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
