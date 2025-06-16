"use client"

import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Badge } from "../../../components/ui/badge"
import { Avatar, AvatarFallback } from "../../../components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import {
  Search,
  ArrowLeft,
  Users,
  Link2,
  Edit,
  Send,
  Plus,
  Mail,
  Phone,
  Check,
  X,
} from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"

interface Member {
  community_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  join_reason: string;
  has_completed_survey: boolean;
  registration_date: string;
  role: string;
  status: string;
}

interface Community {
  id: string;
  title: string;
  description: string;
  members: number;
  image?: string;
}

export default function CommunityDetailPage() {
  const { id: communityId } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        setCommunity({
          id: communityId || '',
          title: "Comunidad",
          description: "Descripción de la comunidad",
          members: 0
        });

        const membersResponse = await fetch(`http://127.0.0.1:8000/community/members/${communityId}`);
        if (!membersResponse.ok) {
          throw new Error('Error al obtener los miembros de la comunidad');
        }
        const membersData = await membersResponse.json();
        setMembers(membersData.members || []);
        
        setCommunity(prev => prev ? {
          ...prev,
          members: membersData.members?.length || 0,
          title: `Comunidad (${membersData.members?.length || 0} miembros)`
        } : null);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [communityId]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string, label: string }> = {
      active: { className: "bg-green-100 text-green-800", label: "Activo" },
      inactive: { className: "bg-red-100 text-red-800", label: "Inactivo" },
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pendiente" }
    };
    
    return (
      <Badge variant="outline" className={statusMap[status]?.className || "bg-gray-100 text-gray-800"}>
        {statusMap[status]?.label || status}
      </Badge>
    );
  };

  const getSurveyBadge = (completed: boolean) => {
    return completed ? (
      <Badge variant="outline" className="bg-green-100 text-green-800">
        <Check className="h-3 w-3 mr-1" /> Completo
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-100 text-red-800">
        <X className="h-3 w-3 mr-1" /> Incompleto
      </Badge>
    );
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const openMemberDetails = (member: Member) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div>Cargando datos de la comunidad...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex justify-center items-center h-64">
        <div>No se encontró la comunidad</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/communities">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{community.title}</h1>
          <p className="text-muted-foreground">{community.description}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Total Miembros</CardTitle>
            <CardDescription>Miembros registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{community.members}</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Formularios Completados</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {members.filter(m => m.has_completed_survey).length}
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Tasa de Conversión</CardTitle>
            <CardDescription>Visitas vs. Registros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">72%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-4">
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Miembros
          </TabsTrigger>
          <TabsTrigger value="forms">
            <Link2 className="h-4 w-4 mr-2" />
            Formularios
          </TabsTrigger>
        </TabsList>

        {/* Tab: Members */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Buscar miembros..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
              {/* Botones ocultos */}
              {/* <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Miembro
              </Button> */}
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Encuesta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead>Razón de ingreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.user_id} onClick={() => openMemberDetails(member)} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.full_name}</div>
                            <div className="text-sm text-muted-foreground">{member.role}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{member.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSurveyBadge(member.has_completed_survey)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(member.status)}
                      </TableCell>
                      <TableCell>{member.registration_date}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {member.join_reason}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Forms */}
        <TabsContent value="forms" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Formularios Activos</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Formulario
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No hay formularios activos para esta comunidad
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalles del miembro */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalles del Miembro</DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {selectedMember.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedMember.full_name}</h3>
                  <div className="flex gap-2 mt-1">
                    {getStatusBadge(selectedMember.status)}
                    {getSurveyBadge(selectedMember.has_completed_survey)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-500">Información Básica</h4>
                  <div className="space-y-1">
                    <div>
                      <span className="text-sm text-gray-500">Rol:</span>
                      <p>{selectedMember.role}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Fecha de Registro:</span>
                      <p>{selectedMember.registration_date}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-500">Contacto</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedMember.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedMember.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <h4 className="font-medium text-gray-500">Razón de Ingreso</h4>
                  <p className="whitespace-pre-line">{selectedMember.join_reason}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}