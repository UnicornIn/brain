"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

type User = {
  id: string
  name: string
  email: string
  role: string
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

  // Check for stored auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("crm-user")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as User
          // Add basic validation for stored user
          if (parsedUser?.id && parsedUser?.email) {
            setUser(parsedUser)
          } else {
            localStorage.removeItem("crm-user")
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth", error)
        localStorage.removeItem("crm-user")
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (email: string, password: string, remember: boolean): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock authentication - in a real app, this would be an API call
      if (email === "admin@example.com" && password === "password") {
        const userData: User = {
          id: "1",
          name: "Administrador",
          email: "admin@example.com",
          role: "admin",
        }

        setUser(userData)

        if (remember) {
          localStorage.setItem("crm-user", JSON.stringify(userData))
        }

        return true
      }

      return false
    } catch (error) {
      console.error("Login failed", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("crm-user")
    // In a real app, you might want to redirect here
    // or add additional cleanup logic
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}