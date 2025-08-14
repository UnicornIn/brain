"use client"
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

type User = {
  id: string
  name: string
  email: string
  role: string
  token: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, remember: boolean) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Limpiar storage
  const clearAuthStorage = useCallback(() => {
    localStorage.removeItem("crm-user")
    localStorage.removeItem("crm-token")
    sessionStorage.removeItem("crm-user")
    sessionStorage.removeItem("crm-token")
  }, [])

  // Inicializar autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("crm-user") || sessionStorage.getItem("crm-user")
        const storedToken = localStorage.getItem("crm-token") || sessionStorage.getItem("crm-token")
        
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser)
          // Validación básica de datos
          if (parsedUser?.id && parsedUser?.email && parsedUser?.token) {
            setUser(parsedUser)
          } else {
            clearAuthStorage()
          }
        }
      } catch (error) {
        console.error("Error inicializando auth:", error)
        clearAuthStorage()
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [clearAuthStorage])

  // Función de login
  const login = useCallback(async (email: string, password: string, remember: boolean): Promise<boolean> => {
    setIsLoading(true)
    try {
      const response = await fetch("https://staging-brain.rizosfelices.co/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email,
          password: password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error en la autenticación")
      }

      const data = await response.json()
      
      // Estructura de datos consistente con el backend
      const userData = {
        id: data.user.id,
        name: data.user.name || "",
        email: data.user.email,
        role: data.user.role,
        token: data.access_token
      }

      setUser(userData)
      clearAuthStorage() // Limpiar antes de guardar nuevos datos

      if (remember) {
        localStorage.setItem("crm-user", JSON.stringify(userData))
        localStorage.setItem("crm-token", data.access_token)
      } else {
        sessionStorage.setItem("crm-user", JSON.stringify(userData))
        sessionStorage.setItem("crm-token", data.access_token)
      }

      return true
    } catch (error) {
      console.error("Error en login:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [clearAuthStorage])

  // Función de logout
  const logout = useCallback(() => {
    setUser(null)
    clearAuthStorage()
  }, [clearAuthStorage])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
} 