import { supabase } from './supabase'

export function getProfileAvatarPath(value) {
  if (!value) return ''
  if (!/^https?:\/\//i.test(value)) return value

  const match = value.match(/\/profile-avatars\/([^?]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export async function createPrivateAvatarUrl(value) {
  const path = getProfileAvatarPath(value)
  if (!supabase || !path) return ''

  const { data, error } = await supabase.storage
    .from('profile-avatars')
    .createSignedUrl(path, 60 * 60 * 2)

  return error ? '' : data?.signedUrl || ''
}
