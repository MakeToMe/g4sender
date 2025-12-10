'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Campaign = {
    id: string
    name: string
    message_priority: 'high' | 'normal'
    message_type: 'text' | 'image' | 'video' | 'audio' | 'document'
    message_template: string
    status: 'draft' | 'sending' | 'sent' | 'paused'
    scheduled_at: string | null
    created_at: string
    message_url?: string | null
}

export async function getCampaigns() {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

    if (!profile?.empresa_id) {
        return []
    }

    const { data, error } = await supabase
        .from('camp_campaigns')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching campaigns:', error)
        return []
    }

    return data as Campaign[]
}

export async function createCampaign(formData: FormData) {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

    if (!profile?.empresa_id) {
        return { error: 'Empresa não identificada.' }
    }

    const name = formData.get('name') as string
    const messageTemplate = formData.get('message_template') as string
    const messageType = formData.get('message_type') as string || 'text'
    const messageUrl = formData.get('message_url') as string | null

    if (!name || !messageTemplate) {
        return { error: 'Nome e Mensagem são obrigatórios.' }
    }

    const { error } = await supabase
        .from('camp_campaigns')
        .insert({
            empresa_id: profile.empresa_id,
            name,
            message_template: messageTemplate,
            status: 'draft',
            message_type: messageType,
            message_url: messageUrl
        })

    if (error) {
        console.error('Error creating campaign:', error)
        return { error: 'Erro ao criar campanha.' }
    }

    revalidatePath('/campaigns')
    return { success: true }
}

export async function updateCampaign(formData: FormData) {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

    if (!profile?.empresa_id) {
        return { error: 'Empresa não identificada.' }
    }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const messageTemplate = formData.get('message_template') as string
    const messageType = formData.get('message_type') as string
    const messageUrl = formData.get('message_url') as string | null

    if (!id || !name || !messageTemplate) {
        return { error: 'Dados inválidos.' }
    }

    const updateData: any = {
        name,
        message_template: messageTemplate,
        message_type: messageType,
    }

    if (messageUrl) {
        updateData.message_url = messageUrl
    }

    const { error } = await supabase
        .from('camp_campaigns')
        .update(updateData)
        .eq('id', id)
        .eq('empresa_id', profile.empresa_id)

    if (error) {
        console.error('Error updating campaign:', error)
        return { error: 'Erro ao atualizar campanha.' }
    }

    revalidatePath('/campaigns')
    return { success: true }
}

export async function deleteCampaign(id: string) {
    try {
        const supabase = await createClient()

        const { data: profile } = await supabase
            .from('camp_profiles')
            .select('empresa_id')
            .eq('id', (await supabase.auth.getUser()).data.user?.id!)
            .single()

        if (!profile?.empresa_id) {
            console.error('[DELETE DEBUG] No profile or empresa_id found for user')
            return { error: 'Unauthorized: No profile found' }
        }

        console.log('[DELETE DEBUG] User Profile:', { userId: (await supabase.auth.getUser()).data.user?.id, empresaId: profile.empresa_id })
        console.log('[DELETE DEBUG] Target Campaign ID:', id)

        // Fetch campaign to get message_url before deleting
        const { data: campaign, error: fetchError } = await supabase
            .from('camp_campaigns')
            .select('id, message_url, empresa_id')
            .eq('id', id)
            .single() // Try fetching by ID only first to see if it exists at all

        console.log('[DELETE DEBUG] Fetch Result (ID only):', { campaign, fetchError })

        if (campaign && campaign.empresa_id !== profile.empresa_id) {
            console.error('[DELETE DEBUG] Mismatch! Campaign empresa_id:', campaign.empresa_id, 'User empresa_id:', profile.empresa_id)
        }

        // Delete file from R2 if exists
        if (campaign?.message_url) {
            try {
                const key = campaign.message_url.replace(`https://${process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN}/`, '')
                if (key) {
                    await r2.send(new DeleteObjectCommand({
                        Bucket: process.env.R2_BUCKET_NAME,
                        Key: key,
                    }))
                }
            } catch (error) {
                console.error('Error deleting file from R2:', error)
                // Continue with record deletion even if file deletion fails
            }
        }

        // Create Admin Client to bypass RLS for deletion
        const supabaseAdmin = createClientRaw(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        )

        const { error: deleteError, count } = await supabaseAdmin
            .from('camp_campaigns')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('empresa_id', profile.empresa_id)

        console.log('[DELETE DEBUG] ' + JSON.stringify({ id, empresa_id: profile.empresa_id, deleteError, count }))

        if (deleteError) {
            console.error('Error deleting campaign:', deleteError)
            return { error: deleteError.message }
        }

        if (count === 0) {
            console.error('Delete operation affected 0 rows')
            return { error: 'Erro ao excluir: Campanha não encontrada ou permissão negada (RLS).' }
        }

        revalidatePath('/campaigns')
        return { success: true }
    } catch (error: any) {
        console.error('CRITICAL SERVER ACTION ERROR:', error)
        return { error: 'Erro interno no servidor: ' + error.message }
    }
}

import { r2 } from "@/lib/r2"
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"
import { createClient as createClientRaw } from "@supabase/supabase-js"

export async function getPresignedUrl(fileName: string, contentType: string) {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await session
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single()

    if (!profile?.empresa_id) {
        return { error: 'Empresa não identificada.' }
    }

    const fileExtension = fileName.split('.').pop()
    const key = `${profile.empresa_id}/${randomUUID()}.${fileExtension}`

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    })

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 })

    return { url, key }
}

export async function triggerCampaign(
    campaignId: string,
    instanceIds: string[],
    listId: string,
    alternate: boolean
) {
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

    if (!profile?.empresa_id) {
        return { error: 'Empresa não identificada.' }
    }

    try {
        const payload = {
            empresa: profile.empresa_id,
            list: listId,
            template: campaignId,
            instancia: instanceIds,
            alternate: alternate ? 'yes' : 'no'
        }

        const response = await fetch('https://hook.startg4.com/webhook/fd8eeda1-4471-4294-8afb-d6517f821a99', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            throw new Error(`Webhook error: ${response.statusText}`)
        }

        return { success: true }
    } catch (error: any) {
        console.error('Error triggering campaign:', error)
        return { error: 'Erro ao disparar campanha: ' + error.message }
    }
}
