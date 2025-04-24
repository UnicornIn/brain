import {
    BarChart3,
    Users,
    MessageSquare,
    Bell,
    Database,
    BookOpen,
    MessageCircle,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "./ui/sidebar"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"

const menuItems = [
    {
        title: "Dashboard",
        icon: BarChart3,
        href: "/",
    },
    {
        title: "Clientes",
        icon: Users,
        href: "/clientes",
    },
    {
        title: "Interacciones",
        icon: MessageSquare,
        href: "/interacciones",
    },
    {
        title: "Alertas",
        icon: Bell,
        href: "/alertas",
    },
    {
        title: "Base de Datos",
        icon: Database,
        href: "/base-datos",
    },
    {
        title: "Base de Conocimiento",
        icon: BookOpen,
        href: "/conocimiento",
    },
    {
        title: "Agente Omnicanal",
        icon: MessageCircle,
        href: "/agente",
    },
    {
        title: "Administración",
        icon: Settings,
        href: "/admin",
    },
]

export function AppSidebar() {
    const location = useLocation()
    const pathname = location.pathname
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768)

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth > 768)
            if (window.innerWidth > 768) {
                setIsMobileOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <>
            {/* Mobile hamburger button */}
            {!isDesktop && (
                <div className="fixed top-4 left-4 z-40 md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        className="rounded-lg"
                    >
                        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </Button>
                </div>
            )}

            {/* Sidebar Container */}
            <div className={cn(
                "fixed md:relative z-30",
                isDesktop ? "w-60 flex-shrink-0" : "fixed h-screen"
            )}>
                <Sidebar className={cn(
                    "bg-white text-sm text-[#2E3A59] w-60 shadow-sm h-screen transition-all duration-300",
                    isDesktop ? "translate-x-0" : (isMobileOpen ? "translate-x-0" : "-translate-x-full")
                )}>
                    {/* Header */}
                    <SidebarHeader className="flex items-center justify-between px-4 py-4 border-b">
                        <div className="flex items-center gap-2">
                            <div className="rounded-md bg-primary p-1">
                                <MessageCircle className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-base font-semibold text-black">CRM Omnicanal</span>
                        </div>
                        {!isDesktop && (
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="p-1 rounded-md hover:bg-gray-100"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </SidebarHeader>

                    {/* Menú principal */}
                    <SidebarContent className="px-2 pt-4">
                        <SidebarMenu className="space-y-2">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <SidebarMenuItem key={item.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            className={`flex items-center gap-4 px-4 py-3 rounded-md transition-colors w-full text-lg ${isActive
                                                ? "bg-muted text-black font-medium"
                                                : "hover:bg-muted hover:text-black"
                                                }`}
                                            onClick={() => !isDesktop && setIsMobileOpen(false)}
                                        >
                                            <Link to={item.href} className="flex items-center gap-4 w-full">
                                                <item.icon className="h-6 w-6" /> {/* Iconos más grandes */}
                                                <span className="text-lg">{item.title}</span> {/* Texto más grande */}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarContent>

                    {/* Footer */}
                    <SidebarFooter className="px-4 py-4 border-t mt-auto">
                        <SidebarMenu className="space-y-2">
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex items-center gap-4 px-2 py-2 rounded-md hover:bg-muted w-full">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src="/placeholder.svg?height=32&width=32" />
                                        <AvatarFallback>AD</AvatarFallback>
                                    </Avatar>
                                    <span>Admin Usuario</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="flex items-center gap-4 px-2 py-2 rounded-md hover:bg-muted w-full">
                                    <LogOut className="h-5 w-5" />
                                    <span>Cerrar Sesión</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>
            </div>

            {/* Overlay for mobile */}
            {!isDesktop && isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    )
}