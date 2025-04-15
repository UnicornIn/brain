"use client"

import { useEffect, useState } from "react"
import { Bar, Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    type ChartData,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

export function DashboardCharts() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const barChartData: ChartData<"bar"> = {
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
        datasets: [
            {
                label: "Nuevos Clientes",
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: "rgba(59, 130, 246, 0.5)",
            },
        ],
    }

    const lineChartData: ChartData<"line"> = {
        labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
        datasets: [
            {
                label: "WhatsApp",
                data: [12, 19, 3, 5, 2, 3],
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.5)",
            },
            {
                label: "Instagram",
                data: [2, 3, 20, 5, 1, 4],
                borderColor: "rgb(153, 102, 255)",
                backgroundColor: "rgba(153, 102, 255, 0.5)",
            },
            {
                label: "Web",
                data: [3, 10, 13, 15, 22, 30],
                borderColor: "rgb(255, 159, 64)",
                backgroundColor: "rgba(255, 159, 64, 0.5)",
            },
        ],
    }

    if (!mounted) {
        return <div className="h-[350px] flex items-center justify-center">Cargando gráficos...</div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-medium mb-2">Captación de Clientes</h3>
                <div className="h-[200px]">
                    <Bar
                        data={barChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: "top" as const,
                                },
                            },
                        }}
                    />
                </div>
            </div>
            <div>
                <h3 className="text-lg font-medium mb-2">Interacciones por Canal</h3>
                <div className="h-[200px]">
                    <Line
                        data={lineChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: "top" as const,
                                },
                            },
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
