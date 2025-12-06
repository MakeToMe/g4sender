import { getInstances } from "@/app/actions/instances"
import { EmptyState } from "@/components/empty-state"
import { CreateInstanceDialog } from "@/components/create-instance-dialog"
import { Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstancesTable } from "@/components/instances-table"
import { createClient } from "@/lib/supabase/server"

export default async function InstancesPage() {
    const instances = await getInstances()
    const supabase = await createClient()

    // Get current user's empresa_id
    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Instances</h2>
                {instances.length > 0 && (
                    <CreateInstanceDialog>
                        <Button>New Instance</Button>
                    </CreateInstanceDialog>
                )}
            </div>

            {instances.length === 0 ? (
                <EmptyState
                    icon={Smartphone}
                    title="No instances connected"
                    description="Connect your WhatsApp to start sending campaigns and managing conversations."
                >
                    <CreateInstanceDialog>
                        <Button>Connect WhatsApp</Button>
                    </CreateInstanceDialog>
                </EmptyState>
            ) : (
                <InstancesTable initialInstances={instances} empresaId={profile?.empresa_id} />
            )}
        </div>
    )
}
