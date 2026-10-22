import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Database,
  Eye,
  Fingerprint,
  LayoutGrid,
  Leaf,
  LogOut,
  MapPin,
  Moon,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useCatalog } from '../context/catalog-store'
import { useAuth } from '../context/auth-store'
import { categories, formatMoney, hairNeeds, products as defaultProducts } from '../data/catalog'
import { supabase } from '../lib/supabase'
import { mapSupabaseProduct } from '../lib/products'
import { mapSupabaseOrder } from '../lib/orders'
import OrderDetailsDialog from '../components/OrderDetailsDialog'
import { calculateFulfilmentRate, isRevenueOrder, sumOrderRevenue, sumOrderUnits } from '../lib/orderMetrics'
import { useToast } from '../context/toast-store'
import ConfirmDialog from '../components/ConfirmDialog'
import RetryState from '../components/RetryState'

const initialProduct = {
  name: '',
  type: '',
  category: 'Shampoo',
  price: '',
  stock: '',
  size: '',
  needs: [],
  badge: 'New',
  image: '',
  description: '',
  ingredients: '',
  directions: '',
  benefits: '',
  cardColor: '#d7d8d4',
  active: true,
}

const productTypes = [
  'Hydrating shampoo',
  'Scalp-clearing shampoo',
  'Fortifying conditioner',
  'Deep treatment mask',
  'Leave-in conditioner',
  'Scalp and hair oil',
  'Defining styling cream',
  'Protective-style refresher',
]

const badges = [
  'New',
  'Bestseller',
  'Everyday care',
  'Wash-day essential',
  'Lightweight',
  'Fresh start',
  'Flexible hold',
  'Strength care',
  'Protective care',
]

const sizes = ['50 ml', '100 ml', '150 ml', '200 ml', '250 ml', '300 ml', '500 ml', '1 L']

const orderStatuses = ['Confirmation pending', 'Preparing', 'Dispatched', 'Delivered', 'Cancelled']

const starterCatalogStock = {
  'moisture-wash': 42,
  'balance-cleanse': 31,
  'softening-treatment': 28,
  'daily-veil': 54,
  'rooted-drops': 19,
  'coil-custard': 37,
  'strength-rinse': 26,
  'braid-mist': 48,
}

function createId(name) {
  return `${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
}

function getPercentChange(current, previous) {
  if (!previous) {
    return current
      ? { label: 'New', direction: 'neutral' }
      : { label: '—', direction: 'neutral' }
  }

  const percent = Math.round(((current - previous) / previous) * 100)
  return {
    label: `${percent > 0 ? '+' : ''}${percent}%`,
    direction: percent > 0 ? 'positive' : percent < 0 ? 'negative' : 'neutral',
  }
}

function createTrendPath(values, width = 600, height = 150, inset = 8) {
  const safeValues = values.length ? values : [0, 0]
  const maximum = Math.max(...safeValues, 1)
  const step = (width - inset * 2) / Math.max(safeValues.length - 1, 1)

  return safeValues
    .map((value, index) => {
      const x = inset + index * step
      const y = height - inset - ((value / maximum) * (height - inset * 2))
      return `${index ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function AdminSelect({ label, value, options, placeholder, onChange, allowCustom = true, compact = false, disabled = false }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [customOptions, setCustomOptions] = useState([])
  const [menuPosition, setMenuPosition] = useState(null)
  const fieldRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const fieldLabel = label || 'option'
  const allOptions = [...(options || []), ...customOptions].filter((option) => typeof option === 'string' && option.trim())
  const filteredOptions = allOptions.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase())
  )
  const canAddOption = allowCustom &&
    query.trim() && !allOptions.some((option) => option.toLowerCase() === query.trim().toLowerCase())

  useEffect(() => {
    if (!open) return undefined
    const updateMenuPosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const bounds = trigger.getBoundingClientRect()
      const estimatedMenuHeight = 250
      const opensUpward = window.innerHeight - bounds.bottom < estimatedMenuHeight && bounds.top > estimatedMenuHeight
      setMenuPosition({
        left: `${bounds.left}px`,
        top: `${opensUpward ? bounds.top - 7 : bounds.bottom + 7}px`,
        transform: opensUpward ? 'translateY(-100%)' : 'none',
        width: `${bounds.width}px`,
      })
    }

    const closeOnOutsideClick = (event) => {
      if (!fieldRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false)
    }

    updateMenuPosition()
    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
    }
  }, [open])

  function chooseOption(option) {
    onChange(option)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className={`admin-select-field${compact ? ' compact' : ''}`} ref={fieldRef}>
      {label && <span>{label}</span>}
      <button
        type="button"
        className="admin-select-trigger"
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
      >
        <strong>{value || placeholder}</strong>
        <ChevronDown size={16} />
      </button>
      {open && !disabled && menuPosition && createPortal(
        <div className="admin-select-options admin-select-options-portal" ref={menuRef} style={menuPosition} role="listbox" aria-label={fieldLabel}>
          <input
            className="admin-select-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search or add ${fieldLabel.toLowerCase()}`}
            aria-label={`Search or add ${fieldLabel.toLowerCase()}`}
            autoFocus
          />
          {canAddOption && (
            <button
              type="button"
              className="admin-select-add"
              onClick={() => {
                const next = query.trim()
                setCustomOptions((current) => [...current, next])
                chooseOption(next)
              }}
            >
              <span>Add “{query.trim()}”</span>
              <span>Use custom value</span>
            </button>
          )}
          {filteredOptions.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={value === option}
              className={value === option ? 'selected' : ''}
              key={option}
              onClick={() => chooseOption(option)}
            >
              <span>{option}</span>
              {value === option && <Check size={15} />}
            </button>
          ))}
          {!filteredOptions.length && !canAddOption && <p>No matching options.</p>}
        </div>,
        document.body,
      )}
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const { profile: authProfile, user } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [utcHour, setUtcHour] = useState(() => new Date().getUTCHours())
  const [searchQuery, setSearchQuery] = useState('')
  const [timeframe, setTimeframe] = useState('Monthly')
  const [orderFilter, setOrderFilter] = useState('All')
  const [form, setForm] = useState(initialProduct)
  const [message, setMessage] = useState('')
  const [imageName, setImageName] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isImportingCatalog, setIsImportingCatalog] = useState(false)
  const [importProgress, setImportProgress] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [managedProducts, setManagedProducts] = useState([])
  const { refreshProducts, starterImported } = useCatalog()
  const [databaseOrders, setDatabaseOrders] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [adminNotifications, setAdminNotifications] = useState([])
  const [notificationError, setNotificationError] = useState('')
  const [adminLoadError, setAdminLoadError] = useState('')
  const [cancellationTarget, setCancellationTarget] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [deliveryZones, setDeliveryZones] = useState([])
  const [deliveryZoneForm, setDeliveryZoneForm] = useState({ region: '', city: '', fee: '', delivery_window: '1–3 business days' })
  const [isSavingDeliveryZone, setIsSavingDeliveryZone] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const productFormRef = useRef(null)

  useEffect(() => {
    if (!message) return
    const isSuccess = /(live|updated|removed|migrated|saved|restored|assigned|cleared)/i.test(message)
    pushToast(message, { type: isSuccess ? 'success' : 'error' })
  }, [message, pushToast])

  useEffect(() => {
    let intervalId
    const refreshUtcHour = () => setUtcHour(new Date().getUTCHours())
    const millisecondsUntilNextUtcHour = 60 * 60 * 1000 - (Date.now() % (60 * 60 * 1000)) + 50
    const timeoutId = window.setTimeout(() => {
      refreshUtcHour()
      intervalId = window.setInterval(refreshUtcHour, 60 * 60 * 1000)
    }, millisecondsUntilNextUtcHour)
    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (!cancellationTarget) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !isCancellingOrder) setCancellationTarget(null)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [cancellationTarget, isCancellingOrder])

  const loadManagedProducts = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('products').select('*').order('created_at')
    if (error) {
      setAdminLoadError(error.message)
      return
    }
    setManagedProducts((data || []).map(mapSupabaseProduct))
  }, [])

  const loadOrders = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (error) {
      setAdminLoadError(error.message)
      return
    }
    setDatabaseOrders((data || []).map(mapSupabaseOrder))
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) {
      setNotificationError(error.message)
      setAdminLoadError(error.message)
      return
    }
    setAdminNotifications(data || [])
    setNotificationError('')
  }, [])

  const loadDeliveryZones = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .order('region')
      .order('city')
    if (error) {
      setAdminLoadError(error.message)
      return
    }
    setDeliveryZones(data || [])
  }, [])

  async function retryAdminData() {
    setAdminLoadError('')
    await Promise.all([loadManagedProducts(), loadOrders(), loadNotifications(), loadDeliveryZones()])
  }

  useEffect(() => {
    const loadProducts = window.setTimeout(loadManagedProducts, 0)
    return () => window.clearTimeout(loadProducts)
  }, [loadManagedProducts])

  useEffect(() => {
    const loadDatabaseOrders = window.setTimeout(loadOrders, 0)
    return () => window.clearTimeout(loadDatabaseOrders)
  }, [loadOrders])

  useEffect(() => {
    const loadAdminNotifications = window.setTimeout(loadNotifications, 0)
    return () => window.clearTimeout(loadAdminNotifications)
  }, [loadNotifications])

  useEffect(() => {
    if (!supabase || !user?.id) return undefined
    const channel = supabase
      .channel(`admin-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        ({ new: notification }) => {
          setAdminNotifications((current) => (
            current.some((item) => item.id === notification.id) ? current : [notification, ...current].slice(0, 20)
          ))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  useEffect(() => {
    const loadZones = window.setTimeout(loadDeliveryZones, 0)
    return () => window.clearTimeout(loadZones)
  }, [loadDeliveryZones])

  const profile = useMemo(() => ({
    firstName: authProfile?.first_name || user?.user_metadata?.first_name || '',
    lastName: authProfile?.last_name || user?.user_metadata?.last_name || '',
    email: authProfile?.email || user?.email || '',
    photo: authProfile?.photo_url || '',
  }), [authProfile, user])
  const adminFirstName = profile.firstName.trim() || 'Admin'
  const adminFullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Apa Terra Curator'
  const adminEmail = profile.email.trim() || 'studio@apaterra.com'
  const isUtcNight = utcHour < 6 || utcHour >= 18
  const missingProductFields = [
    form.name,
    form.type,
    form.price,
    form.size,
    form.description,
    form.image,
  ].filter((value) => !String(value).trim()).length
  const productHasChanges = !editingProduct || JSON.stringify(form) !== JSON.stringify({
    name: editingProduct.name,
    type: editingProduct.type,
    category: editingProduct.category,
    price: String(editingProduct.price),
    stock: String(editingProduct.stock),
    size: editingProduct.size,
    needs: [...editingProduct.needs],
    badge: editingProduct.badge,
    image: editingProduct.image,
    description: editingProduct.description,
    ingredients: editingProduct.ingredients,
    directions: editingProduct.directions,
    benefits: editingProduct.benefits.join('\n'),
    cardColor: editingProduct.cardColor,
    active: editingProduct.active,
  })
  const missingDeliveryZoneFields = [
    deliveryZoneForm.region,
    deliveryZoneForm.fee,
    deliveryZoneForm.delivery_window,
  ].filter((value) => !String(value).trim()).length

  const allProducts = useMemo(() => {
    const productsById = new Map(defaultProducts.map((product) => [product.id, product]))
    managedProducts.forEach((product) => productsById.set(product.id, product))
    return Array.from(productsById.values())
  }, [managedProducts])

  const allOrders = databaseOrders
  const revenueOrders = useMemo(
    () => allOrders.filter(isRevenueOrder),
    [allOrders]
  )
  const reportingPeriod = useMemo(() => {
    const now = new Date()
    const months = timeframe === 'Quarterly' ? 3 : 1
    const currentStart = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    const previousStart = new Date(now.getFullYear(), now.getMonth() - months * 2 + 1, 1)
    return { now, months, currentStart, previousStart }
  }, [timeframe])
  const periodOrders = useMemo(
    () => revenueOrders.filter((order) => new Date(order.date) >= reportingPeriod.currentStart),
    [revenueOrders, reportingPeriod]
  )
  const previousPeriodOrders = useMemo(
    () => revenueOrders.filter((order) => {
      const createdAt = new Date(order.date)
      return createdAt >= reportingPeriod.previousStart && createdAt < reportingPeriod.currentStart
    }),
    [revenueOrders, reportingPeriod]
  )
  const inventoryAlerts = useMemo(() => managedProducts
    .filter((product) => product.active && product.stock <= 5)
    .sort((a, b) => a.stock - b.stock), [managedProducts])
  const unreadAdminNotifications = adminNotifications.filter((notification) => !notification.read_at)

  // All sales analytics are calculated from order snapshots. Cancelled orders are excluded
  // because their stock has been restored and they are not completed sales.
  const productSales = useMemo(() => {
    const productIndex = new Map(allProducts.map((product) => [product.id, product]))
    const rows = new Map(allProducts.map((product) => [product.id, {
      ...product,
      units: 0,
      revenue: 0,
      periodUnits: 0,
      periodRevenue: 0,
      previousPeriodRevenue: 0,
    }]))

    const addOrderItems = (orders, periodKey) => {
      orders.forEach((order) => {
        order.items.forEach((item) => {
          const product = productIndex.get(item.id) || allProducts.find((candidate) => candidate.name === item.name)
          const key = product?.id || item.id || item.name
          const current = rows.get(key) || {
            id: key,
            name: item.name,
            type: item.type || 'Archived product',
            category: product?.category || 'Other',
            size: item.size || '',
            image: item.image || '',
            price: Number(item.price || 0),
            stock: null,
            units: 0,
            revenue: 0,
            periodUnits: 0,
            periodRevenue: 0,
            previousPeriodRevenue: 0,
          }
          const quantity = Number(item.quantity || 0)
          const revenue = Number(item.price || 0) * quantity
          current.units += quantity
          current.revenue += revenue
          if (periodKey === 'current') {
            current.periodUnits += quantity
            current.periodRevenue += revenue
          }
          if (periodKey === 'previous') current.previousPeriodRevenue += revenue
          rows.set(key, current)
        })
      })
    }

    addOrderItems(revenueOrders, 'all')
    addOrderItems(periodOrders, 'current')
    addOrderItems(previousPeriodOrders, 'previous')

    return Array.from(rows.values())
      .map((product) => ({
        ...product,
        trend: getPercentChange(product.periodRevenue, product.previousPeriodRevenue),
      }))
      .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name))
  }, [allProducts, revenueOrders, periodOrders, previousPeriodOrders])

  const totalCatalogRevenue = useMemo(
    () => sumOrderRevenue(revenueOrders),
    [revenueOrders]
  )

  const totalUnitsSold = useMemo(
    () => productSales.reduce((sum, item) => sum + item.units, 0),
    [productSales]
  )

  const periodRevenue = useMemo(
    () => sumOrderRevenue(periodOrders),
    [periodOrders]
  )
  const previousPeriodRevenue = useMemo(
    () => sumOrderRevenue(previousPeriodOrders),
    [previousPeriodOrders]
  )
  const periodUnitsSold = useMemo(
    () => productSales.reduce((sum, item) => sum + item.periodUnits, 0),
    [productSales]
  )
  const previousPeriodUnitsSold = useMemo(
    () => sumOrderUnits(previousPeriodOrders),
    [previousPeriodOrders]
  )
  const avgOrderValue = periodOrders.length ? periodRevenue / periodOrders.length : 0
  const revenueChange = getPercentChange(periodRevenue, previousPeriodRevenue)
  const unitsChange = getPercentChange(periodUnitsSold, previousPeriodUnitsSold)
  const bestSeller = productSales.find((product) => product.units > 0)
  const customerOrderCounts = useMemo(() => {
    const counts = new Map()
    periodOrders.forEach((order) => {
      const email = order.email?.trim().toLowerCase()
      if (email) counts.set(email, (counts.get(email) || 0) + 1)
    })
    return counts
  }, [periodOrders])
  const returningCustomerRate = customerOrderCounts.size
    ? Math.round((Array.from(customerOrderCounts.values()).filter((count) => count > 1).length / customerOrderCounts.size) * 1000) / 10
    : 0
  const fulfilmentRate = calculateFulfilmentRate(revenueOrders)
  const revenueSeries = useMemo(() => {
    const bucketCount = timeframe === 'Quarterly' ? 12 : 7
    const buckets = Array.from({ length: bucketCount }, () => 0)
    const duration = Math.max(reportingPeriod.now - reportingPeriod.currentStart, 1)
    periodOrders.forEach((order) => {
      const elapsed = Math.max(0, new Date(order.date) - reportingPeriod.currentStart)
      const index = Math.min(bucketCount - 1, Math.floor((elapsed / duration) * bucketCount))
      buckets[index] += Number(order.subtotal || 0)
    })
    return buckets
  }, [periodOrders, reportingPeriod, timeframe])
  const revenueTrendPath = useMemo(() => createTrendPath(revenueSeries), [revenueSeries])
  const revenueAreaPath = `${revenueTrendPath} L 592 150 L 8 150 Z`
  const miniBarValues = revenueSeries.slice(-5)
  const miniBarMaximum = Math.max(...miniBarValues, 1)

  // Filtered products & orders when using top search bar
  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return productSales
    return productSales.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    )
  }, [productSales, searchQuery])

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return allOrders.filter((order) => {
      const matchesStatus = orderFilter === 'All' || order.status === orderFilter
      const matchesQuery =
        !q ||
        order.reference.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.city.toLowerCase().includes(q) ||
        order.items.some((i) => i.name.toLowerCase().includes(q))
      return matchesStatus && matchesQuery
    })
  }, [allOrders, orderFilter, searchQuery])

  const riderOptions = useMemo(() => (
    [...new Set(allOrders.map((order) => order.deliveryRider).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  ), [allOrders])

  const categoryPerformance = useMemo(() => {
    const map = {}
    productSales.filter((item) => item.revenue > 0).forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = { category: item.category, revenue: 0, units: 0, count: 0 }
      }
      map[item.category].revenue += item.revenue
      map[item.category].units += item.units
      map[item.category].count += 1
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue)
  }, [productSales])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setMessage('')
  }

  function toggleNeed(need) {
    setForm((current) => ({
      ...current,
      needs: current.needs.includes(need)
        ? current.needs.filter((item) => item !== need)
        : [...current.needs, need],
    }))
    setMessage('')
  }

  function updateImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setMessage('Choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Choose an image smaller than 10 MB.')
      return
    }
    setForm((current) => {
      if (current.image?.startsWith('blob:')) URL.revokeObjectURL(current.image)
      return { ...current, image: URL.createObjectURL(file) }
    })
    setImageFile(file)
    setImageName(file.name)
    setMessage('')
    event.target.value = ''
  }

  function resetProductEditor() {
    if (form.image?.startsWith('blob:')) URL.revokeObjectURL(form.image)
    setForm(initialProduct)
    setImageFile(null)
    setImageName('')
    setEditingProduct(null)
  }

  function editProduct(product) {
    if (form.image?.startsWith('blob:')) URL.revokeObjectURL(form.image)
    setEditingProduct(product)
    setImageFile(null)
    setImageName('')
    setForm({
      name: product.name,
      type: product.type,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      size: product.size,
      needs: [...product.needs],
      badge: product.badge,
      image: product.image,
      description: product.description,
      ingredients: product.ingredients,
      directions: product.directions,
      benefits: product.benefits.join('\n'),
      cardColor: product.cardColor,
      active: product.active,
    })
    setMessage('')
    window.requestAnimationFrame(() => productFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  async function saveProduct(event) {
    event.preventDefault()
    if (isPublishing) return
    if (
      !form.name.trim() ||
      !form.type.trim() ||
      !form.price ||
      !form.size.trim() ||
      !form.description.trim() ||
      !form.image
    ) {
      setMessage('')
      return
    }
    if (!supabase) {
      setMessage('Supabase is not configured. Add the project URL and publishable key first.')
      return
    }

    setIsPublishing(true)
    setMessage('')
    const id = editingProduct?.id || createId(form.name)
    let imagePath = editingProduct?.imagePath || ''
    let imageUrl = editingProduct?.image || ''

    if (imageFile) {
      const extensionByType = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
      const extension = extensionByType[imageFile.type] || 'jpg'
      imagePath = `${id}/${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(imagePath, imageFile, { contentType: imageFile.type, upsert: false })

      if (uploadError) {
        setMessage(uploadError.message)
        setIsPublishing(false)
        return
      }
      imageUrl = supabase.storage.from('product-images').getPublicUrl(imagePath).data.publicUrl
    }

    const productData = {
      name: form.name.trim(),
      type: form.type.trim(),
      category: form.category,
      price: Number(form.price),
      size: form.size.trim(),
      needs: form.needs.length ? form.needs : ['Moisture'],
      badge: form.badge,
      image_url: imageUrl,
      image_path: imagePath,
      description: form.description.trim(),
      ingredients: form.ingredients.trim(),
      directions: form.directions.trim(),
      benefits: form.benefits.split('\n').map((item) => item.trim()).filter(Boolean),
      card_color: form.cardColor,
      stock: Math.max(0, Number(form.stock) || 0),
      active: form.active,
      updated_at: new Date().toISOString(),
    }

    const request = editingProduct
      ? supabase.from('products').update(productData).eq('id', editingProduct.id)
      : supabase.from('products').insert({ id, ...productData })
    const { error: productError } = await request

    if (productError) {
      if (imageFile) await supabase.storage.from('product-images').remove([imagePath])
      setMessage(productError.message)
      setIsPublishing(false)
      return
    }

    if (editingProduct && imageFile && editingProduct.imagePath) {
      await supabase.storage.from('product-images').remove([editingProduct.imagePath])
    }
    const savedName = form.name.trim()
    const wasEditing = Boolean(editingProduct)
    resetProductEditor()
    await Promise.all([refreshProducts(), loadManagedProducts()])
    setMessage(wasEditing ? `${savedName} was updated.` : `${savedName} is now live in the shop.`)
    setIsPublishing(false)
  }

  async function removeCustomProductConfirmed(productId) {
    const product = managedProducts.find((item) => item.id === productId)
    if (!supabase || !product) return
    const { error: productError } = await supabase.from('products').delete().eq('id', productId)
    if (productError) {
      setMessage(productError.message)
      return
    }
    if (product.imagePath) await supabase.storage.from('product-images').remove([product.imagePath])
    if (editingProduct?.id === productId) resetProductEditor()
    await Promise.all([refreshProducts(), loadManagedProducts()])
    setMessage(`${product.name} was removed from the shop.`)
  }

  function removeCustomProduct(productId) {
    const product = managedProducts.find((item) => item.id === productId)
    if (!product) return
    setDeleteTarget({
      title: `Remove ${product.name}?`,
      description: 'This product will be removed from the shop and its uploaded image will be deleted.',
      confirmLabel: 'Remove product',
      action: () => removeCustomProductConfirmed(productId),
    })
  }

  async function importStarterCatalog() {
    if (!supabase || isImportingCatalog) return
    setIsImportingCatalog(true)
    setMessage('')
    setImportProgress('Preparing catalogue…')

    try {
      for (const [index, product] of defaultProducts.entries()) {
        setImportProgress(`Importing ${index + 1} of ${defaultProducts.length}: ${product.name}`)
        const imageResponse = await fetch(product.image)
        if (!imageResponse.ok) throw new Error(`Could not load the image for ${product.name}.`)
        const imageBlob = await imageResponse.blob()
        const extensionByType = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
        const extension = extensionByType[imageBlob.type] || 'jpg'
        const imagePath = `starter/${product.id}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(imagePath, imageBlob, { contentType: imageBlob.type, upsert: true })
        if (uploadError) throw uploadError

        const imageUrl = supabase.storage.from('product-images').getPublicUrl(imagePath).data.publicUrl
        const { error: productError } = await supabase.from('products').upsert({
          id: product.id,
          name: product.name,
          type: product.type,
          category: product.category,
          price: product.price,
          size: product.size,
          needs: product.needs,
          badge: product.badge,
          image_url: imageUrl,
          image_path: imagePath,
          description: product.description,
          ingredients: product.ingredients,
          directions: product.directions,
          benefits: product.benefits,
          card_color: product.cardColor,
          stock: starterCatalogStock[product.id] || 0,
          active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
        if (productError) throw productError
      }

      const { error: settingsError } = await supabase.from('catalog_settings').upsert({
        id: 'main',
        starter_catalog_imported: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      if (settingsError) throw settingsError

      await Promise.all([refreshProducts(), loadManagedProducts()])
      setImportProgress('')
      setMessage('Starter catalogue migrated to Supabase successfully.')
    } catch (error) {
      setImportProgress('')
      setMessage(error.message || 'The starter catalogue could not be imported.')
    } finally {
      setIsImportingCatalog(false)
    }
  }

  async function saveOrderStatus(orderId, newStatus) {
    if (!supabase) return
    setMessage('')
    setDatabaseOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, status: newStatus } : order
    )))
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) {
      setMessage(error.message)
      await loadOrders()
      return
    }
    await Promise.all([loadManagedProducts(), refreshProducts()])
    if (newStatus === 'Cancelled') setMessage('Order cancelled and its stock was restored.')
  }

  function updateOrderStatus(orderId, newStatus) {
    const currentOrder = databaseOrders.find((order) => order.id === orderId)
    if (newStatus === 'Cancelled' && currentOrder?.status !== 'Cancelled') {
      setCancellationTarget(currentOrder)
      return
    }
    saveOrderStatus(orderId, newStatus)
  }

  async function assignOrderRider(orderId, rider) {
    if (!supabase) return
    const deliveryRider = rider.trim()
    setMessage('')
    setDatabaseOrders((current) => current.map((order) => (
      order.id === orderId ? { ...order, deliveryRider } : order
    )))
    const { error } = await supabase
      .from('orders')
      .update({ delivery_rider: deliveryRider, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (error) {
      setMessage(error.message)
      await loadOrders()
      return
    }
    setMessage(deliveryRider ? `${deliveryRider} assigned to this delivery.` : 'Rider assignment cleared.')
  }

  async function confirmOrderCancellation() {
    if (!cancellationTarget || isCancellingOrder) return
    setIsCancellingOrder(true)
    await saveOrderStatus(cancellationTarget.id, 'Cancelled')
    setIsCancellingOrder(false)
    setCancellationTarget(null)
  }

  async function saveDeliveryZone(event) {
    event.preventDefault()
    if (!supabase || isSavingDeliveryZone || missingDeliveryZoneFields) return
    setIsSavingDeliveryZone(true)
    setMessage('')
    const { error } = await supabase.from('delivery_zones').upsert({
      region: deliveryZoneForm.region.trim(),
      city: deliveryZoneForm.city.trim(),
      fee: Number(deliveryZoneForm.fee),
      delivery_window: deliveryZoneForm.delivery_window.trim() || 'Confirmed after your order',
      active: true,
      cash_on_delivery: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'region,city' })
    if (error) setMessage(error.message)
    else {
      setDeliveryZoneForm({ region: '', city: '', fee: '', delivery_window: '1–3 business days' })
      setMessage('Delivery rule saved.')
      await loadDeliveryZones()
    }
    setIsSavingDeliveryZone(false)
  }

  async function removeDeliveryZoneConfirmed(zoneId) {
    if (!supabase) return
    const { error } = await supabase.from('delivery_zones').delete().eq('id', zoneId)
    if (error) setMessage(error.message)
    else {
      setMessage('Delivery rule removed.')
      await loadDeliveryZones()
    }
  }

  function removeDeliveryZone(zone) {
    setDeleteTarget({
      title: 'Remove this delivery rule?',
      description: `${zone.city || 'All cities'}, ${zone.region} will no longer have this delivery fee available at checkout.`,
      confirmLabel: 'Remove rule',
      action: () => removeDeliveryZoneConfirmed(zone.id),
    })
  }

  async function confirmDeleteTarget() {
    if (!deleteTarget?.action || isDeleting) return
    setIsDeleting(true)
    await deleteTarget.action()
    setIsDeleting(false)
    setDeleteTarget(null)
  }

  async function toggleNotificationCentre() {
    const willOpen = !notificationsOpen
    setNotificationsOpen(willOpen)
    if (!willOpen || !unreadAdminNotifications.length || !supabase) return
    const readAt = new Date().toISOString()
    setAdminNotifications((current) => current.map((notification) => (
      notification.read_at ? notification : { ...notification, read_at: readAt }
    )))
    await supabase.from('notifications').update({ read_at: readAt }).is('read_at', null)
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'sales', label: 'Sales & Reports', icon: BarChart3 },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'delivery', label: 'Delivery', icon: MapPin },
    { id: 'add-product', label: 'Add Product', icon: PackagePlus },
  ]

  return (
    <main className="admin-bento-page">
      <div className="admin-bento-frame">
        {/* Top Bar matching the inspiration */}
        <header className="admin-topbar">
          <div className="admin-topbar-greeting">
            <div className={`admin-sunburst-logo${isUtcNight ? ' is-night' : ''}`} aria-label={isUtcNight ? 'Night time in UTC' : 'Day time in UTC'}>
              {isUtcNight ? <Moon size={42} strokeWidth={1.8} /> : <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, index) => (
                  <rect
                    key={index}
                    x="22"
                    y="3"
                    width="4"
                    height="12"
                    rx="2"
                    fill="currentColor"
                    transform={`rotate(${index * 30} 24 24)`}
                  />
                ))}
              </svg>}
            </div>
            <div>
              <h1>Hello, {adminFirstName}!</h1>
              <p>Explore store performance, product sales and catalogue activity</p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-search-pill">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  if (activeSection === 'dashboard' && event.target.value.trim()) {
                    setActiveSection('sales')
                  }
                }}
                placeholder="Search products, orders..."
                aria-label="Search admin products and orders"
              />
              <button
                type="button"
                aria-label="Search"
                onClick={() => {
                  if (searchQuery.trim() && activeSection === 'dashboard') {
                    setActiveSection('sales')
                  }
                }}
              >
                <Search size={16} />
              </button>
            </div>

            <button
              type="button"
              className="admin-icon-circle"
              title="Add product"
              aria-label="Add product"
              onClick={() => setActiveSection('add-product')}
            >
              <Plus size={20} strokeWidth={2.2} />
            </button>

            <div className="admin-notification-wrap">
              <button
                type="button"
                className={`admin-icon-circle${inventoryAlerts.length || unreadAdminNotifications.length ? ' has-dot' : ''}`}
                title="Store notifications"
                aria-label="Store notifications"
                aria-expanded={notificationsOpen}
                onClick={toggleNotificationCentre}
              >
                <Bell size={18} />
              </button>
              {notificationsOpen && (
                <div className="admin-notification-popover">
                  <div className="admin-notification-header">
                    <strong>Store notifications</strong>
                    <span>{inventoryAlerts.length + unreadAdminNotifications.length}</span>
                  </div>
                  <ul>
                    {adminNotifications.slice(0, 3).map((notification) => (
                      <li key={notification.id}>
                        <span className={`dot ${notification.read_at ? 'green' : 'red'}`} />
                        <div>
                          <strong>{notification.title}</strong>
                          <small>{notification.message}</small>
                        </div>
                      </li>
                    ))}
                    {inventoryAlerts.slice(0, 5).map((product) => (
                      <li key={product.id}>
                        <span className={`dot ${product.stock === 0 ? 'red' : 'gold'}`} />
                        <div>
                          <strong>{product.name}</strong>
                          <small>{product.stock === 0 ? 'Out of stock' : `Only ${product.stock} units remaining`}</small>
                        </div>
                      </li>
                    ))}
                    {!adminNotifications.length && !inventoryAlerts.length && !notificationError && (
                      <li>
                        <span className="dot green" />
                        <div>
                          <strong>Inventory looks healthy</strong>
                          <small>No products are below 6 units.</small>
                        </div>
                      </li>
                    )}
                    {notificationError && <li><div><small>{notificationError}</small></div></li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Section switcher pills for fast mobile & desktop clarity */}
        <div className="admin-section-pills" role="tablist" aria-label="Admin sections">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeSection === id}
              className={activeSection === id ? 'active' : ''}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        {adminLoadError && <RetryState compact title="Some admin data could not be loaded." message={adminLoadError} onRetry={retryAdminData} />}

        {/* Main Workspace: Left Vertical Pill Sidebar + Right Content Area */}
        <div className="admin-workspace-grid">
          <aside className="admin-sidebar-rail" aria-label="Admin navigation">
            <div className="admin-rail-top">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`admin-rail-btn ${activeSection === id ? 'active' : ''}`}
                  onClick={() => setActiveSection(id)}
                  title={label}
                  aria-label={label}
                >
                  <Icon size={19} />
                  <span className="admin-rail-tooltip">{label}</span>
                </button>
              ))}
            </div>

            <div className="admin-rail-bottom">
              <button
                type="button"
                className="admin-rail-btn"
                title="View Storefront"
                aria-label="View Storefront"
                onClick={() => navigate('/shop')}
              >
                <Eye size={18} />
                <span className="admin-rail-tooltip">View Shop</span>
              </button>
              <button
                type="button"
                className="admin-rail-btn"
                title="Exit to Home"
                aria-label="Exit to Home"
                onClick={() => navigate('/')}
              >
                <LogOut size={18} />
                <span className="admin-rail-tooltip">Back to Store</span>
              </button>
              <Link to="/account" className="admin-rail-avatar" title="Admin Profile">
                {profile.photo ? (
                  <img src={profile.photo} alt={adminFullName} />
                ) : (
                  <span>{adminFirstName.slice(0, 2).toUpperCase()}</span>
                )}
              </Link>
            </div>
          </aside>

          <div className="admin-main-canvas">
            {/* ==================== 1. DASHBOARD OVERVIEW ==================== */}
            {activeSection === 'dashboard' && (
              <div className="admin-bento-dashboard">
                {/* Top 4 KPI Cards */}
                <div className="admin-kpi-row">
                  <article className="admin-kpi-card">
                    <div>
                      <span className="admin-kpi-label">Sales this {timeframe === 'Monthly' ? 'month' : 'quarter'}</span>
                      <strong className="admin-kpi-value">{formatMoney(periodRevenue)}</strong>
                    </div>
                    <div className="admin-mini-bars" aria-hidden="true">
                      {miniBarValues.map((value, index) => (
                        <span
                          key={index}
                          className={index % 2 ? 'dark' : ''}
                          style={{ height: `${Math.max(12, Math.round((value / miniBarMaximum) * 100))}%` }}
                        />
                      ))}
                    </div>
                  </article>

                  <article className="admin-kpi-card" onClick={() => setActiveSection('orders')} style={{ cursor: 'pointer' }}>
                    <div className="admin-kpi-icon-group">
                      <span className="admin-soft-circle sage">
                        <Users size={18} />
                      </span>
                      <div>
                        <span className="admin-kpi-label">Orders this {timeframe === 'Monthly' ? 'month' : 'quarter'}</span>
                        <strong className="admin-kpi-value">{periodOrders.length}</strong>
                      </div>
                    </div>
                    <svg className="admin-mini-spark" viewBox="0 0 80 36" fill="none" aria-hidden="true">
                      <path
                        d={createTrendPath(revenueSeries, 80, 36, 4)}
                        stroke="#6b7f70"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </article>

                  <article className="admin-kpi-card" onClick={() => setActiveSection('sales')} style={{ cursor: 'pointer' }}>
                    <div className="admin-kpi-icon-group">
                      <span className="admin-soft-circle sand">
                        <ShoppingBag size={18} />
                      </span>
                      <div>
                        <span className="admin-kpi-label">Avg. order value</span>
                        <strong className="admin-kpi-value">{formatMoney(avgOrderValue)}</strong>
                      </div>
                    </div>
                  </article>

                  <article className="admin-kpi-card featured-sage" onClick={() => setActiveSection('sales')} style={{ cursor: 'pointer' }}>
                    <div>
                      <span className="admin-kpi-label">All-time sales</span>
                      <strong className="admin-kpi-value">{formatMoney(totalCatalogRevenue)}</strong>
                    </div>
                    <svg className="admin-mini-wave" viewBox="0 0 96 42" fill="none" aria-hidden="true">
                      <path
                        d="M4 34 C12 10, 24 8, 36 24 C46 38, 56 34, 66 18 C74 8, 84 12, 92 12"
                        stroke="rgba(255, 254, 250, 0.86)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </article>
                </div>

                {/* Middle Row: Balance/Revenue Wave + Target Gauge + Admin Profile */}
                <div className="admin-middle-row">
                  <article className="admin-bento-card admin-balance-card">
                    <div className="admin-card-head">
                      <div className="admin-balance-title">
                        <h2>Store Revenue</h2>
                        <span className="admin-ontrack-badge">
                          <Check size={12} /> Live data
                        </span>
                      </div>
                      <button
                        type="button"
                        className="admin-timeframe-btn"
                        onClick={() => setTimeframe((curr) => (curr === 'Monthly' ? 'Quarterly' : 'Monthly'))}
                      >
                        <span>{timeframe}</span>
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="admin-balance-subcards">
                      <div className="admin-stat-box">
                          <span className="label">Returning customers</span>
                          <div className="value-row">
                          <strong>{returningCustomerRate.toFixed(1)}%</strong>
                          <span className="admin-pill-delta neutral">This {timeframe === 'Monthly' ? 'month' : 'quarter'}</span>
                        </div>
                      </div>
                      <div className="admin-stat-box">
                        <span className="label">Gross Product Sales</span>
                        <div className="value-row">
                          <strong>{formatMoney(periodRevenue)}</strong>
                          <span className={`admin-pill-delta ${revenueChange.direction}`}>{revenueChange.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="admin-wave-chart-wrap" aria-hidden="true">
                      <svg viewBox="0 0 600 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="adminWaveGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#657b6b" stopOpacity="0.24" />
                            <stop offset="100%" stopColor="#657b6b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={revenueAreaPath}
                          fill="url(#adminWaveGrad)"
                        />
                        <path
                          d={revenueTrendPath}
                          fill="none"
                          stroke="#5b7161"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </article>

                  <article className="admin-bento-card admin-earnings-card">
                    <div className="admin-earnings-copy">
                      <h2>Fulfilment rate</h2>
                      <span className="sub">Delivered non-cancelled orders</span>
                      <strong className="amount">{fulfilmentRate}%</strong>
                      <p>{revenueOrders.filter((order) => order.status === 'Delivered').length} of {revenueOrders.length} active orders delivered</p>
                    </div>

                    <div className="admin-gauge-wrap" aria-hidden="true">
                      <svg viewBox="0 0 200 110">
                        <path
                          d="M 22 102 A 78 78 0 0 1 178 102"
                          fill="none"
                          stroke="#e6ece8"
                          strokeWidth="22"
                          strokeLinecap="butt"
                        />
                        <path
                          d="M 22 102 A 78 78 0 0 1 178 102"
                          fill="none"
                          stroke="#667b6c"
                          strokeWidth="22"
                          strokeLinecap="butt"
                          strokeDasharray={`${(fulfilmentRate / 100) * 245} 245`}
                        />
                      </svg>
                      <strong className="admin-gauge-value">{fulfilmentRate}%</strong>
                    </div>
                  </article>

                  <article className="admin-bento-card admin-profile-card">
                    <div className="admin-profile-avatar">
                      {profile.photo ? (
                        <img src={profile.photo} alt={adminFullName} />
                      ) : (
                        <span aria-hidden="true">{adminFirstName.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <h3>{adminFullName}</h3>
                    <span className="email">{adminEmail}</span>

                    <div className="admin-profile-stats">
                      <div>
                        <span>Products</span>
                        <strong>{allProducts.length}</strong>
                      </div>
                      <div>
                        <span>Orders</span>
                        <strong>{allOrders.length}</strong>
                      </div>
                      <div>
                        <span>Needs</span>
                        <strong>{hairNeeds.length}</strong>
                      </div>
                    </div>
                  </article>
                </div>

                {/* Bottom Row: Catalogue Card Stack + Recent Orders + Storefront Sync */}
                <div className="admin-bottom-row">
                  <article className="admin-bento-card admin-wallet-card">
                    <div className="admin-wallet-copy">
                      <h2>Collection &amp; Product Studio</h2>
                      <p>
                        Curate purposeful hair-care essentials for curls, coils and locs. Publish new
                        formulas directly to the storefront catalogue with instant pricing and routine tags.
                      </p>
                      <button
                        type="button"
                        className="admin-sage-btn"
                        onClick={() => setActiveSection('add-product')}
                      >
                        Add New Product +
                      </button>
                    </div>

                    <div className="admin-card-stack" aria-hidden="true" onClick={() => setActiveSection('add-product')}>
                      <div className="stack-card card-top">
                        <div className="stack-card-head">
                          <span>APA TERRA</span>
                          <small>300 ML</small>
                        </div>
                        <strong>MOISTURE WASH</strong>
                        <div className="stack-card-foot">
                          <span>HYDRATING SHAMPOO</span>
                          <b>GHS 95</b>
                        </div>
                      </div>
                      <div className="stack-card card-mid">
                        <div className="stack-card-head">
                          <span>APA TERRA</span>
                          <small>50 ML</small>
                        </div>
                        <strong>ROOTED SCALP DROPS</strong>
                        <div className="stack-card-foot">
                          <span>SCALP &amp; HAIR OIL</span>
                          <b>GHS 85</b>
                        </div>
                      </div>
                      <div className="stack-card card-bot">
                        <div className="stack-card-head">
                          <span>APA TERRA</span>
                          <small>250 ML</small>
                        </div>
                        <strong>SOFTENING TREATMENT</strong>
                        <div className="stack-card-foot">
                          <span>DEEP TREATMENT</span>
                          <b>GHS 120</b>
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className="admin-bento-card admin-transfers-card">
                    <div className="admin-card-head">
                      <h2>Recent Orders</h2>
                      <button
                        type="button"
                        className="admin-text-btn"
                        onClick={() => setActiveSection('orders')}
                      >
                        See all
                      </button>
                    </div>

                    <div className="admin-transfer-list">
                      {allOrders.slice(0, 3).map((order) => (
                        <div
                          className="admin-transfer-item"
                          key={order.reference}
                          onClick={() => setActiveSection('orders')}
                        >
                          <span className={`bar ${order.status === 'Cancelled' ? 'clay' : 'sage'}`} />
                          <div className="info">
                            <strong>From {order.customer}</strong>
                            <small>
                              {order.timeLabel} • {order.reference}
                            </small>
                          </div>
                          <span className={`admin-pill-delta ${order.status === 'Cancelled' ? 'negative' : 'positive'}`}>
                            {formatMoney(order.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="admin-bento-card admin-security-card">
                    <div className="admin-fingerprint-icon">
                      <Fingerprint size={46} strokeWidth={1.5} />
                    </div>
                    <h3>Storefront Synced!</h3>
                    <p>Catalogue &amp; inventory reports are live across this browser</p>
                    <button
                      type="button"
                      className="admin-sage-btn"
                      onClick={() => setActiveSection('sales')}
                    >
                      View Sales Report
                    </button>
                  </article>
                </div>
              </div>
            )}

            {/* ==================== 2. SALES & REPORTS SECTION ==================== */}
            {activeSection === 'sales' && (
              <div className="admin-section-view">
                <div className="admin-section-header">
                  <div>
                    <span className="admin-eyebrow">Analytics &amp; Product Performance</span>
                    <h2>Product Sales &amp; Revenue Report</h2>
                  </div>
                  <button
                    type="button"
                    className="admin-sage-btn"
                    onClick={() => setActiveSection('add-product')}
                  >
                    <Plus size={15} /> Add New Product
                  </button>
                </div>

                <div className="admin-kpi-row">
                  <article className="admin-kpi-card">
                    <div>
                      <span className="admin-kpi-label">All-time sales</span>
                      <strong className="admin-kpi-value">{formatMoney(totalCatalogRevenue)}</strong>
                    </div>
                    <span className={`admin-pill-delta ${revenueChange.direction}`}>{revenueChange.label} this {timeframe === 'Monthly' ? 'month' : 'quarter'}</span>
                  </article>
                  <article className="admin-kpi-card">
                    <div>
                      <span className="admin-kpi-label">Total Units Sold</span>
                      <strong className="admin-kpi-value">{totalUnitsSold} units</strong>
                    </div>
                    <span className={`admin-pill-delta ${unitsChange.direction}`}>{unitsChange.label} this {timeframe === 'Monthly' ? 'month' : 'quarter'}</span>
                  </article>
                  <article className="admin-kpi-card">
                    <div>
                      <span className="admin-kpi-label">Best Seller</span>
                      <strong className="admin-kpi-value">{bestSeller?.name || 'No sales yet'}</strong>
                    </div>
                    <span className={`admin-pill-delta ${bestSeller ? 'positive' : 'neutral'}`}>
                      {bestSeller ? `${bestSeller.units} sold` : '—'}
                    </span>
                  </article>
                  <article className="admin-kpi-card featured-sage">
                    <div>
                      <span className="admin-kpi-label">Active Catalogue SKUs</span>
                      <strong className="admin-kpi-value">{allProducts.length} Products</strong>
                    </div>
                    <Sparkles size={22} />
                  </article>
                </div>

                <div className="admin-reports-grid">
                  <article className="admin-bento-card admin-sales-table-card">
                    <div className="admin-card-head">
                      <div>
                        <h2>Sales by Product</h2>
                        <p className="admin-card-sub">
                          Showing {filteredSales.length} of {productSales.length} products in catalogue
                        </p>
                      </div>
                      {searchQuery && (
                        <button
                          type="button"
                          className="admin-text-btn"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear search
                        </button>
                      )}
                    </div>

                    <div className="admin-table-scroll">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Unit Price</th>
                            <th>Units Sold</th>
                            <th>Revenue</th>
                            <th>Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSales.map((item) => {
                            const revenueShare = Math.min(
                              100,
                              Math.round((item.revenue / (totalCatalogRevenue || 1)) * 100)
                            )
                            return (
                              <tr key={item.id}>
                                <td>
                                  <div className="admin-table-product">
                                    <img src={item.image} alt={item.name} />
                                    <div>
                                      <strong>{item.name}</strong>
                                      <small>
                                        {item.size} • {item.type}
                                      </small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className="admin-category-tag">{item.category}</span>
                                </td>
                                <td>{formatMoney(item.price)}</td>
                                <td>
                                  <strong>{item.units}</strong>{' '}
                                  {item.stock !== null && item.stock !== undefined && (
                                    <small className={item.stock === 0 ? 'stock-out' : item.stock <= 5 ? 'stock-low' : ''}>
                                      ({item.stock} in stock)
                                    </small>
                                  )}
                                </td>
                                <td>
                                  <div className="admin-revenue-cell">
                                    <strong>{formatMoney(item.revenue)}</strong>
                                    <div className="admin-progress-track">
                                      <span style={{ width: `${revenueShare}%` }} />
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className={`admin-pill-delta ${item.trend.direction}`}
                                  >
                                    {item.trend.label}
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </article>

                  <article className="admin-bento-card admin-category-breakdown">
                    <h2>Category Share</h2>
                    <p className="admin-card-sub">Revenue contribution by product line</p>

                    <div className="admin-category-bars">
                      {categoryPerformance.length ? categoryPerformance.map((cat) => {
                        const pct = Math.round((cat.revenue / (totalCatalogRevenue || 1)) * 100)
                        return (
                          <div className="admin-cat-row" key={cat.category}>
                            <div className="admin-cat-head">
                              <strong>{cat.category}</strong>
                              <span>
                                {formatMoney(cat.revenue)} ({pct}%)
                              </span>
                            </div>
                            <div className="admin-progress-track large">
                              <span style={{ width: `${pct}%` }} />
                            </div>
                            <small>
                              {cat.units} units across {cat.count} {cat.count === 1 ? 'product' : 'products'}
                            </small>
                          </div>
                        )
                      }) : <p className="admin-card-sub">Category performance will appear after the first order.</p>}
                    </div>
                  </article>
                </div>
              </div>
            )}

            {activeSection === 'delivery' && (
              <div className="admin-section-view">
                <div className="admin-section-header">
                  <div>
                    <span className="admin-eyebrow">Delivery operations</span>
                    <h2>Delivery Rules</h2>
                    <p className="admin-card-sub">Set cash-on-delivery fees and delivery windows by region or city.</p>
                  </div>
                </div>

                <div className="admin-delivery-grid">
                  <form className="admin-bento-card admin-delivery-form" onSubmit={saveDeliveryZone}>
                    <h3>Add delivery rule</h3>
                    <p>Leave the city blank to create a region-wide fallback fee.</p>
                    <label><span>Region <small>Required</small></span><input required value={deliveryZoneForm.region} onChange={(event) => setDeliveryZoneForm((current) => ({ ...current, region: event.target.value }))} placeholder="e.g. Greater Accra" /></label>
                    <label><span>City <small>Optional</small></span><input value={deliveryZoneForm.city} onChange={(event) => setDeliveryZoneForm((current) => ({ ...current, city: event.target.value }))} placeholder="e.g. Accra" /></label>
                    <label><span>Delivery fee (GHS) <small>Required</small></span><input required type="number" min="0" step="0.01" value={deliveryZoneForm.fee} onChange={(event) => setDeliveryZoneForm((current) => ({ ...current, fee: event.target.value }))} placeholder="0.00" /></label>
                    <label><span>Delivery window <small>Required</small></span><input required value={deliveryZoneForm.delivery_window} onChange={(event) => setDeliveryZoneForm((current) => ({ ...current, delivery_window: event.target.value }))} placeholder="e.g. 1–3 business days" /></label>
                    <button type="submit" className="admin-sage-btn" disabled={isSavingDeliveryZone || Boolean(missingDeliveryZoneFields)}>{isSavingDeliveryZone ? 'Saving…' : 'Save delivery rule'}</button>
                  </form>

                  <article className="admin-bento-card admin-delivery-list">
                    <div className="admin-card-head"><div><h3>Active cash-on-delivery areas</h3><p className="admin-card-sub">City rules take priority over region-wide rules.</p></div><span>{deliveryZones.length} rules</span></div>
                    {deliveryZones.length ? <div className="admin-delivery-rules">
                      {deliveryZones.map((zone) => <div key={zone.id}>
                        <div><strong>{zone.city || 'All cities'}, {zone.region}</strong><small>{zone.delivery_window}</small></div>
                        <b>{formatMoney(zone.fee)}</b>
                        <button type="button" onClick={() => removeDeliveryZone(zone)} aria-label={`Remove delivery rule for ${zone.city || zone.region}`}><Trash2 size={16} /></button>
                      </div>)}
                    </div> : <p className="admin-card-sub">No rules yet. Checkout will continue to confirm delivery costs separately.</p>}
                  </article>
                </div>
                {message && <p className={message.includes('saved') || message.includes('removed') ? 'admin-order-feedback success' : 'admin-order-feedback error'} role="status">{message}</p>}
              </div>
            )}

            {/* ==================== 3. ORDERS MANAGEMENT SECTION ==================== */}
            {activeSection === 'orders' && (
              <div className="admin-section-view">
                <div className="admin-section-header">
                  <div>
                    <span className="admin-eyebrow">Fulfilment &amp; Dispatch</span>
                    <h2>Customer Orders ({filteredOrders.length})</h2>
                  </div>
                  <div className="admin-filter-pills">
                    {['All', ...orderStatuses].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={orderFilter === status ? 'active' : ''}
                        onClick={() => setOrderFilter(status)}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {message && (
                  <p
                    className={`admin-order-feedback${message.includes('stock was restored') ? ' success' : ' error'}`}
                    role="status"
                  >
                    {message}
                  </p>
                )}

                <div className="admin-orders-list">
                  {filteredOrders.map((order) => (
                    <article className="admin-bento-card admin-order-card" key={order.reference}>
                      <div className="admin-order-top">
                        <div className="admin-order-id">
                          <span className="ref-badge">{order.reference}</span>
                          <strong>{order.customer}</strong>
                          <small>{order.email} • {order.city}</small>
                        </div>

                        <div className="admin-order-meta">
                          <span className="time">{order.timeLabel}</span>
                          <strong className="total">{formatMoney(order.subtotal)}</strong>
                        </div>
                      </div>

                      <div className="admin-order-items">
                        {order.items.map((item, idx) => (
                          <span className="admin-order-chip" key={`${order.reference}-${idx}`}>
                            <strong>{item.quantity || 1}×</strong> {item.name} ({formatMoney(item.price)})
                          </span>
                        ))}
                      </div>

                        <div className="admin-order-foot">
                        <span className="payment-tag">
                          <CreditCard size={14} />{' '}
                          {order.paymentMethod === 'momo'
                            ? 'Mobile Money'
                            : order.paymentMethod === 'card'
                              ? 'Card Payment'
                              : 'Pay on Delivery'}
                        </span>

                        <div className="admin-rider-control">
                          <span>Rider:</span>
                          <AdminSelect
                            label={null}
                            value={order.deliveryRider}
                            options={riderOptions}
                            placeholder="Assign rider"
                            compact
                            disabled={order.status === 'Cancelled'}
                            onChange={(rider) => assignOrderRider(order.id, rider)}
                          />
                        </div>
                        <div className="admin-status-control">
                          <span>Status:</span>
                          <AdminSelect
                            label={null}
                            value={order.status}
                            options={orderStatuses}
                            placeholder="Select status"
                            compact
                            allowCustom={false}
                            disabled={order.status === 'Cancelled'}
                            onChange={(status) => updateOrderStatus(order.id, status)}
                          />
                        </div>
                        <button type="button" className="admin-order-details" onClick={() => setSelectedOrder(order)}>View order details</button>
                      </div>
                    </article>
                  ))}

                  {!filteredOrders.length && (
                    <div className="admin-bento-card admin-empty-state">
                      <Package size={32} />
                      <h3>No matching orders</h3>
                      <p>Try clearing your search filter or switching status tabs.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== 4. ADD & MANAGE PRODUCTS SECTION ==================== */}
            {activeSection === 'add-product' && (
              <div className="admin-section-view">
                <div className="admin-section-header">
                  <div>
                    <span className="admin-eyebrow">Catalogue Studio</span>
                    <h2>Add &amp; Manage Storefront Products</h2>
                  </div>
                  <div className="admin-section-actions">
                    {!starterImported && (
                      <button type="button" className="admin-import-btn" onClick={importStarterCatalog} disabled={isImportingCatalog}>
                        <Database size={15} />
                        {isImportingCatalog ? importProgress || 'Importing…' : 'Import starter catalogue'}
                      </button>
                    )}
                    <Link to="/shop" className="admin-sage-btn">
                      View Live Shop <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>

                <div className="admin-studio-layout">
                  <form ref={productFormRef} className="admin-product-form admin-bento-form" onSubmit={saveProduct}>
                    <header>
                      <div>
                        <p className="eyebrow">{editingProduct ? 'Editing product' : 'New product'}</p>
                        <h2>{editingProduct ? `Update ${editingProduct.name}` : 'Product details'}</h2>
                      </div>
                      <span>
                        <Leaf size={17} /> {editingProduct ? 'Live catalogue item' : 'Storefront draft'}
                      </span>
                    </header>

                    <div className="admin-fields">
                      <label>
                        <span>Product name <small>Required</small></span>
                        <input
                          name="name"
                          value={form.name}
                          onChange={updateField}
                          placeholder="e.g. Nourish Cream"
                        />
                      </label>
                      <AdminSelect
                        label="Product type · Required"
                        value={form.type}
                        options={productTypes}
                        placeholder="Select product type"
                        onChange={(type) => {
                          setForm((current) => ({ ...current, type }))
                          setMessage('')
                        }}
                      />
                      <AdminSelect
                        label="Category"
                        value={form.category}
                        options={categories.filter((item) => item !== 'All')}
                        placeholder="Select category"
                        onChange={(category) => {
                          setForm((current) => ({ ...current, category }))
                          setMessage('')
                        }}
                      />
                      <label>
                        <span>Price (GHS) <small>Required</small></span>
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.price}
                          onChange={updateField}
                          placeholder="0.00"
                        />
                      </label>
                      <label>
                        <span>Opening stock</span>
                        <input
                          name="stock"
                          type="number"
                          min="0"
                          step="1"
                          value={form.stock}
                          onChange={updateField}
                          placeholder="0"
                        />
                      </label>
                      <AdminSelect
                        label="Size · Required"
                        value={form.size}
                        options={sizes}
                        placeholder="Select size"
                        onChange={(size) => {
                          setForm((current) => ({ ...current, size }))
                          setMessage('')
                        }}
                      />
                      <AdminSelect
                        label="Badge"
                        value={form.badge}
                        options={badges}
                        placeholder="Select badge"
                        onChange={(badge) => {
                          setForm((current) => ({ ...current, badge }))
                          setMessage('')
                        }}
                      />
                      <label className="admin-full">
                        <span>Product image <small>Required</small></span>
                        <input
                          className="admin-image-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={updateImage}
                        />
                        <small className="admin-image-help">
                          {imageName
                            ? `Selected: ${imageName}`
                            : editingProduct
                              ? 'Choose a new image only if you want to replace the current one.'
                              : 'Choose a JPG, PNG or WebP image (up to 10 MB).'}
                        </small>
                      </label>
                      <label className="admin-full">
                        <span>Description <small>Required</small></span>
                        <textarea
                          name="description"
                          rows="3"
                          value={form.description}
                          onChange={updateField}
                          placeholder="A concise description for the collection."
                        />
                      </label>
                      <label>
                        <span>Key ingredients</span>
                        <textarea
                          name="ingredients"
                          rows="3"
                          value={form.ingredients}
                          onChange={updateField}
                          placeholder="Shea butter, baobab oil…"
                        />
                      </label>
                      <label>
                        <span>How to use</span>
                        <textarea
                          name="directions"
                          rows="3"
                          value={form.directions}
                          onChange={updateField}
                          placeholder="Apply to clean, damp hair…"
                        />
                      </label>
                      <label className="admin-full">
                        <span>
                          Benefits <small>(one per line)</small>
                        </span>
                        <textarea
                          name="benefits"
                          rows="3"
                          value={form.benefits}
                          onChange={updateField}
                          placeholder={'Defines curls\nHelps seal in moisture'}
                        />
                      </label>
                    </div>

                    <fieldset className="admin-needs">
                      <legend>Hair needs</legend>
                      <div>
                        {hairNeeds.map(({ name }) => (
                          <label key={name}>
                            <input
                              type="checkbox"
                              checked={form.needs.includes(name)}
                              onChange={() => toggleNeed(name)}
                            />
                            <span>{name}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <label className="admin-visibility-toggle">
                      <input
                        type="checkbox"
                        checked={form.active}
                        onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                      />
                      <span>
                        <strong>Visible in the shop</strong>
                        <small>Turn this off to hide the product without deleting it.</small>
                      </span>
                    </label>

                    <footer>
                      {message && (
                        <p className={/(live|updated|removed|migrated)/.test(message) ? 'success' : 'error'} role="status">
                          {/(live|updated|removed|migrated)/.test(message) && <Check size={15} />}
                          {message}
                        </p>
                      )}
                      <div className="admin-form-actions">
                        {editingProduct && <button type="button" className="admin-cancel-edit" onClick={resetProductEditor}><X size={15} /> Cancel</button>}
                        <button type="submit" disabled={isPublishing || Boolean(missingProductFields) || !productHasChanges}>
                          {isPublishing ? 'Saving…' : editingProduct ? 'Save changes' : 'Publish product'}
                          {editingProduct ? <Check size={16} /> : <PackagePlus size={16} />}
                        </button>
                      </div>
                    </footer>
                  </form>

                  {/* Right Side: Live Card Preview & Custom Products Manager */}
                  <div className="admin-studio-sidebar">
                    <article className="admin-bento-card admin-preview-card">
                      <span className="admin-eyebrow">Live Preview</span>
                      <h3>Storefront Card</h3>
                      <div className="admin-live-product-preview">
                        <div className="preview-img-box">
                          {form.image ? (
                            <img src={form.image} alt={form.name || 'Preview'} />
                          ) : (
                            <div className="preview-placeholder">
                              <PackagePlus size={28} />
                              <span>Upload image to preview</span>
                            </div>
                          )}
                          <span className="preview-badge">{form.badge || 'New'}</span>
                        </div>
                        <div className="preview-copy">
                          <small>{form.type || 'Botanical Formula'} • {form.size || '250 ml'}</small>
                          <strong>{form.name || 'Your Product Name'}</strong>
                          <p>{form.description || 'Your product description will appear here in the shop.'}</p>
                          <div className="preview-foot">
                            <b>{form.price ? formatMoney(Number(form.price)) : 'GHS 0.00'}</b>
                            <span>{form.category}</span>
                          </div>
                        </div>
                      </div>
                    </article>

                    <article className="admin-bento-card admin-custom-list-card">
                      <div className="admin-card-head">
                        <h3>Managed Products ({managedProducts.length})</h3>
                        <span>Supabase catalogue</span>
                      </div>
                      {managedProducts.length ? (
                        <ul className="admin-custom-items">
                          {managedProducts.map((item) => (
                            <li key={item.id}>
                              <img src={item.image} alt={item.name} />
                              <div>
                                <strong>{item.name}</strong>
                                <small className={item.stock === 0 ? 'stock-out' : item.stock <= 5 ? 'stock-low' : ''}>
                                  {formatMoney(item.price)} • {item.size} • {item.stock} in stock
                                </small>
                                {!item.active && <span className="admin-hidden-product">Hidden</span>}
                              </div>
                              <button
                                type="button"
                                className="admin-edit-btn"
                                title={`Edit ${item.name}`}
                                aria-label={`Edit ${item.name}`}
                                onClick={() => editProduct(item)}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                type="button"
                                className="admin-delete-btn"
                                title={`Remove ${item.name}`}
                                aria-label={`Remove ${item.name}`}
                                onClick={() => removeCustomProduct(item.id)}
                              >
                                <Trash2 size={15} />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="admin-empty-note">
                          Products you publish with the form will appear here and in the Shop immediately.
                        </p>
                      )}
                    </article>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {cancellationTarget && (
        <div
          className="admin-confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isCancellingOrder) setCancellationTarget(null)
          }}
        >
          <section
            className="admin-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-order-title"
            aria-describedby="cancel-order-description"
          >
            <button
              type="button"
              className="admin-confirm-close"
              aria-label="Keep order and close"
              disabled={isCancellingOrder}
              onClick={() => setCancellationTarget(null)}
            >
              <X size={18} />
            </button>
            <span className="admin-confirm-icon"><RotateCcw size={22} /></span>
            <p className="admin-eyebrow">Inventory action</p>
            <h2 id="cancel-order-title">Cancel this order?</h2>
            <p id="cancel-order-description">
              The items in <strong>{cancellationTarget.reference}</strong> will be returned to stock. This order cannot be reopened afterward.
            </p>
            <div className="admin-confirm-summary">
              <span><Package size={16} /> {cancellationTarget.items.reduce((total, item) => total + Number(item.quantity || 1), 0)} items</span>
              <strong>{formatMoney(cancellationTarget.subtotal)}</strong>
            </div>
            <div className="admin-confirm-actions">
              <button
                type="button"
                className="admin-confirm-keep"
                disabled={isCancellingOrder}
                autoFocus
                onClick={() => setCancellationTarget(null)}
              >
                Keep order
              </button>
              <button
                type="button"
                className="admin-confirm-cancel"
                disabled={isCancellingOrder}
                onClick={confirmOrderCancellation}
              >
                {isCancellingOrder ? 'Cancelling…' : 'Cancel & restore stock'}
              </button>
            </div>
          </section>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.title}
        description={deleteTarget?.description}
        confirmLabel={deleteTarget?.confirmLabel}
        busy={isDeleting}
        onConfirm={confirmDeleteTarget}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />
      <OrderDetailsDialog order={selectedOrder} admin onClose={() => setSelectedOrder(null)} />
    </main>
  )
}
