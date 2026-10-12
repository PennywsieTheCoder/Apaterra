import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, UserRound, X } from 'lucide-react'
import BrandMark from './BrandMark'
import { useCart } from '../context/cart-store'

const links = [['Shop', '/shop'], ['Routines', '/routines'], ['Hair needs', '/hair-needs'], ['Our story', '/story']]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const mobileSearchInput = useRef(null)
  const { itemCount, setIsOpen } = useCart()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isHome = pathname === '/'

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  function submitSearch(event) {
    event.preventDefault()
    const query = searchTerm.trim()
    setMenuOpen(false)
    setSearchOpen(false)
    navigate(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop')
  }

  function handleMobileSearchButton(event) {
    event.preventDefault()
    if (searchOpen) {
      setSearchOpen(false)
      return
    }

    setSearchOpen(true)
    setMenuOpen(false)
    requestAnimationFrame(() => mobileSearchInput.current?.focus())
  }

  return (
    <><div className="announcement-bar"><span>Rooted care for curls, coils & locs</span><span>Free delivery in Accra over GH₵250</span></div><header className={`site-header${isHome ? ' home-header' : ''}${isScrolled ? ' is-scrolled' : ''}`}>
      <Link className="brand" to="/" aria-label="Apa Terra home" onClick={() => { setMenuOpen(false); setSearchOpen(false) }}><BrandMark /></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => <NavLink key={label} to={href}>{label}</NavLink>)}
      </nav>
      <div className="header-actions">
        <form className="header-search" role="search" onSubmit={submitSearch}>
          <button type="submit" aria-label="Submit product search"><Search size={17} /></button>
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search" aria-label="Search products" />
        </form>
        <button type="button" aria-label="Account preview"><UserRound size={18} /></button>
        <form id="mobile-product-search" className={`mobile-search-panel${searchOpen ? ' is-open' : ''}`} role="search" aria-hidden={!searchOpen} onSubmit={submitSearch}>
          <input ref={mobileSearchInput} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search" aria-label="Search products" enterKeyHint="search" tabIndex={searchOpen ? 0 : -1} />
          <button type="button" className="mobile-search-close" aria-label="Close product search" tabIndex={searchOpen ? 0 : -1} onClick={() => setSearchOpen(false)}><X size={16} /></button>
        </form>
        <button type="button" className={`mobile-search-button${searchOpen ? ' is-open' : ''}`} aria-controls="mobile-product-search" aria-expanded={searchOpen} aria-label={searchOpen ? 'Close product search' : 'Open product search'} onClick={handleMobileSearchButton}><Search size={19} /></button>
        <button type="button" className="cart-button" aria-label={`Shopping cart with ${itemCount} items`} onClick={() => { setSearchOpen(false); setIsOpen(true) }}><ShoppingCart size={20} /><span className="cart-count">{itemCount}</span></button>
        <button
          type="button"
          className={`menu-button${menuOpen ? ' is-open' : ''}`}
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => { setMenuOpen((isOpen) => !isOpen); setSearchOpen(false) }}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <div id="mobile-navigation" className={`mobile-menu${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav aria-label="Mobile navigation">{links.map(([label, href]) => <NavLink key={label} to={href} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{label}</NavLink>)}</nav>
      </div>
    </header></>
  )
}
