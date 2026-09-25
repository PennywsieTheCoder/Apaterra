import { ArrowUpRight, MessageCircle, ShieldCheck, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import footerImage from '../assets/footer-apaterra-v3.png'
import BrandMark from './BrandMark'

export default function Footer() {
  return (
    <footer className="site-footer footer-showcase" style={{ '--footer-image': `url(${footerImage})` }}>
      <div className="footer-newsletter-hero">
        <p>Notes from Apaterra</p>
        <h2>Join our circle.<br />Care for every crown.</h2>
        <form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Email address" aria-label="Email address" /><button type="submit">Join the circle <ArrowUpRight size={16} /></button></form>
      </div>
      <div className="footer-panel-wrap">
        <div className="footer-panel">
          <div className="footer-assurances"><span><Truck size={16} /> Delivery across Ghana</span><span><MessageCircle size={16} /> Care guidance</span><span><ShieldCheck size={16} /> Secure checkout</span></div>
          <div className="footer-main">
            <div><Link className="brand footer-brand" to="/"><BrandMark /><span className="brand-name">apaterra</span></Link><p>Rooted care for African-textured hair.</p></div>
            <div><h3>Shop</h3><Link to="/shop">All products</Link><Link to="/hair-needs">Hair needs</Link><Link to="/routines">Routines</Link></div>
            <div><h3>Discover</h3><Link to="/story">Our story</Link><a href="#ingredients">Ingredients</a><a href="#journal">Hair journal</a></div>
            <div><h3>Customer care</h3><a href="#contact">Contact us</a><a href="#delivery">Delivery</a><a href="#returns">Returns</a></div>
          </div>
          <div className="footer-bottom"><span>© {new Date().getFullYear()} Apaterra</span><span>Rooted in Ghana · GHS</span></div>
        </div>
      </div>
    </footer>
  )
}
