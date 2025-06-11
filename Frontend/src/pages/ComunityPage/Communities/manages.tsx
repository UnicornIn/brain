"use client"

import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { Badge } from "../../../components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Checkbox } from "../../../components/ui/checkbox"
import {
    ArrowLeft,
    Search,
    Users,
    BarChart3,
    MessageSquare,
    Settings,
    Download,
    Filter,
    MoreHorizontal,
    Edit,
    Trash,
    Mail,
    Phone,
    Database,
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"

export default function Manages() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    const toggleMember = (memberId: string) => {
        setSelectedMembers((prev) =>
            prev.includes(memberId) ? prev.filter((item) => item !== memberId) : [...prev, memberId],
        )
    }

    const toggleAllMembers = () => {
        if (selectedMembers.length === mockMembers.length) {
            setSelectedMembers([])
        } else {
            setSelectedMembers(mockMembers.map((member) => member.id))
        }
    }

    const handleBack = () => {
        navigate("/communities")
    }

    // Mock data for the community
    const community = {
        id: id,
        name: "Club de Fidelización",
        members: 458,
        url: "club-fidelizacion",
        campaigns: 2,
        color: "bg-blue-100 text-blue-800",
    }

    // Mock data for members
    const mockMembers = [
        {
            id: "1",
            name: "Ana García",
            email: "ana.garcia@example.com",
            whatsapp: "+34 600 123 456",
            status: "active",
        },
        {
            id: "2",
            name: "Carlos Rodríguez",
            email: "carlos.rodriguez@example.com",
            whatsapp: "+34 600 789 012",
            status: "active",
        },
        {
            id: "3",
            name: "Laura Martínez",
            email: "laura.martinez@example.com",
            whatsapp: "+34 600 345 678",
            status: "inactive",
        },
        {
            id: "4",
            name: "Miguel Fernández",
            email: "miguel.fernandez@example.com",
            whatsapp: "+34 600 901 234",
            status: "active",
        },
        {
            id: "5",
            name: "Sofía López",
            email: "sofia.lopez@example.com",
            whatsapp: "+34 600 567 890",
            status: "inactive",
        },
        {
            id: "6",
            name: "Javier Sánchez",
            email: "javier.sanchez@example.com",
            whatsapp: "+34 600 234 567",
            status: "active",
        },
        {
            id: "7",
            name: "Carmen Díaz",
            email: "carmen.diaz@example.com",
            whatsapp: "+34 600 890 123",
            status: "active",
        },
        {
            id: "8",
            name: "Antonio Pérez",
            email: "antonio.perez@example.com",
            whatsapp: "+34 600 456 789",
            status: "inactive",
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{community.name}</h1>
                        <p className="text-muted-foreground">Gestiona los detalles y miembros de esta comunidad</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Configuración
                    </Button>
                    <Button>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Enviar Mensaje
                    </Button>
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
                        <CardTitle>URL Única</CardTitle>
                        <CardDescription>Enlace de la comunidad</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium text-primary">brain.app/c/{community.url}</div>
                    </CardContent>
                </Card>
                <Card className="flex-1">
                    <CardHeader className="pb-3">
                        <CardTitle>Campañas Activas</CardTitle>
                        <CardDescription>Comunicaciones programadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{community.campaigns}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="database">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="database">
                        <Database className="h-4 w-4 mr-2" />
                        Base de Datos
                    </TabsTrigger>
                    <TabsTrigger value="messages">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Mensajes
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        <Settings className="h-4 w-4 mr-2" />
                        Configuración
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="border rounded-md p-8 text-center">
                        <p className="text-muted-foreground">Seleccione "Base de Datos" para ver los miembros de la comunidad</p>
                    </div>
                </TabsContent>

                <TabsContent value="database" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Base de Datos de Miembros</CardTitle>
                            <CardDescription>Gestiona los miembros registrados en tu comunidad</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 justify-between">
                                <div className="flex flex-1 gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input type="search" placeholder="Buscar miembros..." className="pl-8" />
                                    </div>
                                    <Button variant="outline" size="icon">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <Select>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Todos los miembros" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los miembros</SelectItem>
                                            <SelectItem value="active">Miembros activos</SelectItem>
                                            <SelectItem value="inactive">Miembros inactivos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Exportar
                                    </Button>
                                </div>
                            </div>

                            <div className="border rounded-md">
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="h-10 px-4 text-left align-middle font-medium">
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            checked={selectedMembers.length === mockMembers.length}
                                                            onCheckedChange={toggleAllMembers}
                                                        />
                                                        <span>Miembro</span>
                                                    </div>
                                                </th>
                                                <th className="h-10 px-4 text-left align-middle font-medium">Email</th>
                                                <th className="h-10 px-4 text-left align-middle font-medium">WhatsApp</th>
                                                <th className="h-10 px-4 text-left align-middle font-medium">Estado</th>
                                                <th className="h-10 px-4 text-left align-middle font-medium">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {mockMembers.map((member) => (
                                                <tr key={member.id} className="border-b">
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                checked={selectedMembers.includes(member.id)}
                                                                onCheckedChange={() => toggleMember(member.id)}
                                                            />
                                                            <span className="font-medium">{member.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center">
                                                            <Mail className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                                            {member.email}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center">
                                                            <Phone className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                                            {member.whatsapp}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <Badge
                                                            className={
                                                                member.status === "active"
                                                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                                            }
                                                        >
                                                            {member.status === "active" ? "Activo" : "Inactivo"}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-2">
                                                            <Button variant="ghost" size="icon">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Mostrando <strong>8</strong> de <strong>458</strong> miembros
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" disabled>
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        1
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        2
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        3
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones en Lote</CardTitle>
                            <CardDescription>
                                Realiza acciones sobre los miembros seleccionados ({selectedMembers.length})
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" disabled={selectedMembers.length === 0}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Enviar Email
                                </Button>
                                <Button variant="outline" disabled={selectedMembers.length === 0}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    Enviar WhatsApp
                                </Button>
                                <Button variant="outline" disabled={selectedMembers.length === 0}>
                                    <Users className="mr-2 h-4 w-4" />
                                    Asignar Grupo
                                </Button>
                                <Button variant="outline" disabled={selectedMembers.length === 0}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar Datos
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={selectedMembers.length === 0}
                                    className="text-red-500 hover:text-red-500"
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="messages" className="space-y-4">
                    <div className="border rounded-md p-8 text-center">
                        <p className="text-muted-foreground">Seleccione "Base de Datos" para ver los miembros de la comunidad</p>
                    </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <div className="border rounded-md p-8 text-center">
                        <p className="text-muted-foreground">Seleccione "Base de Datos" para ver los miembros de la comunidad</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
