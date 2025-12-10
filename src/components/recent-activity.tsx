"use client"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { RecentActivityItem } from "@/app/actions/dashboard"
import { CheckCheck, Check, Clock, Eye } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface RecentActivityProps {
    data: RecentActivityItem[]
}

export function RecentActivity({ data }: RecentActivityProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                Nenhuma atividade recente.
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {data.map((item) => (
                <div key={item.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>
                            {item.contact_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{item.contact_name}</p>
                        <p className="text-xs text-muted-foreground">
                            {item.contact_phone}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                            {format(new Date(item.timestamp), "HH:mm", { locale: ptBR })}
                        </span>
                        {item.status === 'read' && <Eye className="h-4 w-4 text-purple-500" title="Lida" />}
                        {item.status === 'delivered' && <CheckCheck className="h-4 w-4 text-green-500" title="Entregue" />}
                        {item.status === 'sent' && <Check className="h-4 w-4 text-blue-500" title="Enviada" />}
                    </div>
                </div>
            ))}
        </div>
    )
}
