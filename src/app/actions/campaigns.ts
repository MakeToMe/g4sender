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
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

    if (!profile?.empresa_id) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('camp_campaigns')
        .delete()
        .eq('id', id)
        .eq('empresa_id', profile.empresa_id)

    if (error) {
        console.error('Error deleting campaign:', error)
        return { error: 'Failed to delete campaign' }
    }

    revalidatePath('/campaigns')
    return { success: true }
}

import { r2 } from "@/lib/r2"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "crypto"

export async function getPresignedUrl(fileName: string, contentType: string) {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const fileExtension = fileName.split('.').pop()
    const key = `${user.id}/${randomUUID()}.${fileExtension}`

    const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    })

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 })

    return { url, key }
}
