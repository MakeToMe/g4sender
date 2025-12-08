import { getContactsByListId } from "@/app/actions/contacts"
import { ContactsTable } from "@/components/contacts-table"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ListDetailsPage({ params }: PageProps) {
    const { id } = await params
    const contacts = await getContactsByListId(id)

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center space-x-4">
                <Link href="/contacts">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Detalhes da Lista</h2>
                    <p className="text-muted-foreground">
                        Visualizando contatos da lista.
                    </p>
                </div>
            </div>

            <ContactsTable initialContacts={contacts} />
        </div>
    )
}
