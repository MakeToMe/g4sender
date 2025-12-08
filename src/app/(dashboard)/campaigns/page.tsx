import { getCampaigns } from "@/app/actions/campaigns"
import { EmptyState } from "@/components/empty-state"
import { MessageSquarePlus, Megaphone, ImageIcon, Video, FileText, Music, Eye } from "lucide-react"
import { CampaignDialog } from "@/components/campaign-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DeleteCampaignDialog } from "@/components/delete-campaign-dialog"
import { Trash2 } from "lucide-react"

export default async function CampaignsPage() {
    const campaigns = await getCampaigns()

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Campanhas</h2>
                    <p className="text-muted-foreground">
                        Crie e gerencie suas campanhas de disparo.
                    </p>
                </div>
                {campaigns.length > 0 && (
                    <CampaignDialog />
                )}
            </div>

            {campaigns.length === 0 ? (
                <EmptyState
                    icon={Megaphone}
                    title="Nenhuma campanha criada"
                    description="Crie sua primeira campanha para começar a disparar mensagens."
                >
                    <CampaignDialog>
                        <Button className="mt-4">
                            <MessageSquarePlus className="mr-2 h-4 w-4" />
                            Criar Campanha
                        </Button>
                    </CampaignDialog>
                </EmptyState>
            ) : (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[180px]">Data</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Mensagem</TableHead>
                                <TableHead className="w-[100px] text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {campaigns.map((campaign) => (
                                <TableRow key={campaign.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>
                                                {format(new Date(campaign.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(campaign.created_at), "HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {campaign.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2 max-w-[500px]">
                                            {campaign.message_type !== 'text' && (
                                                <div className="relative w-fit">
                                                    {campaign.message_type === 'image' && campaign.message_url ? (
                                                        <div className="rounded-md overflow-hidden border h-20 w-20 bg-muted">
                                                            <img
                                                                src={campaign.message_url}
                                                                alt="Media"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    ) : campaign.message_type === 'video' && campaign.message_url ? (
                                                        <div className="rounded-md overflow-hidden border h-20 w-32 bg-black">
                                                            <video
                                                                src={campaign.message_url}
                                                                className="h-full w-full object-cover"
                                                                controls
                                                            />
                                                        </div>
                                                    ) : campaign.message_type === 'audio' && campaign.message_url ? (
                                                        <div className="flex items-center justify-center h-12 w-48 bg-muted rounded-md border p-1">
                                                            <audio
                                                                src={campaign.message_url}
                                                                controls
                                                                className="h-8 w-full"
                                                            />
                                                        </div>
                                                    ) : campaign.message_type === 'document' && campaign.message_url ? (
                                                        <div className="rounded-md overflow-hidden border h-20 w-20 bg-white">
                                                            <iframe
                                                                src={`${campaign.message_url}#toolbar=0&navpanes=0&scrollbar=0`}
                                                                className="h-full w-full pointer-events-none"
                                                                title="PDF Preview"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-20 w-20 bg-muted rounded-md border text-muted-foreground">
                                                            {campaign.message_type === 'video' && <Video className="h-8 w-8" />}
                                                            {campaign.message_type === 'audio' && <Music className="h-8 w-8" />}
                                                            {campaign.message_type === 'document' && <FileText className="h-8 w-8" />}
                                                            {(campaign.message_type === 'image' || !campaign.message_type) && <ImageIcon className="h-8 w-8" />}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <span className="line-clamp-3 text-sm whitespace-pre-wrap">
                                                {campaign.message_template}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <CampaignDialog campaign={campaign}>
                                                <Button variant="ghost" size="icon" title="Visualizar/Editar">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </CampaignDialog>

                                            <DeleteCampaignDialog campaignId={campaign.id}>
                                                <Button variant="ghost" size="icon" title="Excluir" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </DeleteCampaignDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table >
                </div >
            )
            }
        </div >
    )
}
