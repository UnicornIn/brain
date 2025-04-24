"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Separator } from "../../components/ui/separator"
import { Switch } from "../../components/ui/switch"
import { useAuth } from "../../context/auth-context"
import { useToast } from "../../hooks/use-toast"

export default function ProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulación de guardado
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulación de cambio de contraseña
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">Mi Perfil</h1>
      </div>

      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center">
              <Avatar className="h-32 w-32 mb-4">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                <AvatarFallback className="text-4xl">{user?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Cambiar foto
              </Button>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-sm">Cuenta activa</span>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium">Rol</h3>
                <p>{user?.role}</p>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium">Último acceso</h3>
                <p>Hoy, 10:30 AM</p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="general">
            <TabsList className="mb-6">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="security">Seguridad</TabsTrigger>
              <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualiza tu información personal y de contacto</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" defaultValue={user?.name} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input id="email" type="email" defaultValue={user?.email} />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" type="tel" placeholder="+34 612 345 678" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="position">Cargo</Label>
                        <Input id="position" placeholder="Gerente de Ventas" />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="bio">Biografía</Label>
                        <textarea
                          id="bio"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Escribe una breve descripción sobre ti"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Guardando..." : "Guardar cambios"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Cambiar Contraseña</CardTitle>
                  <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Contraseña actual</Label>
                        <Input id="current-password" type="password" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva contraseña</Label>
                        <Input id="new-password" type="password" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Actualizando..." : "Actualizar contraseña"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Autenticación de dos factores</CardTitle>
                  <CardDescription>Añade una capa adicional de seguridad a tu cuenta</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Autenticación de dos factores</h4>
                        <p className="text-sm text-muted-foreground">
                          Protege tu cuenta con autenticación de dos factores
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Sesiones activas</h4>
                        <p className="text-sm text-muted-foreground">
                          Administra tus sesiones activas en diferentes dispositivos
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Administrar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferencias de notificaciones</CardTitle>
                  <CardDescription>Configura cómo y cuándo quieres recibir notificaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-3">Notificaciones por correo electrónico</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="email-alerts" className="font-normal">
                              Alertas del sistema
                            </Label>
                            <p className="text-sm text-muted-foreground">Recibe alertas importantes sobre el sistema</p>
                          </div>
                          <Switch id="email-alerts" defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="email-clients" className="font-normal">
                              Nuevos clientes
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Notificaciones cuando se registren nuevos clientes
                            </p>
                          </div>
                          <Switch id="email-clients" defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="email-interactions" className="font-normal">
                              Interacciones
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Notificaciones sobre nuevas interacciones con clientes
                            </p>
                          </div>
                          <Switch id="email-interactions" />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium mb-3">Notificaciones en la aplicación</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="app-alerts" className="font-normal">
                              Alertas del sistema
                            </Label>
                            <p className="text-sm text-muted-foreground">Recibe alertas importantes sobre el sistema</p>
                          </div>
                          <Switch id="app-alerts" defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="app-clients" className="font-normal">
                              Nuevos clientes
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Notificaciones cuando se registren nuevos clientes
                            </p>
                          </div>
                          <Switch id="app-clients" defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="app-interactions" className="font-normal">
                              Interacciones
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Notificaciones sobre nuevas interacciones con clientes
                            </p>
                          </div>
                          <Switch id="app-interactions" defaultChecked />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>Guardar preferencias</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
