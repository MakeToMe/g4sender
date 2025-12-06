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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { UploadContactsDialog } from "@/components/upload-contacts-dialog"

interface Contact {
    id: string
    empresa_id: string
    name: string | null
    phone: string
    tags: string[] | null
    created_at: string | null
}

interface ContactsTableProps {
    initialContacts: Contact[]
}

export function ContactsTable({ initialContacts }: ContactsTableProps) {
    const router = useRouter()
    const [contacts, setContacts] = useState<Contact[]>(initialContacts)

    useEffect(() => {
        setContacts(initialContacts)
    }, [initialContacts])

    // Polling effect
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh()
        }, 5000) // Poll every 5 seconds

        return () => clearInterval(interval)
    }, [router])

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <UploadContactsDialog>
                    <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Import Contacts
                    </Button>
                </UploadContactsDialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead className="text-right">Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.map((contact) => (
                            <TableRow key={contact.id}>
                                <TableCell className="font-medium">{contact.name || '-'}</TableCell>
                                <TableCell>{contact.phone}</TableCell>
                                <TableCell>
                                    <div className="flex gap-1 flex-wrap">
                                        {contact.tags?.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        )) || '-'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {contact.created_at
                                        ? new Date(contact.created_at).toLocaleDateString()
                                        : '-'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
