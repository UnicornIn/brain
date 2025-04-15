import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { DashboardHeader } from "../../components/dashboard/dashboard-header"
import { DashboardCharts } from "../../components/dashboard/dashboard-charts"
import { RecentClients } from "../../components/dashboard/recent-clients"
import { RecentInteractions } from "../../components/dashboard/recent-interactions"
import { AlertsPanel } from "../../components/dashboard/alerts-panel"
import { StatsCards } from "../../components/dashboard/stats-cards"

export default function Dashboard() {
    return (
        <div className="flex flex-col">
            <DashboardHeader />
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <div className="flex items-center space-x-2">
                        <Tabs defaultValue="day">
                            <TabsList>
                                <TabsTrigger value="day">Hoy</TabsTrigger>
                                <TabsTrigger value="week">Esta Semana</TabsTrigger>
                                <TabsTrigger value="month">Este Mes</TabsTrigger>
                                <TabsTrigger value="year">Este Año</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                <StatsCards />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Métricas de Rendimiento</CardTitle>
                            <CardDescription>Captación de clientes e interacciones por canal</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <DashboardCharts />
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Alertas Pendientes</CardTitle>
                            <CardDescription>Alertas generadas por el agente omnicanal</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertsPanel />
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Clientes Recientes</CardTitle>
                            <CardDescription>Últimos clientes agregados al sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RecentClients />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Interacciones Recientes</CardTitle>
                            <CardDescription>Últimas conversaciones con clientes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RecentInteractions />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
