'use server'

import { createClient } from '@/lib/supabase/server'

export async function getInstances() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('camp_instances')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching instances:', error)
    return []
  }

  return data
}

export async function createInstance(name: string) {
  const supabase = await createClient()

  // 1. Get user's empresa_id (Moved up for name construction)
  const { data: profile } = await supabase
    .from('camp_profiles')
    .select('empresa_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id!)
    .single()

  if (!profile?.empresa_id) {
    return { error: 'Erro ao identificar a empresa do usuário.' }
  }

  // 2. Validate name format (server-side double check)
  const nameRegex = /^[a-zA-Z0-9_-]+$/
  if (!nameRegex.test(name)) {
    return { error: 'O nome deve conter apenas letras, números, hífens e underlines.' }
  }

  // Construct the unique name for Waha
  const wahaName = `${name}_${profile.empresa_id}`

  // 3. Check uniqueness (using the wahaName)
  const { data: existing } = await supabase
    .from('camp_instances')
    .select('id')
    .eq('name', wahaName)
    .single()

  if (existing) {
    return { error: 'Já existe uma instância com este nome.' }
  }

  // 4. Create instance in DB
  const { data, error } = await supabase
    .from('camp_instances')
    .insert({
      empresa_id: profile.empresa_id,
      name: wahaName,
      status: 'STOPPED', // Default status
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating instance:', error)
    return { error: 'Erro ao criar instância. Tente novamente.' }
  }

  return { success: true, data }
}

export async function startInstanceSession(instanceId: string) {
  const supabase = await createClient()

  // 1. Get instance and verify ownership/get empresa_id
  const { data: instance, error } = await supabase
    .from('camp_instances')
    .select('empresa_id')
    .eq('id', instanceId)
    .single()

  if (error || !instance) {
    return { error: 'Instância não encontrada ou sem permissão.' }
  }

  // 2. Call Webhook
  const payload = {
    empresa_id: instance.empresa_id,
    instance_id: instanceId,
    action: 'qrcode'
  }

  try {
    const response = await fetch('https://hook.startg4.com/webhook/e774bcf1-0864-4c1c-aa54-1b4a7dcea8b0-sincronizar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      return { error: `Erro na API: ${response.statusText}` }
    }

    // We don't wait for the JSON response anymore, as the updates will come via Realtime
    return { success: true }

  } catch (e) {
    console.error('Webhook error:', e)
    return { error: 'Falha ao comunicar com o servidor de integração.' }
  }
}

export async function stopInstanceSession(instanceId: string) {
  const supabase = await createClient()

  // 1. Get instance to verify ownership
  const { data: instance, error } = await supabase
    .from('camp_instances')
    .select('empresa_id')
    .eq('id', instanceId)
    .single()

  if (error || !instance) {
    return { error: 'Instância não encontrada ou sem permissão.' }
  }

  // 2. Call Webhook
  const payload = {
    empresa_id: instance.empresa_id,
    instance_id: instanceId,
    action: 'pause'
  }

  try {
    const response = await fetch('https://hook.startg4.com/webhook/e774bcf1-0864-4c1c-aa54-1b4a7dcea8b0-sincronizar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      return { error: `Erro na API: ${response.statusText}` }
    }

    return { success: true }

  } catch (e) {
    console.error('Webhook error:', e)
    return { error: 'Falha ao comunicar com o servidor de integração.' }
  }
}

export async function deleteInstance(instanceId: string) {
  const supabase = await createClient()

  // 1. Get instance to verify ownership and get empresa_id for webhook
  const { data: instance, error: fetchError } = await supabase
    .from('camp_instances')
    .select('empresa_id')
    .eq('id', instanceId)
    .single()

  if (fetchError || !instance) {
    return { error: 'Instância não encontrada ou sem permissão.' }
  }

  // 2. Call Webhook to delete/cleanup on Waha
  const payload = {
    empresa_id: instance.empresa_id,
    instance_id: instanceId,
    action: 'delete'
  }

  try {
    // We fire and forget the webhook for delete, or should we wait? 
    // Better to wait to ensure it's gone from Waha before removing from DB
    await fetch('https://hook.startg4.com/webhook/e774bcf1-0864-4c1c-aa54-1b4a7dcea8b0-sincronizar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  } catch (e) {
    console.error('Webhook error (delete):', e)
    // We continue to delete from DB even if webhook fails? 
    // Yes, otherwise the user can't remove a broken instance.
  }

  // 3. Delete instance from DB
  const { error } = await supabase
    .from('camp_instances')
    .delete()
    .eq('id', instanceId)

  if (error) {
    console.error('Error deleting instance:', error)
    return { error: 'Erro ao excluir instância.' }
  }

  return { success: true }
}
