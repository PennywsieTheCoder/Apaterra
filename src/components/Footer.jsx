import { useState } from 'react'
import { ArrowUpRight, Camera, MessageCircle, Music2, Play, ShieldCheck, Truck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import footerImage from '../assets/footer-apaterra-v4.jpg'
import syntiqLogo from '../assets/syntiq-labs-logo.png'
import BrandMark from './BrandMark'
import { supabase } from '../lib/supabase'
import { useBusinessSettings } from '../context/business-settings-store'
import { getSafeExternalUrl } from '../lib/businessSettings'

export default function Footer() {
  const { settings } = useBusinessSettings()
  const [email, setEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const socialLinks = [
    { label: 'Instagram', href: getSafeExternalUrl(settings.instagram_url), icon: Camera },
    { label: 'TikTok', href: getSafeExternalUrl(settings.tiktok_url), icon: Music2 },
    { label: 'YouTube', href: getSafeExternalUrl(settings.youtube_url), icon: Play },
    { label: 'Facebook', href: getSafeExternalUrl(settings.facebook_url), icon: Users },
  ].filter((item) => item.href)

  async function subscribeToNewsletter(event) {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      setNewsletterMessage('Enter your email address to join.')
      return
    }
    if (!supabase) {
      setNewsletterMessage('Newsletter sign-up is not available yet.')
      return
    }

    setIsSubscribing(true)
    setNewsletterMessage('')
    const { error } = await supabase.rpc('subscribe_to_newsletter', { p_email: normalizedEmail })
    if (error) {
      setNewsletterMessage(error.message)
    } else {
      setEmail('')
      setNewsletterMessage('You’re on the list. Welcome to Apa Terra.')
    }
    setIsSubscribing(false)
  }

  return (
    <footer className="site-footer footer-showcase" style={{ '--footer-image': `url(${footerImage})` }}>
      <div className="footer-newsletter-hero">
        <form onSubmit={subscribeToNewsletter}>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            aria-label="Email address"
            autoComplete="email"
            required
          />
          <button type="submit" disabled={isSubscribing}>
            {isSubscribing ? 'Joining…' : 'Get updates'} <ArrowUpRight size={16} />
          </button>
        </form>
        {newsletterMessage && <p className="footer-newsletter-message" role="status">{newsletterMessage}</p>}
      </div>
      <div className="footer-panel-wrap">
        <div className="footer-panel">
          <div className="footer-assurances"><span><Truck size={16} /> Delivery across Ghana</span><span><MessageCircle size={16} /> Care guidance</span><span><ShieldCheck size={16} /> Secure checkout</span></div>
          <div className="footer-main">
            <div><Link className="brand footer-brand" to="/" aria-label="Apa Terra home"><BrandMark /></Link><p>Rooted care for African-textured hair.</p></div>
            <div><h3>Shop</h3><Link to="/shop">All products</Link><Link to="/hair-needs">Hair needs</Link><Link to="/routines">Routines</Link></div>
            <div><h3>Discover</h3><Link to="/story">Our story</Link><Link to="/hair-needs">Shop by hair need</Link><Link to="/routines">Product routines</Link></div>
            <div><h3>Customer care</h3><Link to="/contact">Contact</Link><Link to="/delivery">Delivery</Link><Link to="/returns">Returns</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div>
          </div>
          <div className="footer-bottom">
            <div className="footer-meta"><span>© {new Date().getFullYear()} Apaterra</span><span>Rooted in Ghana · GHS</span></div>
            <div className="footer-end">
              {socialLinks.length > 0 && <div className="footer-social" aria-label="Apa Terra social media">
                {socialLinks.map(({ label, href, icon: Icon }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}><Icon /></a>)}
              </div>}
              <div className="footer-powered" aria-label="Powered by SYNTIQ Labs">
                <span>Powered by</span>
                <span className="footer-powered-logo" aria-hidden="true"><img src={syntiqLogo} alt="" /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export function CompactFooter() {
  return <footer className="compact-footer">
    <div className="compact-footer-brand"><Link className="brand" to="/" aria-label="Apa Terra home"><BrandMark /></Link><p>Rooted care for African-textured hair.</p></div>
    <nav aria-label="Footer navigation"><Link to="/shop">Shop</Link><Link to="/delivery">Delivery</Link><Link to="/returns">Returns</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></nav>
    <div className="compact-footer-meta"><span>© {new Date().getFullYear()} Apaterra</span><span>Rooted in Ghana · GHS</span></div>
  </footer>
}
