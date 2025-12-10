'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Rocket, ArrowRight, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Campaign, triggerCampaign } from "@/app/actions/campaigns"
import { ContactList, getContactListCount } from "@/app/actions/contacts"
// Removed unused getInstances import since we pass it as prop now

interface TriggerCampaignDialogProps {
    campaigns: Campaign[]
    lists: ContactList[]
    instances: any[] // Using any for now, ideally Instance type
}

export function TriggerCampaignDialog({ campaigns, lists, instances }: TriggerCampaignDialogProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)

    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")
    const [selectedInstanceId, setSelectedInstanceId] = useState<string>("")
    const [rotateInstances, setRotateInstances] = useState(false)
    const [selectedListId, setSelectedListId] = useState<string>("")
    const [contactCount, setContactCount] = useState<number | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isSending, setIsSending] = useState(false)

    // Filter only WORKING instances
    const activeInstances = instances.filter(i => i.status === 'WORKING')

    // Reset state when opening
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            // Reset after closing
            setTimeout(() => {
                setStep(1)
                setSelectedCampaignId("")
                setSelectedInstanceId("")
                setRotateInstances(false)
                setSelectedListId("")
                setContactCount(null)
            }, 300)
        }
    }

    const handleNext = async () => {
        if (step === 1 && selectedCampaignId) {
            setStep(2)
        } else if (step === 2 && selectedListId) {
            setIsLoadingPreview(true)
            try {
                // Fetch preview data immediately after selecting list
                const count = await getContactListCount(selectedListId)
                setContactCount(count)
                setStep(3)
            } catch (error) {
                toast.error("Erro ao carregar dados da lista.")
            } finally {
                setIsLoadingPreview(false)
            }
        } else if (step === 3) {
            if (rotateInstances && activeInstances.length > 1) {
                setStep(4)
            } else if (selectedInstanceId) {
                setStep(4)
            }
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleSend = async () => {
        setIsSending(true)
        try {
            const instanceIds = rotateInstances
                ? activeInstances.map(i => i.id)
                : [selectedInstanceId]

            const result = await triggerCampaign(selectedCampaignId, instanceIds, selectedListId, rotateInstances)

            if (result.error) {
                toast.error(result.error)
                return
            }

            toast.success("Campanha enviada para processamento!")
            handleOpenChange(false)
        } catch (error) {
            toast.error("Erro ao disparar campanha.")
        } finally {
            setIsSending(false)
        }
    }

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)
    const selectedList = lists.find(l => l.id === selectedListId)
    const selectedInstance = instances.find(i => i.id === selectedInstanceId)

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Rocket className="h-4 w-4" />
                    Disparar Campanha
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Disparar Campanha</DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Selecione o modelo de mensagem (Template)."}
                        {step === 2 && "Selecione a lista de contatos alvo."}
                        {step === 3 && "Selecione a instância de envio."}
                        {step === 4 && "Confira os dados antes de enviar."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Template (Campanha)</Label>
                                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um template..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {campaigns.map(camp => (
                                            <SelectItem key={camp.id} value={camp.id}>
                                                {camp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Lista de Contatos</Label>
                                <Select value={selectedListId} onValueChange={setSelectedListId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione uma lista..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {lists.map(list => (
                                            <SelectItem key={list.id} value={list.id}>
                                                {list.nome || "Sem nome"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Instância (Whatsapp)</Label>

                                {!rotateInstances && (
                                    <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a instância..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeInstances.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground text-center">Nenhuma instância ativa</div>
                                            ) : activeInstances.map(inst => (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.name.split('_')[0]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {activeInstances.length > 1 && (
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id="rotate-instances"
                                            checked={rotateInstances}
                                            onCheckedChange={(checked: boolean) => {
                                                setRotateInstances(checked)
                                                if (checked) setSelectedInstanceId("")
                                            }}
                                        />
                                        <label
                                            htmlFor="rotate-instances"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Alternar instâncias (Rodízio)
                                        </label>
                                    </div>
                                )}

                                {rotateInstances && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        As {activeInstances.length} instâncias ativas serão utilizadas para o envio em modo de rodízio.
                                    </p>
                                )}

                                {activeInstances.length === 0 && (
                                    <p className="text-xs text-red-500">Você precisa de uma instância com status WORKING para enviar.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4 bg-muted/50 p-4 rounded-lg border">
                            <div className="grid grid-cols-3 text-sm gap-2">
                                <span className="font-medium text-muted-foreground">Instância:</span>
                                {rotateInstances ? (
                                    <div className="col-span-2">
                                        <span className="font-semibold block mb-1">Alternando entre:</span>
                                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                                            {activeInstances.map(inst => (
                                                <li key={inst.id}>{inst.name.split('_')[0]}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <span className="col-span-2 font-semibold">{selectedInstance?.name.split('_')[0]}</span>
                                )}

                                <span className="font-medium text-muted-foreground">Template:</span>
                                <span className="col-span-2">{selectedCampaign?.name}</span>

                                <span className="font-medium text-muted-foreground">Lista:</span>
                                <span className="col-span-2">{selectedList?.nome}</span>

                                <span className="font-medium text-muted-foreground">Quantidade:</span>
                                <span className="col-span-2 border rounded px-2 py-0.5 bg-background w-fit">
                                    {contactCount} contatos
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {step === 1 ? (
                        <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
                    ) : (
                        <Button variant="outline" onClick={handleBack} disabled={isSending}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                    )}

                    {step < 4 ? (
                        <Button
                            onClick={handleNext}
                            disabled={
                                (step === 1 && !selectedCampaignId) ||
                                (step === 2 && !selectedListId) ||
                                (step === 3 && ((!selectedInstanceId && !rotateInstances) || activeInstances.length === 0)) ||
                                isLoadingPreview
                            }
                        >
                            {isLoadingPreview ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Próximo
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSend}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            disabled={isSending}
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    ENVIAR
                                    <Rocket className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
