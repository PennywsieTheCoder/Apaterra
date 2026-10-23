import { ArrowRight, Camera, Clock3, Mail, MapPin, MessageCircle, Music2, Phone, Play, RotateCcw, Scale, ShieldCheck, Truck, Users } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { useBusinessSettings } from '../context/business-settings-store'
import { getSafeExternalUrl, getWhatsAppUrl } from '../lib/businessSettings'

const pages = {
  delivery: {
    eyebrow: 'Customer care',
    title: 'Delivery, without the guesswork.',
    intro: 'What happens after you place a pay-on-delivery order with Apa Terra.',
    icon: Truck,
    sections: [
      {
        title: 'Where we deliver',
        body: ['Apa Terra delivers within Ghana. The delivery address you select at checkout determines the available fulfilment details and fee for your order.', 'You can save more than one address in your profile and choose the right one each time you order.'],
      },
      {
        title: 'Order confirmation',
        body: ['Placing an order reserves your selected items and creates an order reference. Because payment is made on delivery, our team may confirm the order and delivery details before dispatch.', 'Keep your phone number and delivery instructions current so the fulfilment team can reach you when necessary.'],
      },
      {
        title: 'Tracking your order',
        body: ['Sign in and open Orders in your profile to see the latest status. In-app notifications will also let you know when an order is confirmed, prepared, dispatched, delivered or cancelled.'],
      },
      {
        title: 'Receiving your order',
        body: ['Please make sure someone is available at the selected address to receive the parcel and pay the amount due. Check the package and item count when it arrives, and report a wrong or damaged item as soon as possible.'],
      },
    ],
    action: { label: 'Manage delivery addresses', to: '/account?tab=delivery' },
  },
  returns: {
    eyebrow: 'Customer care',
    title: 'Returns made clear.',
    intro: 'A straightforward process for items that arrive damaged, incorrect or unsuitable for return.',
    icon: RotateCcw,
    sections: [
      {
        title: 'Check your order on arrival',
        body: ['Confirm that the parcel contains the products and quantities listed in your order. If an item is incorrect, missing, damaged or leaking, contact the fulfilment team as soon as possible and keep the packaging.'],
      },
      {
        title: 'Return eligibility',
        body: ['For hygiene and product-safety reasons, opened or used hair-care products generally cannot be returned because of a change of mind. An unopened item may be considered for return after its condition and order details have been reviewed.', 'Faulty, damaged or incorrectly supplied items will be assessed separately. This policy does not limit rights available under applicable law.'],
      },
      {
        title: 'Before sending anything back',
        body: ['Do not send a product back without confirmation from the Apa Terra team. Have your order reference, the product name and clear photos of the item and packaging ready so the issue can be reviewed quickly.'],
      },
      {
        title: 'Resolution',
        body: ['Once a return is approved and inspected, the available resolution may be a replacement, store credit or refund, depending on the issue and product condition. Any collection or return instructions will be confirmed with you first.'],
      },
    ],
    action: { label: 'View your orders', to: '/account?tab=orders' },
  },
  privacy: {
    eyebrow: 'Your information',
    title: 'Privacy, explained plainly.',
    intro: 'How Apa Terra uses the information needed to run your account, orders and care experience.',
    icon: ShieldCheck,
    sections: [
      {
        title: 'Information we collect',
        body: ['We collect information you provide, including your name, email address, phone number, saved delivery addresses, profile details and order information. We also store choices such as Favorites, notification preferences, cart activity and theme settings where needed to provide the service.'],
      },
      {
        title: 'How it is used',
        body: ['Your information is used to create and secure your account, fulfil and support orders, manage stock, show relevant notifications, remember your preferences and improve the storefront.', 'Apa Terra currently offers pay on delivery and does not collect card details through this website.'],
      },
      {
        title: 'Storage and service providers',
        body: ['Account and store data are handled through service providers used to operate the website, including its database, authentication and hosting. Access is limited according to the role and task being performed. We do not sell your personal information.'],
      },
      {
        title: 'Your choices',
        body: ['You can update profile and delivery details, manage notification preferences, and clear read notifications from your account. You may also ask for help accessing, correcting or deleting account information, subject to records Apa Terra must retain for legitimate business or legal reasons.'],
      },
    ],
    action: { label: 'Review account settings', to: '/account?tab=setting' },
  },
  terms: {
    eyebrow: 'Store terms',
    title: 'Simple terms for shopping.',
    intro: 'The main conditions that apply when you browse, create an account or order from Apa Terra.',
    icon: Scale,
    sections: [
      {
        title: 'Using the storefront',
        body: ['You may browse products without an account. An account and accurate contact and delivery information are required to place an order. You are responsible for activity on your account and for keeping access details secure.'],
      },
      {
        title: 'Products and availability',
        body: ['We aim to keep descriptions, sizes, images, prices and stock accurate. Product appearance may vary slightly from photography, and availability can change. Adding an item to the cart does not reserve it.'],
      },
      {
        title: 'Orders and payment',
        body: ['Orders are paid for on delivery. Submitting checkout creates a request that Apa Terra may confirm before dispatch. An order may be declined or cancelled if stock is unavailable, delivery details cannot be confirmed, or the order cannot reasonably be fulfilled.'],
      },
      {
        title: 'Changes and cancellations',
        body: ['Use your order reference when requesting help. Cancellation may be possible before fulfilment has progressed; once an order is dispatched, delivery or return arrangements may apply. Repeated unreceived pay-on-delivery orders may affect future ordering.'],
      },
      {
        title: 'Content and responsibility',
        body: ['Apa Terra content is provided for product and general hair-care guidance and is not medical advice. Stop using a product if irritation occurs and seek appropriate professional advice when needed. Site content, branding and imagery may not be reused without permission.'],
      },
    ],
    action: { label: 'Browse the shop', to: '/shop' },
  },
  contact: {
    eyebrow: 'Get help',
    title: 'We’ll point you the right way.',
    intro: 'Start with the fastest route for order, delivery or product questions.',
    icon: MessageCircle,
    sections: [
      {
        title: 'Help with an order',
        body: ['Open Orders in your profile to check the status and find the order reference. Keep that reference ready when speaking with the fulfilment team—it is the quickest way to identify your order.'],
      },
      {
        title: 'Delivery questions',
        body: ['Review the delivery guide for how addresses, confirmation, dispatch and pay on delivery work. You can add or update saved delivery addresses from your profile.'],
      },
      {
        title: 'Product guidance',
        body: ['Use Hair Needs and Routines to narrow the catalogue by concern and see how products fit together. Product pages contain directions, sizes and availability.'],
      },
      {
        title: 'Public support channel',
        body: ['Apa Terra’s public customer-care email and phone details will appear here once the client’s support channel is confirmed. No placeholder contact information has been published.'],
      },
    ],
    action: { label: 'View your orders', to: '/account?tab=orders' },
  },
}

const pageLinks = [
  ['delivery', 'Delivery'],
  ['returns', 'Returns'],
  ['privacy', 'Privacy'],
  ['terms', 'Terms'],
  ['contact', 'Contact'],
]

export default function TrustPage({ page }) {
  const content = pages[page]
  const { settings } = useBusinessSettings()

  if (!content) return <Navigate to="/" replace />

  const Icon = content.icon
  const contactChannels = page === 'contact' ? [
    settings.support_email && { label: 'Email', value: settings.support_email, href: `mailto:${settings.support_email}`, icon: Mail },
    settings.support_phone && { label: 'Phone', value: settings.support_phone, href: `tel:${settings.support_phone.replace(/[^+\d]/g, '')}`, icon: Phone },
    settings.whatsapp_number && { label: 'WhatsApp', value: settings.whatsapp_number, href: getWhatsAppUrl(settings.whatsapp_number), icon: MessageCircle, external: true },
    settings.business_address && { label: 'Address', value: settings.business_address, icon: MapPin },
    settings.operating_hours && { label: 'Hours', value: settings.operating_hours, icon: Clock3 },
  ].filter(Boolean) : []
  const socialLinks = page === 'contact' ? [
    { label: 'Instagram', href: getSafeExternalUrl(settings.instagram_url), icon: Camera },
    { label: 'TikTok', href: getSafeExternalUrl(settings.tiktok_url), icon: Music2 },
    { label: 'YouTube', href: getSafeExternalUrl(settings.youtube_url), icon: Play },
    { label: 'Facebook', href: getSafeExternalUrl(settings.facebook_url), icon: Users },
  ].filter((item) => item.href) : []
  const sections = page === 'contact' && (contactChannels.length > 0 || socialLinks.length > 0)
    ? content.sections.slice(0, -1)
    : content.sections

  return (
    <main className="trust-page page-shell">
      <section className="trust-hero">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h1>{content.title}</h1>
          <p>{content.intro}</p>
        </div>
        <span aria-hidden="true"><Icon size={34} strokeWidth={1.5} /></span>
      </section>

      <div className="trust-layout">
        <aside className="trust-navigation">
          <p>Customer information</p>
          <nav aria-label="Customer information pages">
            {pageLinks.map(([key, label]) => (
              <Link className={key === page ? 'active' : ''} key={key} to={`/${key}`} aria-current={key === page ? 'page' : undefined}>
                {label}<ArrowRight size={15} />
              </Link>
            ))}
          </nav>
        </aside>

        <div className="trust-content">
          <p className="trust-updated">Last updated 23 October 2026</p>
          {page === 'contact' && (contactChannels.length > 0 || socialLinks.length > 0) && <section className="contact-directory" aria-label="Apa Terra contact details">
            {contactChannels.map(({ label, value, href, icon: ChannelIcon, external }) => {
              const contentNode = <><ChannelIcon size={19} /><span><small>{label}</small><strong>{value}</strong></span>{href && <ArrowRight size={16} />}</>
              return href
                ? <a key={label} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>{contentNode}</a>
                : <div key={label}>{contentNode}</div>
            })}
            {socialLinks.length > 0 && <div className="contact-socials">
              <small>Follow Apa Terra</small>
              <span>{socialLinks.map(({ label, href, icon: SocialIcon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><SocialIcon size={18} /></a>)}</span>
            </div>}
          </section>}
          {sections.map((section) => (
            <ScrollReveal as="section" className="trust-section" key={section.title} rootMargin="0px 0px 5% 0px" threshold={0.04}>
              <div>
                <h2>{section.title}</h2>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </ScrollReveal>
          ))}
          <div className="trust-action">
            <Link className="button button-primary" to={content.action.to}>{content.action.label}<ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>
    </main>
  )
}
