'use server'

import { createClient } from '@/lib/supabase/server'
import { r2 } from '@/lib/r2'
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { revalidatePath } from 'next/cache'

export type StorageFile = {
    key: string
    name: string
    url: string
    lastModified: Date
    size: number
    type: string
}

async function getCompanyId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

    return profile?.empresa_id
}

export async function getStorageFiles() {
    const supabase = await createClient()
    const companyId = await getCompanyId()

    if (!companyId) {
        return []
    }

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
            Prefix: `${companyId}/`,
        })

        const response = await r2.send(command)

        if (!response.Contents) {
            return []
        }

        // Fetch campaigns to map file types
        const { data: campaigns } = await supabase
            .from('camp_campaigns')
            .select('message_url, message_type')
            .eq('empresa_id', companyId)
            .not('message_url', 'is', null)

        const fileTypeMap = new Map<string, string>()
        campaigns?.forEach((camp: { message_url: string | null; message_type: string | null }) => {
            if (camp.message_url) {
                // extract key from url if possible, or just map full url
                // Our storage keys are suffix of URL.
                // URL: https://domain/key
                fileTypeMap.set(camp.message_url, camp.message_type || 'file')
            }
        })

        const files: StorageFile[] = response.Contents
            .filter(item => item.Key && item.Size && item.Size > 0)
            .map((item) => {
                const url = `https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}/${item.Key}`

                // Try to find type from DB, otherwise guess from extension
                let type = fileTypeMap.get(url)

                if (!type) {
                    const ext = item.Key!.split('.').pop()?.toLowerCase()
                    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) type = 'image'
                    else if (['mp4', 'webm', 'mov', 'avi'].includes(ext || '')) type = 'video'
                    else if (['mp3', 'wav', 'ogg', 'opus', 'aac', 'm4a'].includes(ext || '')) type = 'audio'
                    else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext || '')) type = 'document'
                    else type = 'file'
                }

                return {
                    key: item.Key!,
                    name: item.Key!.split('/').pop() || 'Unknown',
                    url: url,
                    lastModified: item.LastModified || new Date(),
                    size: item.Size || 0,
                    type: type
                }
            })
            .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

        console.log('[STORAGE DEBUG] Files found:', files.map(f => f.key))
        return files

    } catch (error) {
        console.error('Error fetching storage files:', error)
        return []
    }
}

export async function deleteStorageFile(key: string) {
    const companyId = await getCompanyId()

    if (!companyId) {
        return { error: 'Unauthorized' }
    }

    if (!key.startsWith(companyId)) {
        return { error: 'Unauthorized deletion' }
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        })

        await r2.send(command)
        revalidatePath('/storage')
        return { success: true }

    } catch (error) {
        console.error('Error deleting file:', error)
        return { error: 'Failed to delete file' }
    }
}
