"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Badge } from "../../components/ui/badge";
import { AlertCircle, BookOpen, Clock, Edit, FileInput, Mic, Plus, Save, Search, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

interface Category {
    id: string;
    name: string;
    items: KnowledgeItem[];
}

interface KnowledgeItem {
    id: string;
    title: string;
    status: "actualizado" | "desactualizado" | "pendiente";
    content?: string;
    lastUpdated?: string;
}

export default function ConocimientoPage() {
    const [categories] = useState<Category[]>([]);
    const [, setSelectedCategory] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [content, setContent] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const handleCategoryClick = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setSelectedItem(null);
        setContent("");
        const category = categories.find((c) => c.id === categoryId);
        if (category?.items?.length) {
            handleItemClick(category.items[0].id);
        }
    };

    const handleItemClick = (itemId: string) => {
        setSelectedItem(itemId);
        const item = categories.flatMap((c) => c.items).find((i) => i.id === itemId);
        setContent(item?.content || "");
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files?.length) return;

        const file = files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                setContent(content);
            } catch (error) {
                console.error("Error al leer el archivo:", error);
            }
        };

        reader.readAsText(file);
    };

    const handleSave = () => {
        console.log("Contenido guardado:", content);
    };

    const filteredCategories = categories.filter(
        (category) =>
            category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.items.some((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );


    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
                <h1 className="text-xl font-bold">Base de Conocimiento</h1>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <label className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            Importar
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleFileUpload}
                                accept=".txt,.pdf,.doc,.docx,.md"
                            />
                        </label>
                    </Button>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Entrada
                    </Button>
                </div>
            </div>

            <div className="p-4 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
                    <Card className="md:col-span-1 h-full">
                        <CardHeader>
                            <CardTitle>Categorías</CardTitle>
                            <CardDescription>Busca y selecciona contenido</CardDescription>
                            <div className="relative mt-2">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredCategories.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full">
                                    {filteredCategories.map((category) => (
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
                                                                className={`w-full justify-start text-left ${
                                                                    selectedItem === item.id ? "bg-muted" : ""
                                                                }`}
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
                            ) : (
                                <div className="p-4 text-center text-muted-foreground">No se encontraron categorías</div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3 h-full flex flex-col">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>
                                        {selectedItem
                                            ? categories.flatMap((c) => c.items).find((i) => i.id === selectedItem)?.title
                                            : "Selecciona un elemento"}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <Clock className="h-4 w-4" />
                                        {selectedItem
                                            ? `Última actualización: ${new Date().toLocaleDateString()}`
                                            : "Selecciona un elemento para ver detalles"}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                    <Button size="sm" onClick={handleSave}>
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
                                    <TabsTrigger value="archivo">Archivo</TabsTrigger>
                                </TabsList>
                                <TabsContent value="texto" className="h-full">
                                    <Textarea
                                        className="min-h-[300px]"
                                        placeholder="Ingresa el contenido aquí..."
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
                                            onClick={() => setIsRecording(!isRecording)}
                                        >
                                            <Mic className="h-6 w-6" />
                                        </Button>
                                        <p className="text-center text-muted-foreground">
                                            {isRecording ? "Grabando... Haz clic para detener" : "Haz clic para comenzar a grabar"}
                                        </p>
                                    </div>
                                </TabsContent>
                                <TabsContent value="archivo" className="h-full">
                                    <div className="flex flex-col items-center justify-center gap-4 min-h-[300px] border-2 border-dashed rounded-lg p-8">
                                        <FileInput className="h-12 w-12 text-muted-foreground" />
                                        <p className="text-center text-muted-foreground">
                                            Arrastra y suelta archivos aquí o haz clic para seleccionar
                                        </p>
                                        <Button variant="outline" asChild>
                                            <label className="cursor-pointer">
                                                <Upload className="h-4 w-4 mr-2" />
                                                Seleccionar archivo
                                                <input type="file" className="hidden" onChange={handleFileUpload} multiple />
                                            </label>
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                        <CardFooter className="border-t">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Sugerencia</AlertTitle>
                                <AlertDescription>
                                    Puedes importar archivos en formatos TXT, PDF, DOC, DOCX o MD para agregar contenido rápidamente.
                                </AlertDescription>
                            </Alert>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
