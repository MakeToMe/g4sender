"use client"

import { Contact } from "@/app/actions/contacts"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { SubscriptionBadge } from "@/components/subscription-badge"

interface ContactsTableProps {
    initialContacts: Contact[]
}

export function ContactsTable({ initialContacts }: ContactsTableProps) {
    // We can keep it simple for now, just render the data passed
    // If we want client-side search/sort later we can add it.

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Subscribed</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Campanhas</TableHead>
                        <TableHead className="text-right">Data</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialContacts.map((contact) => (
                        <TableRow key={contact.id}>
                            <TableCell className="font-medium">{contact.name || '-'}</TableCell>
                            <TableCell>{contact.phone}</TableCell>
                            <TableCell>
                                <SubscriptionBadge
                                    contactId={contact.id}
                                    initialStatus={!!contact.send_campaigns}
                                />
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                    {contact.tags?.map((tag, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                            {tag}
                                        </Badge>
                                    )) || '-'}
                                </div>
                            </TableCell>
                            <TableCell>
                                {contact.campaigns_id && contact.campaigns_id.length > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        {contact.campaigns_id.map((camp, idx) => (
                                            <span key={idx} className="text-sm">
                                                {camp.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {contact.created_at
                                    ? format(new Date(contact.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                    : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                    {initialContacts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Nenhum contato encontrado nesta lista.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
