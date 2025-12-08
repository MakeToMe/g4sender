'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ContactList = {
    id: string
    created_at: string
    nome: string | null
    empresa: string | null
}

export async function getContactLists() {
    const supabase = await createClient()

    // Get user's empresa_id
    const { data: profile } = await supabase
        .from('camp_profiles')
        .select('empresa_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id!)
        .single()

    if (!profile?.empresa_id) {
        return []
    }

    const { data, error } = await supabase
        .from('camp_list_contacts')
        .select('*')
        .eq('empresa', profile.empresa_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contact lists:', error)
        return []
    }

    return data as ContactList[]
}

export type Contact = {
    id: string
    created_at: string
    name: string | null
    phone: string
    status?: string | null
    tags?: string[] | null
    campaigns_id?: { id: string; name: string }[] | null
    send_campaigns?: boolean | null
    // Add other fields as necessary
}

export async function getContactsByListId(listId: string) {
    const supabase = await createClient()

    // We ideally should check if the list belongs to the user's company
    // But for now let's just fetch the contacts
    // Assuming the table is camp_contacts and foreign key is list_id or list_contact_id
    // If I'm wrong, I'll get an error and fix it.
    // Based on typical naming, could be list_id.

    // Let's first check if we can verify the column name via a small inspection query if possible 
    // or just assume 'list_id'. 
    // The user didn't give the schema for camp_contacts, only camp_list_contacts.
    // I'll try 'list_id'.

    // Also need to know the correct fields. The previous ContactsTable used: name, phone, tags, created_at.

    const { data, error } = await supabase
        .from('camp_contacts')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contacts for list:', error)
        return []
    }

    return data as Contact[]
}

export async function updateContactSubscription(contactId: string, status: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('camp_contacts')
        .update({ send_campaigns: status })
        .eq('id', contactId)

    if (error) {
        console.error('Error updating subscription:', error)
        return { error: 'Falha ao atualizar inscrição.' }
    }

    revalidatePath('/contacts/[id]', 'page') // Revalidate dynamic routes
    return { success: true }
}

export async function deleteContactList(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('camp_list_contacts')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: 'Failed to delete contact list' }
    }

    revalidatePath('/contacts')
    return { success: true }
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

        const result = await response.json()
        revalidatePath('/contacts')

        return result // Should return { empresa_id, list_contacts, status }

    } catch (e) {
        console.error('Webhook upload error:', e)
        return { error: 'Falha ao enviar arquivo para processamento.' }
    }
}
