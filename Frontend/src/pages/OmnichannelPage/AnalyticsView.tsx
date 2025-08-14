"use client"

import { useState } from "react"
import { BarChart3, MessageCircle, TrendingUp, Clock, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { useOmnichannelAnalytics } from "../../hooks/useOmnichannelAnalytics"
import { ChannelIcon } from "./ChannelIcons"

export default function AnalyticsView() {
  const [selectedPeriod, setSelectedPeriod] = useState("7d")
  const { dashboardStats, channelStats } = useOmnichannelAnalytics(selectedPeriod)

  return (
    <div className="flex h-full">
      {/* Sidebar izquierda con métricas */}
      <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto space-y-6">
        {/* Selector de período */}
        <Card>
          <CardContent className="p-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Métricas principales - Reincorporadas */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-600">Total</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.totalInteractions}</p>
              <p className="text-sm text-gray-500">Interacciones</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600">Hoy</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.todayInteractions}</p>
              <p className="text-sm text-gray-500">Nuevas interacciones</p>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-600">Respuesta</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{dashboardStats.avgResponseTime}</p>
              <p className="text-sm text-gray-500">Tiempo promedio</p>
            </CardContent>
          </Card>
        </div>

        {/* Rendimiento por Canal */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Rendimiento por Canal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {channelStats.map((stat) => (
              <div key={stat.channel} className="space-y-2">
                <div className="flex items-center gap-3">
                  <ChannelIcon channel={stat.channel} size="sm" />
                  <span className="font-medium capitalize text-gray-900">{stat.channel}</span>
                  <div className="ml-auto flex gap-4 text-sm">
                    <span className="text-gray-600">Total: {stat.total}</span>
                    <span className="text-orange-600">Activas: {stat.active}</span>
                  </div>
                </div>
                <div className="pl-8">
                  <span className="text-sm text-green-600">Gestionadas: {stat.managed}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Métricas de Hoy */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-700" />
              Métricas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Mensajes respondidos</span>
              <span className="text-lg font-semibold text-blue-600">89</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Tiempo respuesta promedio</span>
              <span className="text-lg font-semibold text-green-600">1.2 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Mensajes pendientes</span>
              <span className="text-lg font-semibold text-orange-600">23</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Área principal derecha */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Analytics de Canales</h2>
          <p className="text-gray-600">Revisa las métricas y rendimiento de todos tus canales de comunicación.</p>
        </div>
      </div>
    </div>
  )
}
