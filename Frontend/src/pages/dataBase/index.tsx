"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import {
    AlertCircle,
    ArrowUpDown,
    Check,
    Download,
    Edit,
    FileSpreadsheet,
    Filter,
    MoreHorizontal,
    Search,
    X,
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"

export default function BaseDatosPage() {
    const [activeTab, setActiveTab] = useState("importar")
    const [dragActive, setDragActive] = useState(false)
    const [fileUploaded, setFileUploaded] = useState(false)
    const [fileName, setFileName] = useState("")

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            setFileName(file.name)
            setFileUploaded(true)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setFileName(file.name)
            setFileUploaded(true)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Gestión de Base de Datos de Clientes</h1>
            </div>

            <div className="p-4 flex-1">
                <Tabs defaultValue="importar" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="importar">Importar Datos</TabsTrigger>
                        <TabsTrigger value="gestionar">Gestionar Datos</TabsTrigger>
                        <TabsTrigger value="historial">Historial de Cambios</TabsTrigger>
                    </TabsList>

                    <TabsContent value="importar" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Importar Datos de Clientes</CardTitle>
                                <CardDescription>Sube un archivo CSV o Excel con los datos de tus clientes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
                                        } ${fileUploaded ? "bg-green-50" : ""}`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    {!fileUploaded ? (
                                        <>
                                            <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                                            <h3 className="mt-4 text-lg font-semibold">Arrastra y suelta tu archivo aquí</h3>
                                            <p className="mt-2 text-sm text-muted-foreground">o haz clic para seleccionar un archivo</p>
                                            <Input
                                                id="file-upload"
                                                type="file"
                                                className="hidden"
                                                accept=".csv,.xlsx,.xls"
                                                onChange={handleFileChange}
                                            />
                                            <Button
                                                variant="outline"
                                                className="mt-4"
                                                onClick={() => document.getElementById("file-upload")?.click()}
                                            >
                                                Seleccionar Archivo
                                            </Button>
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                Formatos soportados: CSV, Excel (.xlsx, .xls)
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mx-auto h-12 w-12 text-green-500" />
                                            <h3 className="mt-4 text-lg font-semibold text-green-600">Archivo listo para importar</h3>
                                            <p className="mt-2 text-sm">{fileName}</p>
                                            <div className="flex justify-center gap-2 mt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setFileUploaded(false)
                                                        setFileName("")
                                                    }}
                                                >
                                                    Cambiar Archivo
                                                </Button>
                                                <Button onClick={() => setActiveTab("gestionar")}>Continuar</Button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {fileUploaded && (
                                    <Alert className="mt-4">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Información</AlertTitle>
                                        <AlertDescription>
                                            Haz clic en "Continuar" para previsualizar y validar los datos antes de importarlos.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <div className="text-sm text-muted-foreground">
                                    <p>Consejos para la importación:</p>
                                    <ul className="list-disc list-inside ml-2 mt-1">
                                        <li>Asegúrate de que tu archivo tenga encabezados</li>
                                        <li>Los campos obligatorios son: nombre, email o teléfono</li>
                                        <li>Máximo 5,000 registros por archivo</li>
                                    </ul>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Descargar Plantilla
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="gestionar" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gestionar Datos de Clientes</CardTitle>
                                <CardDescription>Visualiza, edita y valida los datos de tus clientes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 w-full max-w-sm">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input type="search" placeholder="Buscar en los datos..." className="pl-8 w-full" />
                                        </div>
                                        <Button variant="outline" size="icon">
                                            <Filter className="h-4 w-4" />
                                            <span className="sr-only">Filtrar</span>
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="gap-1">
                                            <AlertCircle className="h-3 w-3 text-amber-500" />5 errores
                                        </Badge>
                                        <Button variant="outline" size="sm">
                                            Validar Datos
                                        </Button>
                                        <Button size="sm">Importar Datos</Button>
                                    </div>
                                </div>

                                <div className="rounded-md border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">Fila</TableHead>
                                                <TableHead>
                                                    <div className="flex items-center gap-1">
                                                        Nombre
                                                        <ArrowUpDown className="h-3 w-3" />
                                                    </div>
                                                </TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Teléfono</TableHead>
                                                <TableHead>Origen</TableHead>
                                                <TableHead>Estado</TableHead>
                                                <TableHead className="w-[100px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <TableRow key={index} className={index === 1 || index === 3 ? "bg-amber-50" : ""}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell className="font-medium">
                                                        {index === 1 ? (
                                                            <div className="flex items-center gap-1">
                                                                <span>Juan</span>
                                                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                                            </div>
                                                        ) : (
                                                            `Cliente ${index + 1}`
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {index === 3 ? (
                                                            <div className="flex items-center gap-1">
                                                                <span>email_invalido</span>
                                                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                                            </div>
                                                        ) : (
                                                            `cliente${index + 1}@ejemplo.com`
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{`+34 6${index}${index} ${index}${index}${index} ${index}${index}${index}`}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {index % 2 === 0 ? "WhatsApp" : index % 3 === 0 ? "Instagram" : "Web"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={index % 3 === 0 ? "secondary" : "default"}>
                                                            {index % 3 === 0 ? "Inactivo" : "Activo"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="ghost" size="icon">
                                                                <Edit className="h-4 w-4" />
                                                                <span className="sr-only">Editar</span>
                                                            </Button>
                                                            <Button variant="ghost" size="icon">
                                                                <X className="h-4 w-4" />
                                                                <span className="sr-only">Eliminar</span>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">Mostrando 5 de 120 registros</p>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" disabled>
                                            Anterior
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setActiveTab("importar")}>
                                    Volver
                                </Button>
                                <Button>Guardar Cambios</Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="historial" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Cambios</CardTitle>
                                <CardDescription>Visualiza y revierte cambios realizados en la base de datos</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Usuario</TableHead>
                                                <TableHead>Acción</TableHead>
                                                <TableHead>Detalles</TableHead>
                                                <TableHead>Registros</TableHead>
                                                <TableHead className="w-[100px]">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{new Date(2023, 3, 15 - index).toLocaleDateString()}</TableCell>
                                                    <TableCell>Admin Usuario</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                index === 0
                                                                    ? "default"
                                                                    : index === 1
                                                                        ? "secondary"
                                                                        : index === 2
                                                                            ? "destructive"
                                                                            : "outline"
                                                            }
                                                        >
                                                            {index === 0
                                                                ? "Importación"
                                                                : index === 1
                                                                    ? "Actualización"
                                                                    : index === 2
                                                                        ? "Eliminación"
                                                                        : "Exportación"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {index === 0
                                                            ? "Importación masiva de clientes"
                                                            : index === 1
                                                                ? "Actualización de datos de contacto"
                                                                : index === 2
                                                                    ? "Eliminación de registros duplicados"
                                                                    : "Exportación para informe mensual"}
                                                    </TableCell>
                                                    <TableCell>{120 - index * 15}</TableCell>
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
                                                                <DropdownMenuItem>Descargar log</DropdownMenuItem>
                                                                {index < 3 && (
                                                                    <DropdownMenuItem className="text-destructive">Revertir cambios</DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
