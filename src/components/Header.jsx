import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react'
import BrandMark from './BrandMark'
import { useCart } from '../context/cart-store'

const links = [['Shop', '/shop'], ['Routines', '/routines'], ['Hair needs', '/hair-needs'], ['Our story', '/story']]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { itemCount, setIsOpen } = useCart()

  return (
    <><div className="announcement-bar"><span>Rooted care for curls, coils & locs</span><span>Free delivery in Accra over GH₵250</span></div><header className="site-header">
      <Link className="brand" to="/" aria-label="Apaterra home"><BrandMark /><span className="brand-name">apaterra</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => <NavLink key={label} to={href}>{label}</NavLink>)}
      </nav>
      <div className="header-actions">
        <Link to="/shop" aria-label="Search products"><Search size={18} /></Link>
        <button type="button" aria-label="Account preview"><UserRound size={18} /></button>
        <button type="button" className="cart-button" aria-label={`Shopping cart with ${itemCount} items`} onClick={() => setIsOpen(true)}><ShoppingCart size={20} /><span className="cart-count">{itemCount}</span></button>
        <button type="button" className="menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
      </div>
      {menuOpen && <div className="mobile-menu"><div><span className="brand-name">apaterra</span><button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={22} /></button></div><nav>{links.map(([label, href]) => <NavLink key={label} to={href} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}</nav></div>}
    </header></>
  )
}
