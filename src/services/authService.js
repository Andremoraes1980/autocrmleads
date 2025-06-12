import { supabase } from '../lib/supabaseClient'

export async function login(email, senha) {
  const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: senha
  })

  if (loginError) return { error: 'Email ou senha inválidos.' }

  const { user } = session

  const { data: usuario, error: statusError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', user.email)
    .single()

  if (statusError || !usuario) {
    await supabase.auth.signOut()
    return { error: 'Usuário não encontrado na base.' }
  }

  if (!usuario.ativo) {
    await supabase.auth.signOut()
    return { error: 'Seu acesso foi desativado.' }
  }

  return { success: true, usuario }
}
