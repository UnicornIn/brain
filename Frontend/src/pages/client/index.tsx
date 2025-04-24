import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Badge } from "../../components/ui/badge";
import { Download, Filter, MoreHorizontal, Plus, Search, Upload } from "lucide-react";

interface Client {
  _id: string;
  subscriber_id: string;
  first_name?: string;
  phone?: string;
  whatsapp_phone?: string;
  source_system?: string;
  last_updated?: string | Date;
}

// Función para manejar fechas de forma segura
const formatDate = (dateString?: string | Date) => {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "N/A";
  }
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/subscribers/subscribers/contacts/all', {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.status === "success") {
          setClients(data.data);
        } else {
          throw new Error("Error al obtener los clientes");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (client.first_name?.toLowerCase().includes(searchLower)) ||
      (client.phone?.toLowerCase().includes(searchLower)) ||
      (client.whatsapp_phone?.toLowerCase().includes(searchLower))
    );
  });

  const getContactSource = (client: Client) => {
    return client.whatsapp_phone ? "WhatsApp" : client.source_system || "Desconocido";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><p>Cargando clientes...</p></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full"><p className="text-destructive">Error: {error}</p></div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">Gestión de Clientes</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" /> Importar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-4">
        {/* Barra de búsqueda y filtros */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Buscar clientes..." 
                className="pl-8 w-full" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
              <span className="sr-only">Filtrar</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Todos</Button>
            <Button variant="outline" size="sm">Activos</Button>
            <Button variant="outline" size="sm">Inactivos</Button>
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Última Actualización</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client._id}>
                    <TableCell className="font-medium">
                      {client.first_name || "N/A"}
                    </TableCell>
                    <TableCell>{client.phone || "N/A"}</TableCell>
                    <TableCell>{client.whatsapp_phone || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getContactSource(client)}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(client.last_updated)}
                    </TableCell>
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
                          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Ver interacciones</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pie de tabla */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredClients.length} de {clients.length} clientes
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Siguiente</Button>
          </div>
        </div>
      </div>
    </div>
  );
}