import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Facebook, Instagram, Mail } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

interface Agent {
  id: string
  name: string
  channels: string[]
  resolution: string
  alerts: string
}

interface AgentTableProps {
  agents: Agent[]
}

export default function AgentTable({ agents }: AgentTableProps) {
  return (
    <Table className="border-2 border-gray-200">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px]">Agente</TableHead>
          <TableHead>Canales</TableHead>
          <TableHead>Tasa de Resolución</TableHead>
          <TableHead>Alertas Generadas</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow key={agent.id}>
            <TableCell className="font-medium">{agent.name}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                {agent.channels.includes("facebook") && (
                  <Facebook className="h-4 w-4 text-blue-600" />
                )}
                {agent.channels.includes("instagram") && (
                  <Instagram className="h-4 w-4 text-pink-600" />
                )}
                {agent.channels.includes("whatsapp") && (
                  <svg
                    className="h-4 w-4 text-green-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                  </svg>
                )}
                {agent.channels.includes("email") && (
                  <Mail className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="w-full bg-gray-200 rounded-none h-2.5">
                  <div
                    className={`h-2.5 ${
                      parseInt(agent.resolution) > 90
                        ? "bg-green-500"
                        : parseInt(agent.resolution) > 80
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    style={{ width: agent.resolution }}
                  ></div>
                </div>
                <span className="text-sm">{agent.resolution}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                variant={parseInt(agent.alerts) > 5 ? "destructive" : "outline"}
                className="rounded-none"
              >
                {agent.alerts}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" className="rounded-none mr-2">
                Configurar
              </Button>
              <Button variant="outline" size="sm" className="rounded-none">
                Detalles
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}