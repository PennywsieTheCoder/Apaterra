import { useState } from 'react'
import { ArrowLeft, Check, MapPin, ShieldCheck, Smartphone, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductVisual from '../components/ProductVisual'
import { useCart } from '../context/cart-store'
import { formatMoney } from '../data/catalog'

const regions = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
  'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West',
  'Volta', 'Western', 'Western North',
]

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const [paymentMethod, setPaymentMethod] = useState('momo')
  const [orderReference, setOrderReference] = useState('')
  const [formValues, setFormValues] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('apaterra-profile') || '{}')
      return { firstName: '', lastName: '', email: '', phone: '', region: '', city: '', address: '', ...saved }
    } catch {
      return { firstName: '', lastName: '', email: '', phone: '', region: '', city: '', address: '' }
    }
  })

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
  }

  function submitOrder(event) {
    event.preventDefault()
    if (missingFields.length) return
    const reference = `APA-${Date.now().toString().slice(-6)}`
    const order = {
      reference,
      date: new Date().toISOString(),
      status: 'Confirmation pending',
      subtotal,
      paymentMethod,
      items: items.map(({ id, name, type, size, image, cardColor, price, quantity }) => ({ id, name, type, size, image, cardColor, price, quantity })),
    }

    try {
      const existingProfile = JSON.parse(window.localStorage.getItem('apaterra-profile') || '{}')
      window.localStorage.setItem('apaterra-profile', JSON.stringify({ ...existingProfile, ...formValues }))
      const existingOrders = JSON.parse(window.localStorage.getItem('apaterra-orders') || '[]')
      window.localStorage.setItem('apaterra-orders', JSON.stringify([order, ...existingOrders]))
    } catch {
      // Checkout can still complete if browser storage is unavailable.
    }
    setOrderReference(reference)
    clearCart()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (orderReference) {
    return <main className="checkout-page checkout-state-page">
      <section className="checkout-confirmation">
        <span className="checkout-confirmation-icon"><Check size={28} /></span>
        <p className="eyebrow">Order request received</p>
        <h1>Thank you. Your order is being prepared.</h1>
        <p>Your reference is <strong>{orderReference}</strong>. We’ll use the contact details you provided to confirm delivery fees, availability and payment instructions.</p>
        <div className="checkout-confirmation-note"><ShieldCheck size={18} /><span>No payment has been taken on this website.</span></div>
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
      <p>Tell us where your care is going. Delivery cost and final payment instructions will be confirmed with you before dispatch.</p>
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
          <div className="checkout-fields two-columns">
            <label><span>Region</span><select name="region" value={formValues.region} onChange={updateField} required><option value="" disabled>Select your region</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></label>
            <label><span>Town or city</span><input name="city" autoComplete="address-level2" value={formValues.city} onChange={updateField} required /></label>
            <label className="full-width"><span>Delivery address</span><input name="address" autoComplete="street-address" value={formValues.address} onChange={updateField} required /></label>
            <label className="full-width"><span>Landmark <small>Optional</small></span><input name="landmark" placeholder="A nearby landmark that helps the rider" /></label>
            <label className="full-width"><span>Delivery notes <small>Optional</small></span><textarea name="notes" rows="3" placeholder="Gate instructions, preferred delivery time or anything we should know" /></label>
          </div>
        </section>

        <section className="checkout-form-section">
          <div className="checkout-section-heading"><div><h2>Payment preference</h2><p>Payment is arranged only after your order is confirmed.</p></div></div>
          <div className="payment-options">
            <label className={paymentMethod === 'momo' ? 'selected' : ''}><input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')} /><Smartphone size={20} /><span><strong>Mobile Money</strong><small>We’ll send verified payment instructions after confirmation.</small></span><i /></label>
            <label className={paymentMethod === 'delivery' ? 'selected' : ''}><input type="radio" name="payment" value="delivery" checked={paymentMethod === 'delivery'} onChange={() => setPaymentMethod('delivery')} /><Truck size={20} /><span><strong>Pay on delivery</strong><small>Availability depends on your delivery location.</small></span><i /></label>
          </div>
        </section>

        <div className={`checkout-required-status${missingFields.length ? '' : ' is-complete'}`} aria-live="polite">
          <p>{missingFields.length ? 'Complete these fields to place your order:' : <><Check size={15} /> Your details are complete.</>}</p>
          {missingFields.length > 0 && <div>{missingFields.map((field) => <span key={field.key}>{field.label}</span>)}</div>}
        </div>
        <button className="place-order-button" type="submit" disabled={missingFields.length > 0}>Place order <span>{formatMoney(subtotal)}</span></button>
        <p className="checkout-submit-note"><ShieldCheck size={15} /> No online payment is collected at this step.</p>
      </form>

      <aside className="checkout-summary">
        <div className="checkout-summary-heading"><div><p className="eyebrow">Your selection</p><h2>Order summary</h2></div><span>{items.reduce((total, item) => total + item.quantity, 0)} items</span></div>
        <div className="checkout-summary-items">{items.map((item) => <article key={item.id} style={{ '--product-card-color': item.cardColor }}><ProductVisual product={item} compact /><div><p>{item.type}</p><h3>{item.name}</h3><span>{item.size} · Qty {item.quantity}</span><strong>{formatMoney(item.price * item.quantity)}</strong></div></article>)}</div>
        <div className="checkout-totals"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div><span>Delivery</span><strong>Confirmed separately</strong></div><div className="checkout-total"><span>Products total</span><strong>{formatMoney(subtotal)}</strong></div></div>
        <p className="checkout-delivery-note"><MapPin size={16} /> Delivery cost is based on the address above and confirmed before dispatch.</p>
      </aside>
    </div>
  </main>
}
