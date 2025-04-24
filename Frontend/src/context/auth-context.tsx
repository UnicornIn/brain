"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

type User = {
  id: string
  name: string
  email: string
  role: string
  avatar: string
} | null

type AuthContextType = {
  user: User
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Verificar si hay un usuario en localStorage al cargar la aplicación
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulación de autenticación
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const userData = {
        id: "1",
        name: "Admin Usuario",
        email: email,
        role: "Administrador",
        avatar: "/placeholder.svg?height=32&width=32",
      }

      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    navigate("/auth/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
