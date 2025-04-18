"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Textarea } from "../../components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion"
import { Badge } from "../../components/ui/badge"
import { AlertCircle, BookOpen, Clock, Edit, Mic, Plus, Save, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert"

const categories = [
    {
        id: "1",
        name: "Horarios",
        items: [
            { id: "1-1", title: "Horarios de atención", status: "actualizado" },
            { id: "1-2", title: "Horarios de fin de semana", status: "desactualizado" },
            { id: "1-3", title: "Horarios de días festivos", status: "actualizado" },
        ],
    },
    {
        id: "2",
        name: "Políticas",
        items: [
            { id: "2-1", title: "Política de devoluciones", status: "actualizado" },
            { id: "2-2", title: "Política de envíos", status: "actualizado" },
            { id: "2-3", title: "Política de privacidad", status: "actualizado" },
        ],
    },
    {
        id: "3",
        name: "Productos",
        items: [
            { id: "3-1", title: "Catálogo actual", status: "actualizado" },
            { id: "3-2", title: "Productos en oferta", status: "desactualizado" },
            { id: "3-3", title: "Productos nuevos", status: "pendiente" },
        ],
    },
    {
        id: "4",
        name: "FAQs",
        items: [
            { id: "4-1", title: "Preguntas frecuentes generales", status: "actualizado" },
            { id: "4-2", title: "FAQs sobre envíos", status: "actualizado" },
            { id: "4-3", title: "FAQs sobre pagos", status: "pendiente" },
        ],
    },
]

export default function ConocimientoPage() {
    const [selectedCategory, setSelectedCategory] = useState("1")
    const [selectedItem, setSelectedItem] = useState("1-1")
    const [isRecording, setIsRecording] = useState(false)
    const [content, setContent] = useState(
        "Nuestros horarios de atención son de lunes a viernes de 9:00 a 18:00 horas. Para más información, puede contactar con nuestro servicio de atención al cliente.",
    )

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId)
        // Select first item of the category
        const firstItem = categories.find((c) => c.id === categoryId)?.items[0]
        if (firstItem) {
            setSelectedItem(firstItem.id)
        }
    }

    const handleItemClick = (itemId: string) => {
        setSelectedItem(itemId)
        // In a real app, we would fetch the content for this item
        setContent("Contenido para el elemento " + itemId)
    }

    const handleRecording = () => {
        setIsRecording(!isRecording)
        // In a real app, this would start/stop recording
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Base de Conocimiento</h1>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Entrada
                </Button>
            </div>

            <div className="p-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                    <Card className="md:col-span-1 h-full">
                        <CardHeader>
                            <CardTitle>Categorías</CardTitle>
                            <CardDescription>Selecciona una categoría para editar</CardDescription>
                            <div className="relative mt-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input type="search" placeholder="Buscar categoría..." className="pl-8" />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Accordion type="single" collapsible className="w-full" defaultValue="1">
                                {categories.map((category) => (
                                    <AccordionItem key={category.id} value={category.id}>
                                        <AccordionTrigger
                                            className="px-4 py-2 hover:bg-muted/50"
                                            onClick={() => handleCategoryClick(category.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                <span>{category.name}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="p-0">
                                            <ul className="space-y-1 p-1">
                                                {category.items.map((item) => (
                                                    <li key={item.id}>
                                                        <Button
                                                            variant="ghost"
                                                            className={`w-full justify-start text-left ${selectedItem === item.id ? "bg-muted" : ""}`}
                                                            onClick={() => handleItemClick(item.id)}
                                                        >
                                                            <div className="flex items-center gap-2 w-full">
                                                                <span className="truncate">{item.title}</span>
                                                                {item.status === "desactualizado" && (
                                                                    <Badge variant="destructive" className="ml-auto text-xs">
                                                                        Desactualizado
                                                                    </Badge>
                                                                )}
                                                                {item.status === "pendiente" && (
                                                                    <Badge variant="secondary" className="ml-auto text-xs">
                                                                        Pendiente
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3 h-full flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>
                                        {categories.find((c) => c.id === selectedCategory)?.items.find((i) => i.id === selectedItem)
                                            ?.title || "Selecciona un elemento"}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Clock className="h-4 w-4" />
                                        Última actualización: 15/04/2023
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button size="sm">
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <Tabs defaultValue="texto">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="texto">Texto</TabsTrigger>
                                    <TabsTrigger value="voz">Voz</TabsTrigger>
                                </TabsList>
                                <TabsContent value="texto" className="h-full">
                                    <Textarea
                                        className="min-h-[300px]"
                                        placeholder="Ingresa la información aquí..."
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                    />
                                </TabsContent>
                                <TabsContent value="voz" className="h-full">
                                    <div className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
                                        <Button
                                            variant={isRecording ? "destructive" : "default"}
                                            size="lg"
                                            className="rounded-full h-16 w-16"
                                            onClick={handleRecording}
                                        >
                                            <Mic className="h-6 w-6" />
                                        </Button>
                                        <p className="text-center text-muted-foreground">
                                            {isRecording ? "Grabando... Haz clic para detener" : "Haz clic para comenzar a grabar"}
                                        </p>
                                        {isRecording && (
                                            <div className="w-full max-w-md">
                                                <div className="h-8 bg-muted rounded-full overflow-hidden">
                                                    <div className="h-full w-3/4 bg-primary animate-pulse rounded-full"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                        <CardFooter className="border-t">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Sugerencia</AlertTitle>
                                <AlertDescription>
                                    Si detectas información desactualizada, puedes solicitar una actualización al equipo correspondiente.
                                </AlertDescription>
                            </Alert>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
