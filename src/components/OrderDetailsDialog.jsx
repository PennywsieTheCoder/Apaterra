import { Check, MapPin, Package, Truck, X } from 'lucide-react'
import { formatMoney } from '../data/catalog'

const steps = ['Confirmation pending', 'Preparing', 'Dispatched', 'Delivered']

export default function OrderDetailsDialog({ order, onClose, admin = false }) {
  if (!order) return null
  const currentStep = Math.max(0, steps.indexOf(order.status))
  const isCancelled = order.status === 'Cancelled'

  return (
    <div className="order-details-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="order-details-dialog" role="dialog" aria-modal="true" aria-labelledby="order-details-title">
        <header><div><span>{admin ? order.customer : 'Order details'}</span><h2 id="order-details-title">{order.reference}</h2></div><button type="button" aria-label="Close order details" onClick={onClose}><X size={18} /></button></header>
        <div className="order-details-status"><strong>{order.status || 'Confirmation pending'}</strong><span>{isCancelled ? 'This order was cancelled and stock was restored.' : order.deliveryWindow || 'We will confirm the delivery window with you.'}</span></div>
        {!isCancelled && <div className="order-details-timeline">{steps.map((step, index) => <div className={index <= currentStep ? 'complete' : ''} key={step}><i>{index < currentStep ? <Check size={11} /> : index + 1}</i><span>{step === 'Confirmation pending' ? 'Received' : step}</span></div>)}</div>}
        <div className="order-details-grid">
          <section><h3><MapPin size={16} /> Delivery</h3><p>{order.address || 'Address confirmed with customer'}{order.landmark ? `, ${order.landmark}` : ''}</p><p>{[order.city, order.region].filter(Boolean).join(', ')}</p>{order.deliveryRider && <p>Rider: {order.deliveryRider}</p>}{order.notes && <small>Note: {order.notes}</small>}</section>
          <section><h3><Truck size={16} /> Payment</h3><p>{order.paymentMethod === 'delivery' ? 'Pay on delivery' : 'Payment method recorded'}</p><p>{order.phone || 'Contact details on order'}</p></section>
        </div>
        <section className="order-details-items"><h3><Package size={16} /> Items</h3>{order.items.map((item, index) => <div key={`${item.id}-${index}`}><span>{item.quantity}×</span><strong>{item.name}<small>{item.size}</small></strong><b>{formatMoney(item.price * item.quantity)}</b></div>)}</section>
        <footer><span>Delivery <b>{order.deliveryFee ? formatMoney(order.deliveryFee) : 'Confirmed separately'}</b></span><strong>Total on delivery <b>{formatMoney(order.subtotal + order.deliveryFee)}</b></strong></footer>
      </section>
    </div>
  )
}
