'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { toast } from "sonner"
import { deleteStorageFile } from "@/app/actions/storage"

interface DeleteFileDialogProps {
    fileKey: string
    fileName: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onDeleted: () => void
}

export function DeleteFileDialog({
    fileKey,
    fileName,
    open,
    onOpenChange,
    onDeleted
}: DeleteFileDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        setIsDeleting(true)
        try {
            const result = await deleteStorageFile(fileKey)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Arquivo excluído com sucesso")
                onDeleted()
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Erro ao excluir arquivo")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o arquivo
                        <span className="font-semibold text-foreground"> {fileName} </span>
                        do servidor.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
