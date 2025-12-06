'use server'

import { createClient } from '@/lib/supabase/server'

export async function getContacts() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('camp_contacts')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contacts:', error)
        return []
    }

    return data
}

export async function uploadContacts(formData: FormData) {
    const supabase = await createClient()

    // 1. Get user's empresa_id
    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

    if (!profile?.empresa_id) {
        return { error: 'Erro ao identificar a empresa do usuário.' }
    }

    // 2. Prepare FormData for Webhook
    const file = formData.get('file') as File
    const listName = formData.get('list_name') as string

    if (!file) {
        return { error: 'Nenhum arquivo enviado.' }
    }

    const webhookFormData = new FormData()
    webhookFormData.append('file', file)
    webhookFormData.append('empresa_id', profile.empresa_id)
    if (listName) {
        webhookFormData.append('list_name', listName)
    }

    // 3. Send to Webhook
    try {
        const response = await fetch('https://hook.startg4.com/webhook/7b533050-ed0c-4cb8-9f95-d677a4a0f6af-upload', {
            method: 'POST',
            body: webhookFormData,
        })

        if (!response.ok) {
            return { error: `Erro no upload: ${response.statusText}` }
        }

        return { success: true }

    } catch (e) {
        console.error('Webhook upload error:', e)
        return { error: 'Falha ao enviar arquivo para processamento.' }
    }
}
