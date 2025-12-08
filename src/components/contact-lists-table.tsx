"use client"

import { ContactList } from "@/app/actions/contacts"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { DeleteContactListDialog } from "@/components/delete-contact-list-dialog"

interface ContactListsTableProps {
    contactLists: ContactList[]
}

export function ContactListsTable({ contactLists }: ContactListsTableProps) {
    const router = useRouter()

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {contactLists.map((list) => (
                        <TableRow key={list.id}>
                            <TableCell>
                                {format(new Date(list.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                            </TableCell>
                            <TableCell>{list.nome || 'Sem nome'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Ver lista"
                                        onClick={() => router.push(`/contacts/${list.id}`)}
                                    >
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">Ver</span>
                                    </Button>

                                    <DeleteContactListDialog listId={list.id}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="Apagar lista"
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Apagar</span>
                                        </Button>
                                    </DeleteContactListDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {contactLists.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                                Nenhuma lista encontrada.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
