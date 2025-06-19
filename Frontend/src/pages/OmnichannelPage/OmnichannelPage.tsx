import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import {
  Facebook,
  Instagram,
  Search,
  Mail,
  Filter,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
// import { AiAgentsPerformance } from "./AgentPerformancePage";
import { useEffect, useState } from "react";
import axios from "axios";

interface Alert {
  id: string;
  conversation_id: string;
  subscriber_id: string;
  channel: string;
  user_message: string;
  assistant_response: string;
  contact_info: {
    name?: string;
    email?: string;
    phone?: string;
  };
  timestamp: string;
  status: "pending" | "resolved";
  created_at: string;
  metadata?: Record<string, any>;
}

export default function OmnichannelPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"pending" | "resolved">("pending");
  const [isGeneratingAlerts, setIsGeneratingAlerts] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  useEffect(() => {
    filterAlerts();
  }, [alerts, searchTerm, channelFilter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://apibrain.rizosfelices.co/agents/alerts?status=${statusFilter}`);

      const alertsData = Array.isArray(response.data) ? response.data : []; ``
      setAlerts(alertsData);
      setFilteredAlerts(alertsData);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setAlerts([]);
      setFilteredAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = [...alerts];

    if (searchTerm) {
      filtered = filtered.filter(alert =>
        alert.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.contact_info.name && alert.contact_info.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        alert.conversation_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (channelFilter !== "all") {
      filtered = filtered.filter(alert => alert.channel === channelFilter);
    }

    setFilteredAlerts(filtered);
  };

  const updateAlertStatus = async (alertId: string, newStatus: "pending" | "resolved") => {
    try {
      await axios.patch(`https://apibrain.rizosfelices.co/agents/alerts/${alertId}`, { status: newStatus });
      fetchAlerts(); // Refrescar la lista después de actualizar
    } catch (error) {
      console.error("Error updating alert status:", error);
    }
  };

  const markAllAsResolved = async () => {
    try {
      const unresolvedAlerts = alerts.filter(alert => alert.status !== "resolved");
      await Promise.all(
        unresolvedAlerts.map(alert =>
          axios.patch(`https://apibrain.rizosfelices.co/agents/alerts/${alert.id}`, { status: "resolved" })
        )
      );
      fetchAlerts();
    } catch (error) {
      console.error("Error marking all as resolved:", error);
    }
  };

  const generateAlerts = async () => {
    try {
      setIsGeneratingAlerts(true);
      await axios.post('https://apibrain.rizosfelices.co/agents/generate-alerts');
      fetchAlerts();
    } catch (error) {
      console.error('Error generando alertas:', error);
    } finally {
      setIsGeneratingAlerts(false);
    }
  };

  const getPriority = (alert: Alert): "high" | "medium" | "low" => {
    if (alert.user_message.toLowerCase().includes("urgente") ||
      alert.user_message.toLowerCase().includes("incompleto")) {
      return "high";
    }
    return "medium";
  };

  const getAlertReason = (alert: Alert): string => {
    if (alert.user_message.toLowerCase().includes("cancelar")) {
      return "Solicitud de cancelación";
    }
    if (alert.user_message.toLowerCase().includes("cupón")) {
      return "Problema con cupón";
    }
    if (alert.user_message.toLowerCase().includes("incompleto")) {
      return "Pedido incompleto";
    }
    return "Intervención requerida";
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Hace unos segundos";
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  const countAlertsByStatus = (status: string): number => {
    return Array.isArray(alerts) ? alerts.filter(a => a.status === status).length : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold tracking-tight">Brain Omnicanal</h1>
          <p className="text-muted-foreground">Alertas de mensajes que requieren intervención humana</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAlerts}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={markAllAsResolved}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Marcar Todo Revisado
          </Button>
          <Button
            onClick={generateAlerts}
            variant="secondary"
            disabled={isGeneratingAlerts}
          >
            {isGeneratingAlerts ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" />
            )}
            Generar Alertas
          </Button>
        </div>
      </div>

      {/* Lista de alertas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alertas de Intervención</CardTitle>
              <CardDescription>Mensajes que la IA no ha podido resolver automáticamente</CardDescription>
            </div>
            <Badge variant="destructive" className="text-base">
              {countAlertsByStatus("pending")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" onValueChange={(value) => setStatusFilter(value as "pending" | "resolved")}>
            <TabsList className="mb-4">
              <TabsTrigger value="resolved">
                Resueltos{" "}
                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                  {countAlertsByStatus("resolved")}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes{" "}
                <Badge variant="outline" className="ml-2 bg-red-100 text-red-800">
                  {countAlertsByStatus("pending")}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar alertas..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={channelFilter} onValueChange={setChannelFilter}>
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
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <p>Cargando alertas...</p>
              </div>
            ) : (
              <TabsContent value={statusFilter} className="m-0">
                <div className="border rounded-md">
                  {filteredAlerts.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-muted-foreground">
                        No hay alertas {statusFilter === "pending" ? "pendientes" : "resueltas"}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 divide-y">
                      {filteredAlerts.map((alert) => {
                        const priority = getPriority(alert);
                        const timeAgo = getTimeAgo(alert.timestamp);
                        const reason = getAlertReason(alert);
                        const name = alert.contact_info?.name || `Usuario ${alert.subscriber_id.slice(0, 6)}`;

                        return (
                          <div key={alert.id} className="p-4 hover:bg-muted/50">
                            <div className="flex items-start gap-4">
                              <div className="mt-1">
                                {alert.status === "pending" ? (
                                  priority === "high" ? (
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                  ) : (
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                  )
                                ) : (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {name}
                                    {alert.status === "pending" && priority === "high" && (
                                      <Badge variant="destructive">Urgente</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground">{timeAgo}</div>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{alert.user_message}</p>
                                <div className="bg-muted/50 p-2 rounded-md text-xs mb-2">
                                  <span className="font-medium">Motivo de alerta:</span> {reason}
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
                                  {alert.status === "pending" && (
                                    <div className="ml-auto">
                                      <Button
                                        size="sm"
                                        onClick={() => updateAlertStatus(alert.id, "resolved")}
                                      >
                                        Resolver
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
      {/* <AiAgentsPerformance /> */}
    </div>
  );
}