import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Smartphone, Users, Megaphone, CheckCheck, Eye } from "lucide-react"
import { Overview } from "@/components/overview"
import { RecentActivity } from "@/components/recent-activity"
import { getDashboardStats, getDashboardChartData, getRecentActivity } from "@/app/actions/dashboard"

export default async function DashboardPage() {
    // Parallel data fetching
    const [stats, chartData, recentActivity] = await Promise.all([
        getDashboardStats(),
        getDashboardChartData(),
        getRecentActivity()
    ])

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Relatório de Disparos</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Enviado
                        </CardTitle>
                        <Megaphone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSent}</div>
                        <p className="text-xs text-muted-foreground">
                            Mensagens enviadas (global)
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Entregues
                        </CardTitle>
                        <CheckCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.delivered}</div>
                        <p className="text-xs text-muted-foreground">
                            Taxa de entrega: {stats.deliveryRate.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Lidas
                        </CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.read}</div>
                        <p className="text-xs text-muted-foreground">
                            Taxa de leitura: {stats.readRate.toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
                {/* Keeping one placeholder or using it for something else */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Eficiência
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.delivered > 0 ? ((stats.read / stats.delivered) * 100).toFixed(0) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Conversão (Lidas / Entregues)
                        </p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Visão Geral</CardTitle>
                        <CardDescription>
                            Performance de envio nos últimos 7 dias.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <Overview data={chartData} />
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Atividade Recente</CardTitle>
                        <CardDescription>
                            Últimas 5 mensagens processadas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentActivity data={recentActivity} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
