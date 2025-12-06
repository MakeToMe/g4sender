"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PauseCircle, PlayCircle, Trash2 } from "lucide-react"
import { ConnectInstanceDialog } from "@/components/connect-instance-dialog"
import { DeleteInstanceDialog } from "@/components/delete-instance-dialog"
import { PauseInstanceDialog } from "@/components/pause-instance-dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Instance {
    id: string
    empresa_id: string
    name: string
    status: string | null
    phone_number: string | null
    url_profile: string | null
    qr_code: string | null
    created_at: string
}

interface InstancesTableProps {
    initialInstances: Instance[]
    empresaId?: string
}

export function InstancesTable({ initialInstances, empresaId }: InstancesTableProps) {
    const [instances, setInstances] = useState<Instance[]>(initialInstances)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        setInstances(initialInstances)
    }, [initialInstances])

    useEffect(() => {
        console.log("InstancesTable mounted. Empresa ID:", empresaId)
        if (!empresaId) {
            console.warn("Missing empresaId, skipping Realtime subscription")
            return
        }

        const channel = supabase
            .channel('realtime-instances')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'camp_instances',
                    // filter: `empresa_id=eq.${empresaId}`,
                },
                (payload) => {
                    console.log("Realtime payload received:", payload)

                    if (payload.eventType === 'INSERT') {
                        setInstances((prev) => [payload.new as Instance, ...prev])
                    } else if (payload.eventType === 'UPDATE') {
                        setInstances((prev) =>
                            prev.map((instance) =>
                                instance.id === payload.new.id ? (payload.new as Instance) : instance
                            )
                        )
                    } else if (payload.eventType === 'DELETE') {
                        setInstances((prev) =>
                            prev.filter((instance) => instance.id !== payload.old.id)
                        )
                    }

                    router.refresh()
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router, empresaId])

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Profile</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {instances.map((instance) => {
                        return (
                            <TableRow key={instance.id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarImage src={instance.url_profile || undefined} alt={instance.name} />
                                        <AvatarFallback>{instance.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {instance.name.replace(`_${instance.empresa_id}`, '')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={instance.status === 'WORKING' ? 'default' : 'secondary'}>
                                        {instance.status === 'SCAN_QR_CODE' ? 'SCAN QR CODE' : instance.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{instance.phone_number || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <ConnectInstanceDialog instance={instance}>
                                            {instance.status !== 'WORKING' ? (
                                                <Button variant="ghost" size="icon" title="Connect">
                                                    <PlayCircle className="h-4 w-4 text-green-600" />
                                                    <span className="sr-only">Connect</span>
                                                </Button>
                                            ) : (
                                                <span className="hidden" />
                                            )}
                                        </ConnectInstanceDialog>

                                        {instance.status !== 'WORKING' && (
                                            <DeleteInstanceDialog
                                                instanceId={instance.id}
                                                instanceName={instance.name.replace(`_${instance.empresa_id}`, '')}
                                            >
                                                <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DeleteInstanceDialog>
                                        )}

                                        {instance.status === 'WORKING' && (
                                            <>
                                                <PauseInstanceDialog
                                                    instanceId={instance.id}
                                                    instanceName={instance.name.replace(`_${instance.empresa_id}`, '')}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Pausar"
                                                    >
                                                        <PauseCircle className="h-4 w-4 text-yellow-600" />
                                                    </Button>
                                                </PauseInstanceDialog>

                                                <DeleteInstanceDialog
                                                    instanceId={instance.id}
                                                    instanceName={instance.name.replace(`_${instance.empresa_id}`, '')}
                                                >
                                                    <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </DeleteInstanceDialog>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
