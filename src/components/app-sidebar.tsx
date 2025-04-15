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
    SidebarTrigger,
} from "./ui/sidebar"

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

    return (
        <Sidebar className="bg-white text-sm text-[#2E3A59] w-60 shadow-sm">
            {/* Header */}
            <SidebarHeader className="flex items-center justify-between px-4 py-4 border-b">
                <div className="flex items-center gap-2">
                    <div className="rounded-md bg-primary p-1">
                        <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-base font-semibold text-black">CRM Omnicanal</span>
                </div>
                <SidebarTrigger />
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
                                    className={`flex items-center gap-4 px-4 py-2 rounded-md transition-colors w-full text-base ${isActive
                                            ? "bg-muted text-black font-medium"
                                            : "hover:bg-muted hover:text-black"
                                        }`}
                                >
                                    <Link to={item.href} className="flex items-center gap-4 w-full">
                                        <item.icon className="h-5 w-5" />
                                        <span>{item.title}</span>
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
    )
}