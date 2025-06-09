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
  BarChart3,
  MessageSquare,
  Settings,
  Download,
  Filter,
  Copy,
  Edit,
  Send,
  Plus,
  Mail,
  Phone,
  Facebook,
  Instagram,
} from "lucide-react"
import { Link } from "react-router-dom"

type Member = {
  name: string
  email: string
  phone: string
  channels: string[]
  registerDate: string
}

type Form = {
  name: string
  url: string
  registrations: number
  created: string
  active: boolean
}

type CommunityDetailPageProps = {
  members: Member[]
  forms: Form[]
  totalMembers: number
  completedForms: number
  conversionRate: string
}

export default function CommunityDetailPage({
  members,
  forms,
  totalMembers,
  completedForms,
  conversionRate,
}: CommunityDetailPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/communitiespage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clubb de Fidelización</h1>
          <p className="text-muted-foreground">Gestión de comunidad y miembros</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Total Miembros</CardTitle>
            <CardDescription>Miembros registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMembers}</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Formularios Completados</CardTitle>
            <CardDescription>Últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedForms}</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle>Tasa de Conversión</CardTitle>
            <CardDescription>Visitas vs. Registros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{conversionRate}</div>
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
          <TabsTrigger value="communications">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comunicaciones
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analíticas
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Tab: Members */}
        <TabsContent value="members" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar miembros..." className="pl-8" />
            </div>
            <div className="flex gap-2">
              <Select>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="new">Nuevos</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Miembro
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Canales</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
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
                        <div className="flex flex-wrap gap-1">
                          {member.channels.map((channel) => {
                            const icons: Record<string, JSX.Element> = {
                              facebook: <Facebook className="h-3 w-3 text-blue-600" />,
                              instagram: <Instagram className="h-3 w-3 text-pink-600" />,
                              whatsapp: (
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
                              ),
                              email: <Mail className="h-3 w-3 text-gray-600" />,
                            }

                            return (
                              <Badge key={channel} variant="outline" className="flex items-center gap-1">
                                {icons[channel]}
                                <span className="hidden md:inline capitalize">{channel}</span>
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{member.registerDate}</TableCell>
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
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.map((form, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="font-medium">{form.name}</div>
                        <div className="text-sm text-muted-foreground">
                          <Badge variant="outline" className={form.active ? "bg-green-100 text-green-800" : ""}>
                            {form.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate max-w-[200px]">{form.url}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{form.registrations}</TableCell>
                      <TableCell>{form.created}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">Ver</Button>
                          <Button variant="ghost" size="sm">Editar</Button>
                          <Button variant="ghost" size="sm">Duplicar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
