"use client"

import type React from "react"

import { useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Mail } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card"
import { useToast } from "../../hooks/use-toast"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Error de validación",
        description: "Por favor, ingresa tu correo electrónico",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulación de envío de correo
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsSubmitted(true)

      toast({
        title: "Correo enviado",
        description: "Hemos enviado un enlace para restablecer tu contraseña",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el correo. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/auth/login" className="mb-8 flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a inicio de sesión
          </Link>
          <h1 className="text-2xl font-bold">Restablecer contraseña</h1>
          <p className="text-muted-foreground">Te enviaremos un enlace para restablecer tu contraseña</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar acceso</CardTitle>
            <CardDescription>Ingresa tu correo electrónico para recibir instrucciones</CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nombre@empresa.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar instrucciones"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    Hemos enviado un correo electrónico a <strong>{email}</strong> con instrucciones para restablecer tu
                    contraseña.
                  </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                  Intentar con otro correo
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col">
            <p className="mt-2 text-center text-sm text-muted-foreground">
              ¿Recuerdas tu contraseña?{" "}
              <Link to="/auth/login" className="text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
