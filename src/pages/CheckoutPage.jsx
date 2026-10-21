import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, MapPin, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductVisual from '../components/ProductVisual'
import { useCart } from '../context/cart-store'
import { useAuth } from '../context/auth-store'
import { formatMoney } from '../data/catalog'
import { supabase } from '../lib/supabase'

const regions = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
  'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West',
  'Volta', 'Western', 'Western North',
]

function CheckoutRegionSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const fieldRef = useRef(null)
  const matchingRegions = regions.filter((region) => region.toLowerCase().includes(query.trim().toLowerCase()))

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
    <div className="checkout-modern-select" ref={fieldRef}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span>{value || 'Select your region'}</span><ChevronDown size={17} />
      </button>
      {open && <div className="checkout-modern-select-options" role="listbox" aria-label="Region">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search region" autoFocus />
        {matchingRegions.map((region) => <button type="button" role="option" aria-selected={value === region} className={value === region ? 'selected' : ''} key={region} onClick={() => selectRegion(region)}><span>{region}</span>{value === region && <Check size={15} />}</button>)}
        {!matchingRegions.length && <p>No matching region.</p>}
      </div>}
    </div>
  )
}

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { profile: authProfile, user } = useAuth()
  const paymentMethod = 'delivery'
  const [orderReference, setOrderReference] = useState('')
  const [deliveryZones, setDeliveryZones] = useState([])
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formValues, setFormValues] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('apaterra-profile') || '{}')
      return { firstName: '', lastName: '', email: '', phone: '', region: '', city: '', address: '', landmark: '', notes: '', ...saved }
    } catch {
      return { firstName: '', lastName: '', email: '', phone: '', region: '', city: '', address: '', landmark: '', notes: '' }
    }
  })

  useEffect(() => {
    if (!authProfile && !user) return
    const syncProfile = window.setTimeout(() => {
      setFormValues((current) => ({
        ...current,
        firstName: authProfile?.first_name || user?.user_metadata?.first_name || current.firstName,
        lastName: authProfile?.last_name || user?.user_metadata?.last_name || current.lastName,
        email: authProfile?.email || user?.email || current.email,
        phone: authProfile?.phone || current.phone,
        region: authProfile?.region || current.region,
        city: authProfile?.city || current.city,
        address: authProfile?.address || current.address,
      }))
    }, 0)
    return () => window.clearTimeout(syncProfile)
  }, [authProfile, user])

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase
      .from('delivery_zones')
      .select('id, region, city, fee, delivery_window')
      .eq('active', true)
      .eq('cash_on_delivery', true)
      .then(({ data }) => {
        if (active) setDeliveryZones(data || [])
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!supabase || !user?.id) return undefined
    let active = true
    supabase
      .from('delivery_addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!active) return
        const addresses = data || []
        setSavedAddresses(addresses)
        const defaultAddress = addresses.find((address) => address.is_default) || addresses[0]
        if (defaultAddress) applySavedAddress(defaultAddress)
      })
    return () => { active = false }
  }, [user?.id])

  const deliveryZone = deliveryZones
    .filter((zone) => zone.region.toLowerCase() === formValues.region.trim().toLowerCase())
    .sort((a, b) => Number(Boolean(b.city)) - Number(Boolean(a.city)))
    .find((zone) => !zone.city || zone.city.toLowerCase() === formValues.city.trim().toLowerCase())
  const deliveryFee = Number(deliveryZone?.fee || 0)

  const requirements = [
    { key: 'firstName', label: 'First name', valid: formValues.firstName.trim().length > 0 },
    { key: 'lastName', label: 'Last name', valid: formValues.lastName.trim().length > 0 },
    { key: 'email', label: 'Valid email address', valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email.trim()) },
    { key: 'phone', label: 'Valid phone number', valid: formValues.phone.replace(/\D/g, '').length >= 9 },
    { key: 'region', label: 'Region', valid: formValues.region.length > 0 },
    { key: 'city', label: 'Town or city', valid: formValues.city.trim().length > 0 },
    { key: 'address', label: 'Delivery address', valid: formValues.address.trim().length > 0 },
  ]
  const missingFields = requirements.filter((field) => !field.valid)

  function updateField(event) {
    const { name, value } = event.target
    setFormValues((current) => ({ ...current, [name]: value }))
    setSubmitError('')
  }

  function applySavedAddress(address) {
    setSelectedAddressId(address.id)
    setFormValues((current) => ({
      ...current,
      phone: address.phone || current.phone,
      region: address.region || '',
      city: address.city || '',
      address: address.address || '',
      landmark: address.landmark || '',
    }))
    setSubmitError('')
  }

  async function submitOrder(event) {
    event.preventDefault()
    if (missingFields.length || !supabase || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError('')
    const { data, error } = await supabase.rpc('place_order', {
      p_customer: {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        email: formValues.email,
        phone: formValues.phone,
        region: formValues.region,
        city: formValues.city,
        address: formValues.address,
        landmark: formValues.landmark,
        notes: formValues.notes,
      },
      p_payment_method: paymentMethod,
      // The database resolves current product details and prices from these IDs.
      // Client-provided prices must never be trusted when stock is reserved.
      p_items: items.map(({ id, quantity }) => ({ id, quantity })),
    })

    if (error) {
      setSubmitError(error.message)
      setIsSubmitting(false)
      return
    }
    setOrderReference(data.reference)
    clearCart()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (orderReference) {
    return <main className="checkout-page checkout-state-page">
      <section className="checkout-confirmation">
        <span className="checkout-confirmation-icon"><Check size={28} /></span>
        <p className="eyebrow">Order request received</p>
        <h1>Thank you. Your order is being prepared.</h1>
        <p>Your reference is <strong>{orderReference}</strong>. We’ll use the contact details you provided to confirm your delivery details.</p>
        <div className="checkout-confirmation-note"><ShieldCheck size={18} /><span>Payment will be collected when your order is delivered.</span></div>
        <Link className="button button-primary" to="/shop">Continue shopping</Link>
      </section>
    </main>
  }

  if (!items.length) {
    return <main className="checkout-page checkout-state-page">
      <section className="checkout-empty">
        <p className="eyebrow">Your bag</p>
        <h1>Nothing to check out yet.</h1>
        <p>Add the care your routine needs, then return here to arrange delivery.</p>
        <Link className="button button-primary" to="/shop">Explore the collection</Link>
      </section>
    </main>
  }

  return <main className="checkout-page">
    <div className="checkout-heading">
      <Link to="/shop"><ArrowLeft size={16} /> Continue shopping</Link>
      <p className="eyebrow">Secure order request</p>
      <h1>Complete your order.</h1>
      <p>Tell us where your care is going. We’ll confirm delivery costs with you before dispatch, and payment is collected on delivery.</p>
    </div>

    <div className="checkout-layout">
      <form className="checkout-form" onSubmit={submitOrder}>
        <section className="checkout-form-section">
          <div className="checkout-section-heading"><div><h2>Contact details</h2><p>For your order confirmation and delivery updates.</p></div></div>
          <div className="checkout-fields two-columns">
            <label><span>First name</span><input name="firstName" autoComplete="given-name" value={formValues.firstName} onChange={updateField} required /></label>
            <label><span>Last name</span><input name="lastName" autoComplete="family-name" value={formValues.lastName} onChange={updateField} required /></label>
            <label><span>Email address</span><input type="email" name="email" autoComplete="email" value={formValues.email} onChange={updateField} required /></label>
            <label><span>Phone number</span><input type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="+233" value={formValues.phone} onChange={updateField} required /></label>
          </div>
        </section>

        <section className="checkout-form-section">
          <div className="checkout-section-heading"><div><h2>Delivery details</h2><p>Available across Ghana. Fees depend on your location.</p></div></div>
          {savedAddresses.length > 0 && (
            <section className="checkout-saved-addresses" aria-label="Saved delivery addresses">
              <div><strong>Saved addresses</strong><Link to="/account?tab=delivery">Manage</Link></div>
              <div className="checkout-saved-address-list">
                {savedAddresses.map((address) => (
                  <button type="button" key={address.id} className={selectedAddressId === address.id ? 'selected' : ''} aria-pressed={selectedAddressId === address.id} onClick={() => applySavedAddress(address)}>
                    <span><strong>{address.label || 'Delivery address'}</strong>{address.is_default && <em>Default</em>}</span>
                    <small>{address.address}, {address.city}</small>
                    {selectedAddressId === address.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="checkout-fields two-columns">
            <label><span>Region</span><CheckoutRegionSelect value={formValues.region} onChange={(region) => { setFormValues((current) => ({ ...current, region })); setSubmitError('') }} /></label>
            <label><span>Town or city</span><input name="city" autoComplete="address-level2" value={formValues.city} onChange={updateField} required /></label>
            <label className="full-width"><span>Delivery address</span><input name="address" autoComplete="street-address" value={formValues.address} onChange={updateField} required /></label>
            <label className="full-width"><span>Landmark <small>Optional</small></span><input name="landmark" value={formValues.landmark} onChange={updateField} placeholder="A nearby landmark that helps the rider" /></label>
            <label className="full-width"><span>Delivery notes <small>Optional</small></span><textarea name="notes" rows="3" value={formValues.notes} onChange={updateField} placeholder="Gate instructions, preferred delivery time or anything we should know" /></label>
          </div>
        </section>

        <section className="checkout-form-section">
          <div className="checkout-section-heading"><div><h2>Payment</h2><p>Payment on delivery is currently available for every order.</p></div></div>
          <div className="payment-options">
            <div className="selected payment-method-only"><Truck size={20} /><span><strong>Pay on delivery</strong><small>Pay the rider when your order arrives. Delivery availability depends on your location.</small></span><Check size={18} aria-label="Selected" /></div>
          </div>
        </section>

        <div className={`checkout-required-status${missingFields.length ? '' : ' is-complete'}`} aria-live="polite">
          <p>{missingFields.length ? 'Complete these fields to place your order:' : <><Check size={15} /> Your details are complete.</>}</p>
          {missingFields.length > 0 && <div>{missingFields.map((field) => <span key={field.key}>{field.label}</span>)}</div>}
        </div>
        {submitError && <p className="checkout-submit-error" role="alert">{submitError}</p>}
        <button className="place-order-button" type="submit" disabled={missingFields.length > 0 || isSubmitting}>{isSubmitting ? 'Placing order…' : 'Place order'} <span>{formatMoney(subtotal)}</span></button>
        <p className="checkout-submit-note"><ShieldCheck size={15} /> You’ll pay only when your order is delivered.</p>
      </form>

      <aside className="checkout-summary">
        <div className="checkout-summary-heading"><div><p className="eyebrow">Your selection</p><h2>Order summary</h2></div><span>{items.reduce((total, item) => total + item.quantity, 0)} items</span></div>
        <div className="checkout-summary-items">{items.map((item) => <article key={item.id} style={{ '--product-card-color': item.cardColor }}><ProductVisual product={item} compact /><div><p>{item.type}</p><h3>{item.name}</h3><span>{item.size} · Qty {item.quantity}</span><strong>{formatMoney(item.price * item.quantity)}</strong></div></article>)}</div>
        <div className="checkout-totals"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div><span>Delivery</span><strong>{deliveryZone ? formatMoney(deliveryFee) : 'Confirmed separately'}</strong></div><div className="checkout-total"><span>Total on delivery</span><strong>{formatMoney(subtotal + deliveryFee)}</strong></div></div>
        <p className="checkout-delivery-note"><MapPin size={16} /> {deliveryZone ? `${deliveryZone.delivery_window}. Payment is collected on delivery.` : 'Delivery cost is based on the address above and confirmed before dispatch.'}</p>
      </aside>
    </div>
  </main>
}
