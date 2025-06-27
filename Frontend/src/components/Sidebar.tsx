"use client"

import { useState, useCallback } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { BarChart3 } from "lucide-react"

// Icons component
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  Database: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
      />
    </svg>
  ),
  Business: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  Omnichannel: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  Intelligence: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

const Sidebar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const modules = [
    { name: "Dashboard", path: "/dashboard", icon: Icons.Dashboard },
    { name: "Base de Datos", path: "/database", icon: Icons.Database },
    // { name: "Datos de Negocio", path: "/business", icon: Icons.Business },
    { name: "Omnicanal", path: "/omnichannel", icon: Icons.Omnichannel },
    { name: "Comunidades", path: "/communities", icon: BarChart3 },
    { name: "Inteligencia de Negocios", path: "/intelligence", icon: Icons.Intelligence },
  ]

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev)
  }, [])

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  type Module = {
    name: string
    path: string
    icon: React.FC
  }

  const NavItem = ({ module }: { module: Module }) => (
    <Link
      to={module.path}
      onClick={closeMobileMenu}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${location.pathname === module.path
        ? "bg-blue-100 text-blue-700"
        : "text-gray-700 hover:bg-gray-100"
        }`}
      aria-current={location.pathname === module.path ? "page" : undefined}
    >
      <module.icon />
      <span className="ml-3">{module.name}</span>
    </Link>
  )

  const UserProfile = () => (
    <div className="border-t p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700">{user?.name || "Usuario"}</p>
          <p className="text-xs text-gray-500">{user?.email || ""}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          aria-label="Cerrar sesión"
        >
          <Icons.Logout />
          <span className="ml-3">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 z-20 p-4">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle menu"
        >
          <span className="sr-only">Open menu</span>
          <Icons.Menu />
        </button>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`md:hidden fixed inset-0 z-10 bg-gray-800 bg-opacity-75 transition-opacity ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl transition transform ease-in-out duration-300">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between h-16 px-4 border-b " >
              <div className="flex items-center ml-[50px]">
                <Icons.Dashboard />
                <span className="ml-2 font-semibold text-lg">Brain CRM</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-label="Close menu"
              >
                <span className="sr-only">Close menu</span>
                <Icons.Close />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <nav className="px-2 py-4 space-y-1">
                {modules.map((module) => (
                  <NavItem key={module.path} module={module} />
                ))}
              </nav>
            </div>
            <UserProfile />
          </div>
        </div>
      </div >

      {/* Desktop sidebar */}
      < div className="hidden md:flex md:flex-shrink-0" >
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex items-center h-16 flex-shrink-0 px-4 border-b">
              <Icons.Dashboard />
              <span className="ml-2 font-semibold text-lg">Brain CRM</span>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {modules.map((module) => (
                  <NavItem key={module.path} module={module} />
                ))}
              </nav>
            </div>
            <UserProfile />
          </div>
        </div>
      </div >
    </>
  )
}

export default Sidebar