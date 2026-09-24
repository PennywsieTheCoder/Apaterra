import { Link } from 'react-router-dom'
import BrandMark from './BrandMark'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div><Link className="brand footer-brand" to="/"><BrandMark /><span className="brand-name">apaterra</span></Link><p>Rooted care for African-textured hair.</p></div>
        <div><h3>Explore</h3><Link to="/shop">Shop all</Link><Link to="/routines">Routines</Link><Link to="/story">Our story</Link></div>
        <div><h3>Customer care</h3><a href="#contact">Contact</a><a href="#delivery">Delivery</a><a href="#returns">Returns</a></div>
        <div className="footer-newsletter"><h3>Notes from Apaterra</h3><p>Hair-care guidance, rituals and new releases.</p><form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Email address" aria-label="Email address" /><button type="submit">Join</button></form></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Apaterra</span><span>Ghana · GHS</span></div>
    </footer>
  )
}
