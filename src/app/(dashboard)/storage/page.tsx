import { StorageGrid } from "@/components/storage/storage-grid"
import { getStorageFiles } from "@/app/actions/storage"
import { Separator } from "@/components/ui/separator"

import { StorageStats } from "@/components/storage/storage-stats"

export default async function StoragePage() {
    const files = await getStorageFiles()

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Storage</h2>
                    <p className="text-muted-foreground">
                        Gerencie seus arquivos de mídia (imagens, vídeos, documentos).
                    </p>
                </div>
            </div>

            <StorageStats files={files} />

            <div className="flex-1">
                <StorageGrid files={files} />
            </div>
        </div>
    )
}
