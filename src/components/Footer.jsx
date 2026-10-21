import { useState } from 'react'
import { ArrowUpRight, MessageCircle, Music2, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import footerImage from '../assets/footer-apaterra-v4.jpg'
import syntiqLogo from '../assets/syntiq-labs-logo.png'
import BrandMark from './BrandMark'
import { supabase } from '../lib/supabase'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)

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
            {isSubscribing ? 'Joining…' : 'Join the circle'} <ArrowUpRight size={16} />
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
            <div><h3>Discover</h3><Link to="/story">Our story</Link><a href="#ingredients">Ingredients</a><a href="#journal">Hair journal</a></div>
            <div><h3>Customer care</h3><a href="#contact">Contact us</a><a href="#delivery">Delivery</a><a href="#returns">Returns</a></div>
          </div>
          <div className="footer-bottom">
            <div className="footer-meta"><span>© {new Date().getFullYear()} Apaterra</span><span>Rooted in Ghana · GHS</span></div>
            <div className="footer-end">
              <nav className="footer-social" aria-label="Apaterra social media">
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Apaterra on Instagram"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="social-icon-fill" cx="17.4" cy="6.7" r="1" /></svg></a>
                <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="Apaterra on TikTok"><Music2 size={15} /></a>
                <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="Apaterra on YouTube"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a2.8 2.8 0 0 0-2-2C17.3 5.7 12 5.7 12 5.7s-5.3 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12 29 29 0 0 0 3 15.8a2.8 2.8 0 0 0 2 2c1.7.5 7 .5 7 .5s5.3 0 7-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-3.8 29 29 0 0 0-.5-3.8Z" /><path className="social-icon-fill" d="m10 9 5 3-5 3Z" /></svg></a>
              </nav>
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
    <nav aria-label="Account footer navigation"><Link to="/shop">Shop</Link><Link to="/routines">Routines</Link><Link to="/story">Our story</Link></nav>
    <div className="compact-footer-meta"><span>© {new Date().getFullYear()} Apaterra</span><span>Rooted in Ghana · GHS</span></div>
  </footer>
}
