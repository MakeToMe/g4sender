'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createClientRaw } from '@supabase/supabase-js'
import { startOfDay, subDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type DashboardStats = {
    totalSent: number
    delivered: number
    read: number
    deliveryRate: number
    readRate: number
}

export type ChartData = {
    name: string
    sent: number
    delivered: number
    read: number
}

// Private helper to get Admin Client
function getAdminClient() {
    return createClientRaw(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}

async function getEmpresaId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

    return profile?.empresa_id
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const empresaId = await getEmpresaId()

    if (!empresaId) {
        return { totalSent: 0, delivered: 0, read: 0, deliveryRate: 0, readRate: 0 }
    }

    const supabaseAdmin = getAdminClient()

    const { count: totalSent, error: sentError } = await supabaseAdmin
        .from('camp_relatorio_disparo')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .not('msg_sender', 'is', null)

    const { count: delivered, error: deliveredError } = await supabaseAdmin
        .from('camp_relatorio_disparo')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .not('msg_delivered', 'is', null)

    const { count: read, error: readError } = await supabaseAdmin
        .from('camp_relatorio_disparo')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .not('msg_read', 'is', null)

    if (sentError || deliveredError || readError) {
        console.error('Error fetching stats', { sentError, deliveredError, readError })
        return { totalSent: 0, delivered: 0, read: 0, deliveryRate: 0, readRate: 0 }
    }

    const sentCount = totalSent || 0
    const deliveredCount = delivered || 0
    const readCount = read || 0

    return {
        totalSent: sentCount,
        delivered: deliveredCount,
        read: readCount,
        deliveryRate: sentCount > 0 ? (deliveredCount / sentCount) * 100 : 0,
        readRate: deliveredCount > 0 ? (readCount / deliveredCount) * 100 : 0
    }
}

export async function getDashboardChartData(days = 7): Promise<ChartData[]> {
    const empresaId = await getEmpresaId()

    if (!empresaId) return []

    const supabaseAdmin = getAdminClient()
    const startDate = subDays(startOfDay(new Date()), days - 1)

    const { data, error } = await supabaseAdmin
        .from('camp_relatorio_disparo')
        .select('created_at, msg_sender, msg_delivered, msg_read')
        .eq('empresa_id', empresaId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching chart data', error)
        return []
    }

    // Group by day
    const groupedData = new Map<string, { sent: number, delivered: number, read: number }>()

    // Initialize all days
    for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), days - 1 - i)
        const key = format(date, 'dd/MM') // Display format
        groupedData.set(key, { sent: 0, delivered: 0, read: 0 })
    }

    data.forEach((row: any) => {
        const date = new Date(row.created_at)
        const key = format(date, 'dd/MM')

        if (groupedData.has(key)) {
            const entry = groupedData.get(key)!
            if (row.msg_sender) entry.sent++
            if (row.msg_delivered) entry.delivered++
            if (row.msg_read) entry.read++
        }
    })

    return Array.from(groupedData.entries()).map(([name, stats]) => ({
        name,
        ...stats
    }))
}

export type RecentActivityItem = {
    id: string
    contact_name: string
    contact_phone: string
    msg_type: string
    status: 'sent' | 'delivered' | 'read'
    timestamp: string
}

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
    const empresaId = await getEmpresaId()

    if (!empresaId) return []

    const supabaseAdmin = getAdminClient()

    const { data, error } = await supabaseAdmin
        .from('camp_relatorio_disparo')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching recent activity', error)
        return []
    }

    return data.map((row: any) => {
        let status: 'sent' | 'delivered' | 'read' = 'sent'
        let timestamp = row.msg_sender

        if (row.msg_read) {
            status = 'read'
            timestamp = row.msg_read
        } else if (row.msg_delivered) {
            status = 'delivered'
            timestamp = row.msg_delivered
        }

        return {
            id: row.id,
            contact_name: row.contact_name || row.contact_phone || 'Desconhecido',
            contact_phone: row.contact_phone,
            msg_type: row.msg_type,
            status,
            timestamp: timestamp || row.created_at
        }
    })
}
