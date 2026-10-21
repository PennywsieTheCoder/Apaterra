import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { createPrivateAvatarUrl } from '../lib/avatars'
import { AuthContext } from './auth-store'

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return undefined

    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      if (!nextSession) {
        setProfile(null)
        setRole(null)
      }
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session?.user?.id) return undefined

    let active = true

    async function loadAccountData() {
      const userId = session.user.id
      const [{ data: nextProfile }, { data: nextRole }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
      ])

      if (!active) return
      const avatarUrl = await createPrivateAvatarUrl(nextProfile?.photo_url)
      if (!active) return
      setProfile(nextProfile ? { ...nextProfile, photo_url: avatarUrl } : null)
      setRole(nextRole?.role || 'customer')
    }

    loadAccountData()
    return () => {
      active = false
    }
  }, [session?.user?.id])

  async function signUp({ email, password, fullName }) {
    if (!supabase) return { error: new Error('Supabase is not configured yet.') }
    const { firstName, lastName } = splitFullName(fullName)
    const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}#/login`
    return supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          full_name: fullName.trim(),
          first_name: firstName,
          last_name: lastName,
        },
      },
    })
  }

  async function signIn({ email, password }) {
    if (!supabase) return { error: new Error('Supabase is not configured yet.') }
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    if (!supabase) return { error: null }
    return supabase.auth.signOut()
  }

  async function resetPassword(email) {
    if (!supabase) return { error: new Error('Supabase is not configured yet.') }
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}#/login`
    return supabase.auth.resetPasswordForEmail(email, { redirectTo })
  }

  async function updateProfile(changes) {
    if (!supabase || !session?.user?.id) {
      return { data: null, error: new Error('You must be signed in to update your profile.') }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select()
      .single()

    const avatarUrl = await createPrivateAvatarUrl(data?.photo_url)
    const nextProfile = data ? { ...data, photo_url: avatarUrl } : data
    if (!error) setProfile(nextProfile)
    return { data: nextProfile, error }
  }

  async function updatePassword(password) {
    if (!supabase) return { error: new Error('Supabase is not configured yet.') }
    const result = await supabase.auth.updateUser({ password })
    if (!result.error) setRecoveryMode(false)
    return result
  }

  const value = {
    configured: isSupabaseConfigured,
    loading,
    profile,
    recoveryMode,
    role,
    session,
    signIn,
    signOut,
    signUp,
    resetPassword,
    updateProfile,
    updatePassword,
    user: session?.user || null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
