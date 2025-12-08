import { getContactLists } from "@/app/actions/contacts"
import { ContactListsTable } from "@/components/contact-lists-table"
import { EmptyState } from "@/components/empty-state"
import { Users, Upload } from "lucide-react"
import { UploadContactsDialog } from "@/components/upload-contacts-dialog"
import { Button } from "@/components/ui/button"

export default async function ContactsPage() {
    const contactLists = await getContactLists()

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Listas de Contatos</h2>
                    <p className="text-muted-foreground">
                        Gerencie suas listas de contatos importadas.
                    </p>
                </div>
                {contactLists.length > 0 && (
                    <UploadContactsDialog>
                        <Button>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar Contatos
                        </Button>
                    </UploadContactsDialog>
                )}
            </div>

            {contactLists.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Nenhuma lista de contatos"
                    description="Você ainda não importou nenhuma lista. Envie um arquivo para começar."
                >
                    <UploadContactsDialog>
                        <Button className="mt-4">
                            <Upload className="mr-2 h-4 w-4" />
                            Importar Contatos
                        </Button>
                    </UploadContactsDialog>
                </EmptyState>
            ) : (
                <ContactListsTable contactLists={contactLists} />
            )}
        </div>
    )
}
