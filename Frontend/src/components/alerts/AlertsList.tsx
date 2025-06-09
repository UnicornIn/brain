import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Search, RotateCw, MessageSquare, Phone, Instagram, Facebook, Twitter, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { useEffect, useState, ReactNode } from "react";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

// Define las props del componente
export type AlertListProps = {
  status: 'pending' | 'resolved';
  children?: ReactNode;
};

// Definición de tipos
interface ContactInfo {
  whatsappphone?: string;
  tt_username?: string;
  ig_username?: string;
  gender?: string;
}

interface Alert {
  id: string;
  conversation_id: string;
  subscriber_id: string;
  channel: string;
  user_message: string;
  assistant_response: string;
  contact_info?: ContactInfo;
  timestamp: string;
  status: 'pendiente' | 'resuelta';
  metadata?: {
    priority?: 'baja' | 'media' | 'alta';
    reason?: string;
    [key: string]: any;
  };
}

export default function AlertList({ status, children }: AlertListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Iconos por canal
  const channelIcons = {
    whatsapp: <Phone className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    instagram: <Instagram className="h-4 w-4" />,
    tiktok: <Twitter className="h-4 w-4" />,
    default: <MessageSquare className="h-4 w-4" />
  };

  // Colores por prioridad
  const priorityColors = {
    alta: "destructive",
    media: "default",
    baja: "secondary"
  };

  // Obtener alertas del backend
  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`http://127.0.0.1:8000/agents/alerts?status=${status === 'pending' ? 'pending' : 'resolved'}&limit=50&skip=0`);

      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Formato de respuesta inválido');
      }

      // Procesar y traducir las alertas
      const processedAlerts = data.map((alert: any) => ({
        ...alert,
        status: alert.status === 'pending' ? 'pendiente' : 'resuelta',
        metadata: {
          ...alert.metadata,
          priority: alert.metadata?.priority === 'high' ? 'alta' :
            alert.metadata?.priority === 'medium' ? 'media' : 'baja'
        }
      }));

      setAlerts(processedAlerts);
    } catch (error) {
      console.error("Error cargando alertas:", error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setAlerts([]);
      toast({
        title: "Error",
        description: "No se pudieron cargar las alertas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Actualizar estado de una alerta
  const updateAlertStatus = async (alertId: string, newStatus: 'pendiente' | 'resuelta') => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/agents/alerts/${alertId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus === 'pendiente' ? 'pending' : 'resolved'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP! estado: ${response.status}`);
      }

      // Actualizar estado localmente
      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, status: newStatus } : alert
      ));

      toast({
        title: "Éxito",
        description: `Alerta marcada como ${newStatus}`,
      });
    } catch (error) {
      console.error("Error actualizando alerta:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la alerta",
        variant: "destructive",
      });
    }
  };

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    const channelMatch = selectedChannel === 'todos' ||
      alert.channel.toLowerCase() === selectedChannel.toLowerCase();

    const statusMatch = alert.status === (status === 'pending' ? 'pendiente' : 'resuelta');

    const searchMatch = searchTerm === '' ||
      alert.user_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.contact_info?.whatsappphone && alert.contact_info.whatsappphone.includes(searchTerm)) ||
      (alert.contact_info?.tt_username && alert.contact_info.tt_username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alert.contact_info?.ig_username && alert.contact_info.ig_username.toLowerCase().includes(searchTerm.toLowerCase()));

    return channelMatch && statusMatch && searchMatch;
  });

  // Efecto para cargar alertas al montar y cuando cambian los filtros
  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedChannel]);

  // Obtener iniciales para el avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`
      : name.substring(0, 2);
  };

  return (
    <div className="space-y-6 p-4">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold">Brain Omnicanal</h1>
        <p className="text-muted-foreground">
          Alertas de mensajes que requieren intervención humana
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar alertas..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={fetchAlerts}>
            <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Estado actual */}
      <div>
        <p>Estado actual: {status}</p>
        {children}
      </div>

      {/* Lista de alertas */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <RotateCw className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <Badge variant="destructive">Error</Badge>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchAlerts}>
            Reintentar
          </Button>
        </Card>
      ) : filteredAlerts.length > 0 ? (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id} className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(alert.contact_info?.whatsappphone || "CD")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{alert.contact_info?.whatsappphone || "Contacto desconocido"}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground">
                      {channelIcons[alert.channel.toLowerCase() as keyof typeof channelIcons] || channelIcons.default}
                      <span className="ml-1 capitalize">{alert.channel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={priorityColors[alert.metadata?.priority as keyof typeof priorityColors] as "default" | "destructive" | "secondary" | "outline" || "default"}>
                    {alert.metadata?.priority === 'alta' ? 'Alta' :
                      alert.metadata?.priority === 'media' ? 'Media' : 'Baja'}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-4 w-4" />
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(alert.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Mensaje:</span> {alert.user_message}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Razón:</span> {alert.metadata?.reason || "Intervención requerida"}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-2">
                {alert.status === 'pendiente' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => updateAlertStatus(alert.id, 'resuelta')}
                  >
                    Marcar como Resuelta
                  </Button>
                )}
                {alert.status === 'resuelta' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateAlertStatus(alert.id, 'pendiente')}
                  >
                    Reabrir
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 flex flex-col items-center justify-center text-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">
            No hay alertas {status === 'pending' ? 'pendientes' : 'resueltas'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Todo está bajo control por ahora. 🧠
          </p>
        </Card>
      )}
    </div>
  );
}
