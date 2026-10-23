import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Check,
  ChevronDown,
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  MonitorSmartphone,
  Package,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  Smartphone,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { formatMoney } from '../data/catalog'
import { useAuth } from '../context/auth-store'
import { mapSupabaseOrder } from '../lib/orders'
import { supabase } from '../lib/supabase'
import OrderDetailsDialog from '../components/OrderDetailsDialog'
import ProductCard from '../components/ProductCard'
import { useCatalog } from '../context/catalog-store'
import { useFavorites } from '../context/favorites-store'
import { useToast } from '../context/toast-store'
import ConfirmDialog from '../components/ConfirmDialog'
import RetryState from '../components/RetryState'

const regions = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Oti',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
]

const emptyProfile = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  region: '',
  city: '',
  address: '',
  postalCode: '',
  hairNeeds: [],
  emailUpdates: true,
  orderAlerts: true,
  restockAlerts: false,
  photo: '',
}

const emptyDeliveryAddress = {
  label: '',
  recipientName: '',
  phone: '',
  region: '',
  city: '',
  address: '',
  landmark: '',
  postalCode: '',
  isDefault: true,
}

function profileFromSupabase(profile, user) {
  return {
    ...emptyProfile,
    firstName: profile?.first_name || user?.user_metadata?.first_name || '',
    lastName: profile?.last_name || user?.user_metadata?.last_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    region: profile?.region || '',
    city: profile?.city || '',
    address: profile?.address || '',
    postalCode: profile?.postal_code || '',
    photo: profile?.photo_url || '',
    hairNeeds: Array.isArray(profile?.hair_needs) ? profile.hair_needs : [],
    emailUpdates: profile?.email_updates ?? true,
    orderAlerts: profile?.order_alerts ?? true,
    restockAlerts: profile?.restock_alerts ?? false,
  }
}

const sidebarItems = [
  { id: 'user-info', label: 'User info', icon: UserRound },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'delivery', label: 'Delivery addresses', icon: MapPin },
  { id: 'setting', label: 'Settings', icon: Settings },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

const orderProgressSteps = ['Confirmation pending', 'Preparing', 'Dispatched', 'Delivered']

function RegionSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const fieldRef = useRef(null)
  const normalizedQuery = query.trim().toLowerCase()
  const matchingRegions = regions.filter((region) => region.toLowerCase().includes(normalizedQuery))
  const canUseCustomRegion = query.trim() && !regions.some((region) => region.toLowerCase() === normalizedQuery)

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutsideClick = (event) => {
      if (!fieldRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  function selectRegion(region) {
    onChange(region)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="user-profile-region-select" ref={fieldRef}>
      <button type="button" className="user-profile-region-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span>{value || 'Select region'}</span>
        <ChevronDown size={17} />
      </button>
      {open && (
        <div className="user-profile-region-options" role="listbox" aria-label="Region">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search region" autoFocus />
          {canUseCustomRegion && <button type="button" className="add-region" onClick={() => selectRegion(query.trim())}>Use “{query.trim()}”</button>}
          {matchingRegions.map((region) => (
            <button type="button" role="option" aria-selected={value === region} className={value === region ? 'selected' : ''} key={region} onClick={() => selectRegion(region)}>
              <span>{region}</span>{value === region && <Check size={15} />}
            </button>
          ))}
          {!matchingRegions.length && !canUseCustomRegion && <p>No matching region.</p>}
        </div>
      )}
    </div>
  )
}

export default function AccountPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile: authProfile, resetPassword, signOut, updateProfile, user } = useAuth()
  const { products: catalogProducts } = useCatalog()
  const { error: favoritesError, favoriteIds, loading: favoritesLoading, refreshFavorites } = useFavorites()
  const { pushToast } = useToast()
  const initialProfile = profileFromSupabase(authProfile, user)
  const initialTab = searchParams.get('tab')
  const deepLinkedOrderId = searchParams.get('order')
  const [activeTab, setActiveTab] = useState(() => (
    sidebarItems.some((item) => item.id === initialTab) ? initialTab : 'user-info'
  ))
  const [profile, setProfile] = useState(initialProfile)
  const [savedProfile, setSavedProfile] = useState(initialProfile)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState('')
  const [deliveryAddresses, setDeliveryAddresses] = useState([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [addressError, setAddressError] = useState('')
  const [addressSaved, setAddressSaved] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState(emptyDeliveryAddress)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [securityMessage, setSecurityMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [activityReloadKey, setActivityReloadKey] = useState(0)
  const [addressReloadKey, setAddressReloadKey] = useState(0)
  const photoInputRef = useRef(null)

  const fullName =
    [savedProfile.firstName, savedProfile.lastName].filter(Boolean).join(' ') || 'Complete your profile'
  const locationLabel =
    [savedProfile.city, savedProfile.region].filter(Boolean).join(', ') || 'Add your location'
  const initials =
    [savedProfile.firstName, savedProfile.lastName]
      .filter(Boolean)
      .map((value) => value[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'AT'
  const hasUnsavedChanges = JSON.stringify(profile) !== JSON.stringify(savedProfile)
  const missingProfileFields = [profile.firstName, profile.lastName]
    .filter((value) => !value.trim()).length
  const missingAddressFields = [
    addressForm.recipientName,
    addressForm.region,
    addressForm.city,
    addressForm.address,
  ].filter((value) => !value.trim()).length
  const editingAddress = deliveryAddresses.find((address) => address.id === editingAddressId)
  const addressHasChanges = !editingAddress || JSON.stringify(addressForm) !== JSON.stringify({
    label: editingAddress.label || '',
    recipientName: editingAddress.recipient_name || '',
    phone: editingAddress.phone || '',
    region: editingAddress.region || '',
    city: editingAddress.city || '',
    address: editingAddress.address || '',
    landmark: editingAddress.landmark || '',
    postalCode: editingAddress.postal_code || '',
    isDefault: Boolean(editingAddress.is_default),
  })
  const favoriteProducts = useMemo(
    () => favoriteIds.map((id) => catalogProducts.find((product) => product.id === id)).filter(Boolean),
    [catalogProducts, favoriteIds]
  )

  useEffect(() => {
    if (!deepLinkedOrderId || activeTab !== 'orders' || ordersLoading) return undefined
    const scrollToOrder = window.setTimeout(() => {
      document.getElementById(`profile-order-${deepLinkedOrderId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    return () => window.clearTimeout(scrollToOrder)
  }, [activeTab, deepLinkedOrderId, ordersLoading, orders])

  useEffect(() => {
    if (!supabase || !user?.id) return undefined

    let active = true
    async function loadAccountActivity() {
      const [{ data, error }, { data: notificationData, error: notificationError }] = await Promise.all([
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30),
      ])
      if (!active) return
      if (error) setOrdersError(error.message)
      else setOrders((data || []).map(mapSupabaseOrder))
      if (notificationError) setNotificationsError(notificationError.message)
      else setNotifications(notificationData || [])
      setOrdersLoading(false)
      setNotificationsLoading(false)
    }
    loadAccountActivity()
    return () => {
      active = false
    }
  }, [activityReloadKey, user?.id])

  useEffect(() => {
    if (!supabase || !user?.id) {
      setAddressesLoading(false)
      return undefined
    }

    let active = true
    supabase
      .from('delivery_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) setAddressError(error.message)
        else setDeliveryAddresses(data || [])
        setAddressesLoading(false)
      })
    return () => { active = false }
  }, [addressReloadKey, user?.id])

  useEffect(() => {
    if (!supabase || !user?.id) return undefined
    const channel = supabase
      .channel(`customer-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        ({ new: notification }) => {
          setNotifications((current) => (
            current.some((item) => item.id === notification.id) ? current : [notification, ...current].slice(0, 30)
          ))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  async function markNotificationsRead() {
    if (!supabase || !notifications.some((notification) => !notification.read_at)) return
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((notification) => (
      notification.read_at ? notification : { ...notification, read_at: readAt }
    )))
    await supabase.from('notifications').update({ read_at: readAt }).is('read_at', null)
  }

  async function clearReadNotificationsConfirmed() {
    if (!supabase || !user?.id) return
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .not('read_at', 'is', null)
    if (error) {
      pushToast('Read notifications could not be cleared. Please try again.', { type: 'error' })
      return
    }
    setNotifications((current) => current.filter((notification) => !notification.read_at))
    window.dispatchEvent(new Event('apaterra-notifications-cleared'))
    pushToast('Read notifications cleared.')
  }

  function clearReadNotifications() {
    setConfirmAction({
      title: 'Clear read notifications?',
      description: 'Read updates will be removed permanently. Unread notifications will stay in your inbox.',
      confirmLabel: 'Clear read',
      onConfirm: clearReadNotificationsConfirmed,
    })
  }

  function retryAccountActivity() {
    setOrdersError('')
    setNotificationsError('')
    setOrdersLoading(true)
    setNotificationsLoading(true)
    setActivityReloadKey((current) => current + 1)
  }

  function retryAddresses() {
    setAddressError('')
    setAddressesLoading(true)
    setAddressReloadKey((current) => current + 1)
  }

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined
    const warnBeforeLeaving = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [hasUnsavedChanges])

  function applyTabChange(nextTab, shouldFocus = false) {
    setActiveTab(nextTab)
    if (nextTab === 'notifications') markNotificationsRead()
    setSaved(false)
    if (shouldFocus) requestAnimationFrame(() => document.getElementById(`profile-tab-${nextTab}`)?.focus())
  }

  function changeTab(nextTab, shouldFocus = false) {
    if (nextTab === activeTab) return
    if (hasUnsavedChanges) {
      setConfirmAction({
        title: 'Discard unsaved changes?',
        description: 'The changes in this section have not been saved and will be lost.',
        confirmLabel: 'Discard changes',
        onConfirm: () => {
          setProfile(savedProfile)
          applyTabChange(nextTab, shouldFocus)
        },
      })
      return
    }
    applyTabChange(nextTab, shouldFocus)
  }

  function handleTabKeyDown(event, currentId) {
    const currentIndex = sidebarItems.findIndex((item) => item.id === currentId)
    let nextIndex = currentIndex
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % sidebarItems.length
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + sidebarItems.length) % sidebarItems.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = sidebarItems.length - 1
    else return
    event.preventDefault()
    changeTab(sidebarItems[nextIndex].id, true)
  }

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setProfile((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setSaved(false)
  }

  function updateAddressField(event) {
    const { name, value, checked, type } = event.target
    setAddressForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setAddressSaved(false)
  }

  function startNewAddress() {
    setEditingAddressId(null)
    setAddressError('')
    setAddressSaved(false)
    setAddressForm({
      ...emptyDeliveryAddress,
      recipientName: fullName === 'Complete your profile' ? '' : fullName,
      phone: savedProfile.phone,
      isDefault: deliveryAddresses.length === 0,
    })
  }

  function editAddress(address) {
    setEditingAddressId(address.id)
    setAddressError('')
    setAddressSaved(false)
    setAddressForm({
      label: address.label || '',
      recipientName: address.recipient_name || '',
      phone: address.phone || '',
      region: address.region || '',
      city: address.city || '',
      address: address.address || '',
      landmark: address.landmark || '',
      postalCode: address.postal_code || '',
      isDefault: Boolean(address.is_default),
    })
  }

  async function mirrorDefaultAddress(address) {
    const { data, error } = await updateProfile({
      region: address.region,
      city: address.city.trim(),
      address: address.address.trim(),
      postal_code: address.postalCode.trim(),
      phone: address.phone.trim() || savedProfile.phone,
    })
    if (!error && data) {
      const nextProfile = profileFromSupabase(data, user)
      setProfile(nextProfile)
      setSavedProfile(nextProfile)
      window.dispatchEvent(new CustomEvent('apaterra-profile-updated', { detail: nextProfile }))
    }
    return error
  }

  async function saveDeliveryAddress(event) {
    event.preventDefault()
    setAddressError('')
    setAddressSaved(false)
    if (!supabase || !user?.id) {
      setAddressError('Address saving is unavailable until Supabase is configured.')
      return
    }
    if (!addressForm.recipientName.trim() || !addressForm.region || !addressForm.city.trim() || !addressForm.address.trim()) {
      return
    }

    setIsSavingAddress(true)

    const payload = {
      label: addressForm.label.trim() || 'Delivery address',
      recipient_name: addressForm.recipientName.trim(),
      phone: addressForm.phone.trim(),
      region: addressForm.region,
      city: addressForm.city.trim(),
      address: addressForm.address.trim(),
      landmark: addressForm.landmark.trim(),
      postal_code: addressForm.postalCode.trim(),
      is_default: Boolean(addressForm.isDefault),
    }

    if (payload.is_default) {
      const { error } = await supabase
        .from('delivery_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
      if (error) {
        setAddressError(error.message)
        setIsSavingAddress(false)
        return
      }
    }

    const request = editingAddressId
      ? supabase.from('delivery_addresses').update(payload).eq('id', editingAddressId).select().single()
      : supabase.from('delivery_addresses').insert({ ...payload, user_id: user.id }).select().single()
    const { data, error } = await request
    if (error) {
      setAddressError(error.message)
      setIsSavingAddress(false)
      return
    }

    setDeliveryAddresses((current) => {
      const withoutSaved = current.filter((address) => address.id !== data.id).map((address) => (
        payload.is_default ? { ...address, is_default: false } : address
      ))
      return [...withoutSaved, data].sort((a, b) => Number(b.is_default) - Number(a.is_default))
    })
    if (payload.is_default) {
      const profileError = await mirrorDefaultAddress(addressForm)
      if (profileError) {
        setAddressError(`Address saved, but checkout details could not be updated: ${profileError.message}`)
        setIsSavingAddress(false)
        return
      }
    }
    setAddressSaved(true)
    setEditingAddressId(data.id)
    setIsSavingAddress(false)
  }

  async function setDefaultAddress(address) {
    if (!supabase || !user?.id || address.is_default) return
    setAddressError('')
    const { error: clearError } = await supabase
      .from('delivery_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
    if (clearError) {
      setAddressError(clearError.message)
      return
    }
    const { error } = await supabase.from('delivery_addresses').update({ is_default: true }).eq('id', address.id)
    if (error) {
      setAddressError(error.message)
      return
    }
    setDeliveryAddresses((current) => current.map((item) => ({ ...item, is_default: item.id === address.id })))
    const profileError = await mirrorDefaultAddress({
      region: address.region,
      city: address.city,
      address: address.address,
      postalCode: address.postal_code,
      phone: address.phone,
    })
    if (profileError) setAddressError(`Default address updated, but checkout details could not be updated: ${profileError.message}`)
  }

  async function deleteAddressConfirmed(address) {
    if (!supabase || !user?.id) return
    setAddressError('')
    const remaining = deliveryAddresses.filter((item) => item.id !== address.id)
    const { error } = await supabase.from('delivery_addresses').delete().eq('id', address.id)
    if (error) {
      setAddressError(error.message)
      return
    }
    if (address.is_default && remaining.length) {
      const nextDefault = remaining[0]
      const { error: defaultError } = await supabase
        .from('delivery_addresses')
        .update({ is_default: true })
        .eq('id', nextDefault.id)
      if (defaultError) {
        setAddressError(defaultError.message)
      } else {
        remaining[0] = { ...nextDefault, is_default: true }
        const profileError = await mirrorDefaultAddress({
          region: nextDefault.region,
          city: nextDefault.city,
          address: nextDefault.address,
          postalCode: nextDefault.postal_code,
          phone: nextDefault.phone,
        })
        if (profileError) setAddressError(`Address removed, but checkout details could not be updated: ${profileError.message}`)
      }
    }
    setDeliveryAddresses(remaining)
    if (editingAddressId === address.id) startNewAddress()
  }

  function deleteAddress(address) {
    setConfirmAction({
      title: `Remove ${address.label || 'this address'}?`,
      description: 'This delivery address will be removed from your account. Existing orders will not be affected.',
      confirmLabel: 'Remove address',
      onConfirm: () => deleteAddressConfirmed(address),
    })
  }

  async function saveProfile(event) {
    event.preventDefault()
    if ((activeTab === 'user-info' && missingProfileFields) || !hasUnsavedChanges || isSavingProfile) return
    setSaveError('')
    setIsSavingProfile(true)
    const { data, error } = await updateProfile({
      first_name: profile.firstName.trim(),
      last_name: profile.lastName.trim(),
      phone: profile.phone.trim(),
      region: profile.region,
      city: profile.city.trim(),
      address: profile.address.trim(),
      postal_code: profile.postalCode.trim(),
      hair_needs: profile.hairNeeds,
      email_updates: Boolean(profile.emailUpdates),
      order_alerts: Boolean(profile.orderAlerts),
      restock_alerts: Boolean(profile.restockAlerts),
    })

    if (error) {
      setSaveError(error.message)
      setSaved(false)
      setIsSavingProfile(false)
      return
    }

    const nextProfile = profileFromSupabase(data, user)
    setProfile(nextProfile)
    setSavedProfile(nextProfile)
    setSaved(true)
    setIsSavingProfile(false)
    window.dispatchEvent(new CustomEvent('apaterra-profile-updated', { detail: nextProfile }))
  }

  async function updatePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Please choose an image smaller than 2 MB.')
      return
    }

    event.target.value = ''
    if (!supabase || !user?.id) {
      setPhotoError('Photo uploads are unavailable until Supabase is configured.')
      return
    }

    setIsUploadingPhoto(true)
    setPhotoError('')
    const avatarPath = `${user.id}/avatar`
    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(avatarPath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      setPhotoError(uploadError.message)
      setIsUploadingPhoto(false)
      return
    }

    const { data, error } = await updateProfile({ photo_url: avatarPath })
    if (error) {
      setPhotoError(error.message)
      setIsUploadingPhoto(false)
      return
    }

    const nextSavedProfile = profileFromSupabase(data, user)
    setProfile(nextSavedProfile)
    setSavedProfile(nextSavedProfile)
    window.dispatchEvent(
      new CustomEvent('apaterra-profile-updated', { detail: nextSavedProfile })
    )
    setPhotoError('')
    setSaved(true)
    setIsUploadingPhoto(false)
  }

  async function performSignOut() {
    await signOut()
    window.dispatchEvent(new CustomEvent('apaterra-profile-updated'))
    navigate('/login')
  }

  async function handleSignOut() {
    if (!hasUnsavedChanges) {
      await performSignOut()
      return
    }
    setConfirmAction({
      title: 'Sign out without saving?',
      description: 'Your unsaved profile changes will be discarded when you sign out.',
      confirmLabel: 'Discard and sign out',
      onConfirm: performSignOut,
    })
  }

  async function runConfirmedAction() {
    if (!confirmAction?.onConfirm || confirmBusy) return
    setConfirmBusy(true)
    await confirmAction.onConfirm()
    setConfirmBusy(false)
    setConfirmAction(null)
  }

  async function explainSecurity(action) {
    if (action === 'password' && !savedProfile.email) {
      setSecurityMessage('Add and save your email address in User info before requesting a reset.')
      return
    }
    if (action === 'password') {
      const { error } = await resetPassword(savedProfile.email)
      setSecurityMessage(error ? error.message : `Password reset instructions were sent to ${savedProfile.email}.`)
      return
    }
    const messages = {
      mfa: 'Two-factor authentication will be available in the next account-security update.',
      sessions: 'This browser is signed in through a secure Supabase session.',
    }
    setSecurityMessage(messages[action])
  }

  return (
    <main className="user-profile-page page-shell">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={updatePhoto}
        hidden
      />

      <div className="user-profile-shell">
        {/* Left Sidebar */}
        <aside className="user-profile-sidebar" aria-label="User Profile Navigation">
          <div className="user-profile-sidebar-top">
            <h1 className="user-profile-heading">User Profile</h1>

            <nav className="user-profile-nav" role="tablist" aria-label="Profile sections">
              {sidebarItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`profile-tab-${id}`}
                  type="button"
                  role="tab"
                  className={`user-profile-nav-item ${activeTab === id ? 'active' : ''}`}
                  aria-selected={activeTab === id}
                  aria-controls={`profile-panel-${id}`}
                  tabIndex={activeTab === id ? 0 : -1}
                  onClick={() => changeTab(id)}
                  onKeyDown={(event) => handleTabKeyDown(event, id)}
                >
                  <Icon size={19} strokeWidth={1.75} />
                  <span>{label}</span>
                  {id === 'notifications' && notifications.some((notification) => !notification.read_at) && (
                    <i className="user-profile-nav-dot" aria-label="Unread notifications" />
                  )}
                </button>
              ))}
            </nav>
          </div>

        </aside>

        {/* Right Content Canvas */}
        <section className="user-profile-main">
          <div className="user-profile-main-inner">
            {/* Top Identity Block (Avatar + Name + Location) */}
            {activeTab === 'user-info' && <div className="user-profile-identity">
              <div className="user-profile-avatar-box">
                  <button
                    type="button"
                    className="user-profile-avatar-circle"
                    onClick={() => photoInputRef.current?.click()}
                    aria-label="Change profile picture"
                    disabled={isUploadingPhoto}
                  >
                    {savedProfile.photo ? <img src={savedProfile.photo} alt={fullName} /> : <span>{initials}</span>}
                  </button>
                <button
                  type="button"
                  className="user-profile-avatar-edit"
                  onClick={() => photoInputRef.current?.click()}
                  aria-label="Upload photo"
                  title={isUploadingPhoto ? 'Uploading photo…' : 'Change photo'}
                  disabled={isUploadingPhoto}
                >
                  <Pencil size={13} strokeWidth={2.2} />
                </button>
              </div>

              <div className="user-profile-identity-text">
                <h2>{fullName}</h2>
                <p>{photoError || locationLabel}</p>
              </div>
            </div>}

            {/* TAB 1: USER INFO */}
            {activeTab === 'user-info' && (
              <form id="profile-panel-user-info" className="user-profile-form" role="tabpanel" aria-labelledby="profile-tab-user-info" onSubmit={saveProfile}>
                <div className="user-profile-fields-grid">
                  <label className="user-profile-field">
                    <span>First name <em>Required</em></span>
                    <input
                      name="firstName"
                      autoComplete="given-name"
                      placeholder="e.g. Ama"
                      value={profile.firstName}
                      onChange={updateField}
                      required
                    />
                  </label>

                  <label className="user-profile-field">
                    <span>Last name <em>Required</em></span>
                    <input
                      name="lastName"
                      autoComplete="family-name"
                      placeholder="e.g. Mensah"
                      value={profile.lastName}
                      onChange={updateField}
                      required
                    />
                  </label>

                  <label className="user-profile-field">
                    <span>Email Address</span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="ama.mensah@gmail.com"
                      value={profile.email}
                      readOnly
                      aria-readonly="true"
                    />
                  </label>

                  <label className="user-profile-field">
                    <span>Phone Number</span>
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="(+233) 24 000 0000"
                      value={profile.phone}
                      onChange={updateField}
                    />
                  </label>

                </div>

                <div className="user-profile-submit-row">
                  <button type="submit" className="user-profile-save-btn" disabled={Boolean(missingProfileFields) || !hasUnsavedChanges || isSavingProfile}>
                    {isSavingProfile ? 'Saving…' : 'Save Changes'}
                  </button>
                  {saved && (
                    <span className="user-profile-saved-badge">
                      <Check size={14} /> Saved successfully
                    </span>
                  )}
                  {hasUnsavedChanges && <span className="user-profile-unsaved-badge">Unsaved changes</span>}
                  {saveError && <span className="user-profile-error" role="alert">{saveError}</span>}
                </div>
              </form>
            )}

            {/* TAB 2: FAVORITES */}
            {activeTab === 'favorites' && (
              <section id="profile-panel-favorites" className="user-profile-pane" role="tabpanel" aria-labelledby="profile-tab-favorites">
                <div className="user-profile-subhead">
                  <h3>Your Favorites</h3>
                  <p>Products you have saved for your next care day.</p>
                </div>

                {favoritesError && <RetryState compact title="Favorites could not be loaded." onRetry={refreshFavorites} />}
                {favoritesLoading ? (
                  <div className="user-favorites-loading" aria-label="Loading favorites">
                    <span /><span /><span />
                  </div>
                ) : favoriteProducts.length ? (
                  <div className="product-grid user-favorites-grid">
                    {favoriteProducts.map((product) => <ProductCard key={product.id} product={product} />)}
                  </div>
                ) : (
                  <div className="user-favorites-empty">
                    <Heart size={24} aria-hidden="true" />
                    <h4>No favorites yet</h4>
                    <p>Tap the heart on any product to keep it here.</p>
                    <Link to="/shop">Browse products</Link>
                  </div>
                )}
              </section>
            )}

            {/* TAB 3: ORDERS */}
            {activeTab === 'orders' && (
              <div id="profile-panel-orders" className="user-profile-pane" role="tabpanel" aria-labelledby="profile-tab-orders">
                <div className="user-profile-subhead">
                  <h3>Order History</h3>
                  <p>
                    {ordersLoading
                      ? 'Loading your orders…'
                      : orders.length
                      ? `Showing ${orders.length} recent ${orders.length === 1 ? 'order' : 'orders'}.`
                      : 'You have not placed any orders yet.'}
                  </p>
                </div>

                {ordersError && <RetryState compact title="Orders could not be loaded." message={ordersError} onRetry={retryAccountActivity} />}

                {!ordersLoading && orders.length > 0 ? (
                  <div className="user-profile-orders">
                    {orders.map((order) => (
                      <article id={`profile-order-${order.id}`} key={order.reference} className={`user-profile-order-card${deepLinkedOrderId === order.id ? ' is-highlighted' : ''}`} tabIndex={deepLinkedOrderId === order.id ? -1 : undefined}>
                        <div className="order-card-head">
                          <div>
                            <strong>{order.reference}</strong>
                            <span>
                              {new Date(order.date).toLocaleDateString('en-GH', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="order-badge">{order.status || 'Requested'}</span>
                        </div>

                        {order.status === 'Cancelled' ? (
                          <div className="order-status-cancelled"><span /> Order cancelled</div>
                        ) : (
                          <div className="order-status-timeline" aria-label={`Order status: ${order.status}`}>
                            {orderProgressSteps.map((step, index) => {
                              const currentIndex = Math.max(0, orderProgressSteps.indexOf(order.status))
                              return (
                                <div className={index <= currentIndex ? 'complete' : ''} key={step}>
                                  <span />
                                  <small>{step === 'Confirmation pending' ? 'Received' : step}</small>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        <div className="order-card-items">
                          {order.items?.map((item) => (
                            <div key={item.id} className="order-card-item">
                              <img src={item.image} alt={item.name} />
                              <div>
                                <strong>{item.name}</strong>
                                <small>
                                  {item.size} · Qty {item.quantity}
                                </small>
                              </div>
                              <span>{formatMoney(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="order-card-foot">
                          <span>
                            {order.paymentMethod === 'delivery' ? 'Pay on delivery' : 'Mobile Money'}
                          </span>
                          <strong>{formatMoney(order.subtotal)}</strong>
                        </div>
                        <button type="button" className="user-profile-order-details" onClick={() => setSelectedOrder(order)}>View order details</button>
                      </article>
                    ))}
                  </div>
                ) : !ordersLoading ? (
                  <div className="user-profile-empty">
                    <Package size={28} />
                    <h4>No orders yet</h4>
                    <p>Explore our collection to begin your personalized care plan.</p>
                    <Link to="/shop" className="user-profile-save-btn">
                      Shop Collection
                    </Link>
                  </div>
                ) : null}
              </div>
            )}

            {/* TAB 4: DELIVERY ADDRESSES */}
            {activeTab === 'delivery' && (
              <section id="profile-panel-delivery" className="user-profile-pane user-profile-delivery" role="tabpanel" aria-labelledby="profile-tab-delivery">
                <div className="user-profile-subhead user-profile-delivery-heading">
                  <div><h3>Delivery addresses</h3><p>Save multiple addresses and choose one as your checkout default.</p></div>
                  <button type="button" className="user-profile-add-address" onClick={startNewAddress}><Plus size={16} /> Add address</button>
                </div>

                {addressesLoading ? <p className="user-profile-address-note">Loading saved addresses…</p> : deliveryAddresses.length ? (
                  <div className="user-profile-address-list">
                    {deliveryAddresses.map((address) => (
                      <article className="user-profile-address-card" key={address.id}>
                        <div className="user-profile-address-card-head"><div><strong>{address.label || 'Delivery address'}</strong>{address.is_default && <span>Default</span>}</div><div><button type="button" onClick={() => editAddress(address)}>Edit</button><button type="button" className="danger" onClick={() => deleteAddress(address)}>Remove</button></div></div>
                        <p>{address.recipient_name}{address.phone ? ` · ${address.phone}` : ''}</p>
                        <p>{address.address}{address.landmark ? `, ${address.landmark}` : ''}</p>
                        <p>{[address.city, address.region, address.postal_code].filter(Boolean).join(', ')}</p>
                        {!address.is_default && <button type="button" className="user-profile-default-address" onClick={() => setDefaultAddress(address)}>Use as default</button>}
                      </article>
                    ))}
                  </div>
                ) : <p className="user-profile-address-note">No saved addresses yet. Add one to make checkout quicker.</p>}

                <form className="user-profile-form user-profile-address-form" onSubmit={saveDeliveryAddress}>
                  <div className="user-profile-subhead"><h3>{editingAddressId ? 'Edit address' : 'Add a delivery address'}</h3><p>Use a clear label such as Home, Work, or Mum’s place.</p></div>
                  <div className="user-profile-fields-grid">
                    <label className="user-profile-field"><span>Address label</span><input name="label" placeholder="e.g. Home" value={addressForm.label} onChange={updateAddressField} /></label>
                    <label className="user-profile-field"><span>Recipient name <em>Required</em></span><input name="recipientName" autoComplete="name" value={addressForm.recipientName} onChange={updateAddressField} required /></label>
                    <label className="user-profile-field"><span>Phone number</span><input name="phone" type="tel" autoComplete="tel" value={addressForm.phone} onChange={updateAddressField} /></label>
                    <label className="user-profile-field"><span>Region <em>Required</em></span><RegionSelect value={addressForm.region} onChange={(region) => { setAddressForm((current) => ({ ...current, region })); setAddressSaved(false) }} /></label>
                    <label className="user-profile-field"><span>Town or city <em>Required</em></span><input name="city" autoComplete="address-level2" value={addressForm.city} onChange={updateAddressField} required /></label>
                    <label className="user-profile-field"><span>Postal code / digital address</span><input name="postalCode" autoComplete="postal-code" placeholder="GA-183-8164" value={addressForm.postalCode} onChange={updateAddressField} /></label>
                    <label className="user-profile-field user-profile-field-wide"><span>Street address <em>Required</em></span><input name="address" autoComplete="street-address" value={addressForm.address} onChange={updateAddressField} required /></label>
                    <label className="user-profile-field user-profile-field-wide"><span>Landmark <em>Optional</em></span><input name="landmark" placeholder="A nearby landmark for the rider" value={addressForm.landmark} onChange={updateAddressField} /></label>
                  </div>
                  <label className="user-profile-default-toggle"><input type="checkbox" name="isDefault" checked={addressForm.isDefault} onChange={updateAddressField} /><span>Use this as my default delivery address</span></label>
                  {addressError && <RetryState compact title="Delivery addresses could not be updated." message={addressError} onRetry={retryAddresses} />}
                  <div className="user-profile-submit-row"><button type="submit" className="user-profile-save-btn" disabled={Boolean(missingAddressFields) || !addressHasChanges || isSavingAddress}>{isSavingAddress ? 'Saving…' : editingAddressId ? 'Save address' : 'Add address'}</button>{addressSaved && <span className="user-profile-saved-badge"><Check size={14} /> Address saved</span>}</div>
                </form>
              </section>
            )}

            {/* TAB 5: SETTINGS & SECURITY */}
            {activeTab === 'setting' && (
              <section id="profile-panel-setting" className="user-profile-pane" role="tabpanel" aria-labelledby="profile-tab-setting">
                <div className="user-profile-subhead">
                  <h3>Account settings</h3>
                  <p>Manage your account security and signed-in device.</p>
                </div>

                <div className="user-profile-security-box">
                  <div className="sec-item">
                    <span className="sec-item-icon">
                      <KeyRound size={17} />
                    </span>
                    <div>
                      <strong>Password Reset</strong>
                      <small>{savedProfile.email || 'Save an email address first'}</small>
                    </div>
                    <button type="button" onClick={() => explainSecurity('password')}>
                      Reset
                    </button>
                  </div>

                  <div className="sec-item">
                    <span className="sec-item-icon">
                      <Smartphone size={17} />
                    </span>
                    <div>
                      <strong>Two-Factor Authentication</strong>
                      <small>Extra security for sign-in</small>
                    </div>
                    <button type="button" onClick={() => explainSecurity('mfa')}>
                      Configure
                    </button>
                  </div>

                  <div className="sec-item">
                    <span className="sec-item-icon">
                      <MonitorSmartphone size={17} />
                    </span>
                    <div>
                      <strong>Active Browser Session</strong>
                      <small>Signed in on this device</small>
                    </div>
                    <button type="button" onClick={() => explainSecurity('sessions')}>
                      Review
                    </button>
                  </div>
                </div>

                {securityMessage && (
                  <div className="user-profile-toast" role="status">
                    <ShieldCheck size={16} />
                    <span>{securityMessage}</span>
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={() => setSecurityMessage('')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                <div className="user-profile-account-action">
                  <div><strong>Sign out of Apa Terra</strong><small>Your saved profile will remain securely linked to your account.</small></div>
                  <button type="button" onClick={handleSignOut}><LogOut size={16} /> Log out</button>
                </div>

              </section>
            )}

            {/* TAB 6: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <form id="profile-panel-notifications" className="user-profile-form" role="tabpanel" aria-labelledby="profile-tab-notifications" onSubmit={saveProfile}>
                <div className="user-profile-subhead">
                  <h3>Notifications</h3>
                  <p>Order activity and your communication preferences.</p>
                </div>

                <section className="user-notification-inbox" aria-label="Recent notifications">
                  <div className="user-notification-inbox-head">
                    <strong>Recent updates</strong>
                    <div className="user-notification-inbox-actions">
                      <span>{notifications.length}</span>
                      {notifications.some((notification) => notification.read_at) && <button type="button" onClick={clearReadNotifications}>Clear read</button>}
                    </div>
                  </div>
                  {notificationsLoading && <p>Loading your updates…</p>}
                  {notificationsError && <RetryState compact title="Notifications could not be loaded." message={notificationsError} onRetry={retryAccountActivity} />}
                  {!notificationsLoading && !notifications.length && (
                    <div className="user-notification-empty"><Bell size={20} /><span>No order updates yet.</span></div>
                  )}
                  {notifications.map((notification) => (
                    <article className={`user-notification-item${notification.read_at ? '' : ' unread'}`} key={notification.id}>
                      <span className="user-notification-icon"><Bell size={15} /></span>
                      <div>
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.created_at).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}</small>
                      </div>
                    </article>
                  ))}
                </section>

                <div className="user-profile-subhead notification-preferences-head">
                  <h3>Preferences</h3>
                  <p>Choose which updates you would like to receive from Apa Terra.</p>
                </div>

                <div className="user-profile-toggles">
                  <label className="user-profile-toggle-row">
                    <div>
                      <strong>Order &amp; Delivery Updates</strong>
                      <small>Receive status notifications when your order is dispatched.</small>
                    </div>
                    <input
                      type="checkbox"
                      name="orderAlerts"
                      checked={Boolean(profile.orderAlerts)}
                      onChange={updateField}
                    />
                  </label>

                  <label className="user-profile-toggle-row">
                    <div>
                      <strong>Seasonal Care Notes &amp; Guides</strong>
                      <small>Thoughtful wash-day guides and botanical ingredient spotlights.</small>
                    </div>
                    <input
                      type="checkbox"
                      name="emailUpdates"
                      checked={Boolean(profile.emailUpdates)}
                      onChange={updateField}
                    />
                  </label>

                  <label className="user-profile-toggle-row">
                    <div>
                      <strong>Back-in-Stock Alerts</strong>
                      <small>Be the first to know when small-batch formulas restock.</small>
                    </div>
                    <input
                      type="checkbox"
                      name="restockAlerts"
                      checked={Boolean(profile.restockAlerts)}
                      onChange={updateField}
                    />
                  </label>
                </div>

                <div className="user-profile-submit-row">
                  <button type="submit" className="user-profile-save-btn" disabled={!hasUnsavedChanges || isSavingProfile}>
                    {isSavingProfile ? 'Saving…' : 'Save Changes'}
                  </button>
                  {saved && (
                    <span className="user-profile-saved-badge">
                      <Check size={14} /> Saved successfully
                    </span>
                  )}
                  {hasUnsavedChanges && <span className="user-profile-unsaved-badge">Unsaved changes</span>}
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
      <OrderDetailsDialog order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmLabel={confirmAction?.confirmLabel}
        busy={confirmBusy}
        onConfirm={runConfirmedAction}
        onCancel={() => !confirmBusy && setConfirmAction(null)}
      />
    </main>
  )
}
