// components/ai-agents-performance.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Button } from "../../components/ui/button"
import { Facebook, Instagram, Mail } from "lucide-react"
import { Badge } from "../../components/ui/badge"

export function AiAgentsPerformance() {
  return (
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
                      className={`h-2.5 rounded-full ${
                        Number.parseInt(agent.resolution) > 90
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
  )
}