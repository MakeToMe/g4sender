'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

const signUpSchema = z.object({
    name: z.string().min(2),
    companyName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
})
export async function signIn(formData: z.infer<typeof signInSchema>) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword(formData)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signUp(formData: z.infer<typeof signUpSchema>) {
    const supabase = await createClient()

    // Tenta criar o usuário já confirmado usando a API de Admin
    // Isso requer que a SUPABASE_KEY seja a Service Role Key
    const { data, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true, // Pula a confirmação de email
        user_metadata: {
            name: formData.name,
            company_name: formData.companyName,
        },
    })

    if (error) {
        return { error: error.message }
    }

    // Se criou com sucesso, faz o login imediatamente
    if (data.user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        })

        if (signInError) {
            return { error: signInError.message }
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/signin')
}
