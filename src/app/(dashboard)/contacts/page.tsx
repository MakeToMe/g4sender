import { getContacts } from "@/app/actions/contacts"
import { ContactsTable } from "@/components/contacts-table"
import { EmptyState } from "@/components/empty-state"
import { Users, Upload } from "lucide-react"
import { UploadContactsDialog } from "@/components/upload-contacts-dialog"
import { Button } from "@/components/ui/button"

export default async function ContactsPage() {
    const contacts = await getContacts()

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
                    <p className="text-muted-foreground">
                        Manage your contacts and lists here.
                    </p>
                </div>
            </div>

            {contacts.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="No contacts found"
                    description="You haven't imported any contacts yet. Upload a file to get started."
                >
                    <UploadContactsDialog>
                        <Button className="mt-4">
                            <Upload className="mr-2 h-4 w-4" />
                            Import Contacts
                        </Button>
                    </UploadContactsDialog>
                </EmptyState>
            ) : (
                <ContactsTable initialContacts={contacts} />
            )}
        </div>
    )
}
