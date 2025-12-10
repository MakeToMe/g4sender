"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ChartData } from "@/app/actions/dashboard"

interface OverviewProps {
    data: ChartData[]
}

export function Overview({ data }: OverviewProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                Nenhum dado disponível para o período.
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    cursor={{ fill: 'transparent' }}
                />
                <Legend iconType="circle" />
                <Bar
                    dataKey="sent"
                    name="Enviadas"
                    fill="#3b82f6" // blue-500
                    radius={[4, 4, 0, 0]}
                    stackId="a"
                />
                <Bar
                    dataKey="delivered"
                    name="Entregues"
                    fill="#22c55e" // green-500
                    radius={[4, 4, 0, 0]}
                    stackId="b"
                // Note: If we want stacked visualization of flow (Sent -> Delivered -> Read), standard stacking adds up.
                // But here these are states. A read message is also delivered and sent. 
                // So a grouped bar chart might be better to compare counts, OR we explicitly calculate delta if stacking.
                // Let's stick to Clustered (Grouped) bars for clarity on values.
                // Removing stackId will make them grouped.
                />
                <Bar
                    dataKey="read"
                    name="Lidas"
                    fill="#a855f7" // purple-500
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
