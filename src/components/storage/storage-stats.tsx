"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StorageFile } from "@/app/actions/storage"
import { ImageIcon, Video, FileText, Database, Music } from "lucide-react"
import { Label, Pie, PieChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface StorageStatsProps {
    files: StorageFile[]
}

const MAX_STORAGE_BYTES = 200 * 1024 * 1024 // 200MB

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function StorageStats({ files }: StorageStatsProps) {
    const stats = useMemo(() => {
        let totalBytes = 0
        let imageCount = 0
        let videoCount = 0
        let docCount = 0
        let audioCount = 0
        let otherCount = 0

        files.forEach(file => {
            totalBytes += file.size

            if (file.type === 'image') imageCount++
            else if (file.type === 'video') videoCount++
            else if (file.type === 'audio') audioCount++
            else if (file.type === 'document') docCount++
            else otherCount++
        })

        const percentUsed = Math.min(100, (totalBytes / MAX_STORAGE_BYTES) * 100)

        // Define color based on usage percentage
        let usageColor = "hsl(var(--chart-2))" // Green-ish by default
        if (percentUsed > 75) usageColor = "hsl(var(--chart-4))" // Yellow/Orange
        if (percentUsed > 90) usageColor = "hsl(var(--destructive))" // Red

        const chartData = [
            { browser: "safari", visitors: totalBytes, fill: usageColor },
            { browser: "other", visitors: MAX_STORAGE_BYTES - totalBytes, fill: "hsl(var(--muted))" },
        ]

        return {
            totalBytes,
            imageCount,
            videoCount,
            docCount,
            audioCount,
            totalCount: files.length,
            percentUsed,
            chartData,
            usageColor
        }
    }, [files])

    const chartConfig = {
        visitors: {
            label: "Uso",
        },
    }

    return (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <div className="grid gap-4 grid-cols-2 lg:col-span-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Imagens
                        </CardTitle>
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.imageCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Vídeos
                        </CardTitle>
                        <Video className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.videoCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Áudios
                        </CardTitle>
                        <Music className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.audioCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Documentos
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.docCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="flex flex-col lg:col-span-1">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Uso de Armazenamento</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <div className="mx-auto aspect-square max-h-[160px]">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[160px]"
                        >
                            <PieChart>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie
                                    data={stats.chartData}
                                    dataKey="visitors"
                                    nameKey="browser"
                                    innerRadius={45}
                                    strokeWidth={5}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-xl font-bold"
                                                        >
                                                            {stats.percentUsed.toFixed(1)}%
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 16}
                                                            className="fill-muted-foreground text-[10px]"
                                                        >
                                                            Utilizado
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </div>
                </CardContent>
                <div className="flex flex-col gap-1 text-sm text-center pb-4">
                    <div className="font-medium">
                        Total de Arquivos: {stats.totalCount}
                    </div>
                    <div className="leading-none text-muted-foreground text-xs">
                        {formatBytes(stats.totalBytes)} de {formatBytes(MAX_STORAGE_BYTES)}
                    </div>
                </div>
            </Card>
        </div>
    )
}
