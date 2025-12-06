"use client"

import { useState } from "react"
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
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadContacts } from "@/app/actions/contacts"

interface UploadContactsDialogProps {
    children: React.ReactNode
}

export function UploadContactsDialog({ children }: UploadContactsDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [listName, setListName] = useState("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file || !listName) return

        setIsLoading(true)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('list_name', listName)

        const result = await uploadContacts(formData)

        if (result.error) {
            console.error(result.error)
            // TODO: Show error toast
        } else {
            console.log("Upload successful")
            setOpen(false)
            setFile(null)
            setListName("")
        }

        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Contacts</DialogTitle>
                    <DialogDescription>
                        Upload an .xls or .xlsx file to import contacts.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="listName">List Name</Label>
                        <Input
                            id="listName"
                            placeholder="My Contacts List"
                            value={listName}
                            onChange={(e) => setListName(e.target.value)}
                        />
                    </div>

                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="file">Contacts File</Label>
                        <div className="relative">
                            <Input
                                id="file"
                                type="file"
                                accept=".xls,.xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Label
                                htmlFor="file"
                                className="flex h-10 w-full cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 items-center text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {file ? "Change File" : "Choose File"}
                            </Label>
                        </div>
                    </div>
                    {file && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span className="truncate">{file.name}</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleUpload}
                        disabled={!file || !listName || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
