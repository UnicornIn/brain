"use client"

import { useMemo } from "react"

interface DashboardStats {
  totalInteractions: number
  todayInteractions: number
  avgResponseTime: string
  engagementRate: string
}

interface ChannelStats {
  channel: string
  total: number
  active: number
  managed: number
  engagement: string
}

interface DailyMetric {
  label: string
  value: string
  color: string
}

export function useOmnichannelAnalytics(period: string) {
  const dashboardStats: DashboardStats = useMemo(
    () => ({
      totalInteractions: 1247,
      todayInteractions: 89,
      avgResponseTime: "1.8 min",
      engagementRate: "8.2%",
    }),
    [period],
  )

  const channelStats: ChannelStats[] = useMemo(
    () => [
      { channel: "whatsapp", total: 456, active: 23, managed: 433, engagement: "12.5%" },
      { channel: "instagram", total: 389, active: 31, managed: 358, engagement: "9.8%" },
      { channel: "facebook", total: 234, active: 18, managed: 216, engagement: "6.4%" },
      { channel: "tiktok", total: 168, active: 17, managed: 151, engagement: "15.2%" },
    ],
    [period],
  )

  const dailyMetrics: DailyMetric[] = useMemo(
    () => [
      { label: "Mensajes respondidos", value: "89", color: "text-blue-600" },
      { label: "Tiempo respuesta promedio", value: "1.2 min", color: "text-green-600" },
      { label: "Mensajes pendientes", value: "23", color: "text-orange-600" },
    ],
    [period],
  )

  return {
    dashboardStats,
    channelStats,
    dailyMetrics,
  }
}
