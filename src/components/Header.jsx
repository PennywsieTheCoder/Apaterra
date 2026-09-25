import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react'
import BrandMark from './BrandMark'
import { useCart } from '../context/cart-store'

const links = [['Shop', '/shop'], ['Routines', '/routines'], ['Hair needs', '/hair-needs'], ['Our story', '/story']]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { itemCount, setIsOpen } = useCart()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isHome = pathname === '/'

  function submitSearch(event) {
    event.preventDefault()
    const query = searchTerm.trim()
    navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop')
  }

  return (
    <><div className="announcement-bar"><span>Rooted care for curls, coils & locs</span><span>Free delivery in Accra over GH₵250</span></div><header className={`site-header ${isHome ? 'home-header' : ''}`}>
      <Link className="brand" to="/" aria-label="Apaterra home"><BrandMark /><span className="brand-name">apaterra</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => <NavLink key={label} to={href}>{label}</NavLink>)}
      </nav>
      <div className="header-actions">
        <form className="header-search" role="search" onSubmit={submitSearch}>
          <button type="submit" aria-label="Submit product search"><Search size={17} /></button>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search products" aria-label="Search products" />
        </form>
        <button type="button" aria-label="Account preview"><UserRound size={18} /></button>
        <button type="button" className="cart-button" aria-label={`Shopping cart with ${itemCount} items`} onClick={() => setIsOpen(true)}><ShoppingCart size={20} /><span className="cart-count">{itemCount}</span></button>
        <button type="button" className="menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21} /></button>
      </div>
      {menuOpen && <div className="mobile-menu"><div><span className="brand-name">apaterra</span><button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={22} /></button></div><nav>{links.map(([label, href]) => <NavLink key={label} to={href} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}</nav></div>}
    </header></>
  )
}
