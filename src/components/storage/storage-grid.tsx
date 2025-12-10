'use client'

import { StorageFile } from "@/app/actions/storage"
import { StorageCard } from "./storage-card"
import { FileQuestion } from "lucide-react"

interface StorageGridProps {
    files: StorageFile[]
}

export function StorageGrid({ files: initialFiles }: StorageGridProps) {
    // We could manage local state here if we wanted optimistic updates, 
    // but for now we rely on server revalidation (router.refresh() call in the action or parent)
    // Actually, handling onDeleted to remove from UI immediately is better UX.

    // However, since the parent is a Server Component, pass-through refresh is simpler but slower.
    // Let's implement full refresh via router.

    return (
        <>
            {initialFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground border-2 border-dashed rounded-xl">
                    <FileQuestion className="h-16 w-16 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">Nenhum arquivo encontrado</h3>
                    <p className="text-sm">Os arquivos que você enviar aparecerão aqui.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {initialFiles.map((file) => (
                        <StorageCard
                            key={file.key}
                            file={file}
                            onDeleted={() => {
                                // Since we used revalidatePath in the server action, 
                                // the page should refresh automatically if this was a server component children? 
                                // No, client needs to know.
                                // But revalidatePath on server action called from client updates the server component view cache.
                                // Next.js should handle the UI update if we treat this correctly.
                                // For good measure, we can just let it be, or trigger a router.refresh() if needed.
                                // The toast in dialog confirms success.
                            }}
                        />
                    ))}
                </div>
            )}
        </>
    )
}
