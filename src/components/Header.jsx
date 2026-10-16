import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, LogOut, Moon, Search, ShoppingCart, Sun, UserRound, X } from 'lucide-react'
import BrandMark from './BrandMark'
import { useCart } from '../context/cart-store'

const links = [['Shop', '/shop'], ['Routines', '/routines'], ['Hair needs', '/hair-needs'], ['Our story', '/story'], ['Admin', '/admin']]

function readProfile() {
  try {
    return JSON.parse(window.localStorage.getItem('apaterra-profile') || '{}')
  } catch {
    return {}
  }
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [profile, setProfile] = useState(readProfile)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = window.localStorage.getItem('apaterra-theme')
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const mobileSearchInput = useRef(null)
  const accountMenuRef = useRef(null)
  const { itemCount, setIsOpen } = useCart()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isHome = pathname === '/'
  const profilePhoto = profile.photo || ''
  const profileInitials = [profile.firstName, profile.lastName].filter(Boolean).map((name) => name[0]).join('').slice(0, 2).toUpperCase() || 'AT'

  useEffect(() => {
    const updateHeader = () => setIsScrolled(window.scrollY > 24)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    window.localStorage.setItem('apaterra-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    const syncProfile = () => setProfile(readProfile())
    const syncFromStorage = (event) => event.key === 'apaterra-profile' && syncProfile()
    window.addEventListener('apaterra-profile-updated', syncProfile)
    window.addEventListener('storage', syncFromStorage)
    return () => {
      window.removeEventListener('apaterra-profile-updated', syncProfile)
      window.removeEventListener('storage', syncFromStorage)
    }
  }, [])

  useEffect(() => {
    if (!accountMenuOpen) return undefined
    const closeOnOutsideInteraction = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

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

  function viewProfile() {
    setAccountMenuOpen(false)
    setMenuOpen(false)
    navigate('/account')
  }

  function logOut() {
    setAccountMenuOpen(false)
    setMenuOpen(false)
    window.localStorage.removeItem('apaterra-session')
    navigate('/login')
  }

  return (
    <>
      <div className="announcement-bar">
        <span>Rooted care for curls, coils & locs</span>
        <span>Free delivery in Accra over GH₵250</span>
      </div>
      <header
        className={`site-header${isHome ? ' home-header' : ''}${isScrolled ? ' is-scrolled' : ''}${
          searchOpen ? ' search-is-open' : ''
        }`}
      >
        <Link
          className="brand"
          to="/"
          aria-label="Apa Terra home"
          onClick={() => {
            setMenuOpen(false)
            setSearchOpen(false)
          }}
        >
          <BrandMark />
          <span className="header-brand-copy">
            <strong>Natural care</strong>
            <span>Textured hair</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <NavLink key={label} to={href}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <form className="header-search" role="search" onSubmit={submitSearch}>
            <button type="submit" aria-label="Submit product search">
              <Search size={17} />
            </button>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search"
              aria-label="Search products"
            />
          </form>
          <button
            type="button"
            className="cart-button"
            aria-label={`Shopping cart with ${itemCount} items`}
            onClick={() => {
              setSearchOpen(false)
              setIsOpen(true)
            }}
          >
            <ShoppingCart size={20} />
            <span className="cart-count">{itemCount}</span>
          </button>
          <button
            className={`theme-toggle${darkMode ? ' is-dark' : ''}`}
            type="button"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
            aria-pressed={darkMode}
            onClick={() => setDarkMode((current) => !current)}
          >
            {darkMode ? <Sun key="sun" size={18} /> : <Moon key="moon" size={18} />}
          </button>
          <form
            id="mobile-product-search"
            className={`mobile-search-panel${searchOpen ? ' is-open' : ''}`}
            role="search"
            aria-hidden={!searchOpen}
            onSubmit={submitSearch}
          >
            <input
              ref={mobileSearchInput}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search"
              aria-label="Search products"
              enterKeyHint="search"
              tabIndex={searchOpen ? 0 : -1}
            />
            <button
              type="button"
              className="mobile-search-close"
              aria-label="Close product search"
              tabIndex={searchOpen ? 0 : -1}
              onClick={() => setSearchOpen(false)}
            >
              <X size={16} />
            </button>
          </form>
          <button
            type="button"
            className={`mobile-search-button${searchOpen ? ' is-open' : ''}`}
            aria-controls="mobile-product-search"
            aria-expanded={searchOpen}
            aria-label={searchOpen ? 'Close product search' : 'Open product search'}
            onClick={handleMobileSearchButton}
          >
            <Search size={19} />
          </button>
          <div className="account-menu" ref={accountMenuRef}>
            <button
              type="button"
              className={`account-button${profilePhoto ? ' has-photo' : ''}`}
              aria-label="Open account menu"
              aria-expanded={accountMenuOpen}
              aria-controls="account-menu-options"
              onClick={() => {
                setAccountMenuOpen((isOpen) => !isOpen)
                setMenuOpen(false)
                setSearchOpen(false)
              }}
            >
              {profilePhoto ? <img src={profilePhoto} alt="" /> : <span className="account-monogram" aria-hidden="true">{profileInitials}</span>}
            </button>
            {accountMenuOpen && (
              <div id="account-menu-options" className="account-menu-options" role="menu">
                {pathname !== '/account' && (
                  <button type="button" role="menuitem" onClick={viewProfile}>
                    <UserRound size={16} /> View profile
                  </button>
                )}
                <button type="button" role="menuitem" onClick={logOut}>
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={`menu-button${menuOpen ? ' is-open' : ''}`}
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => {
              setMenuOpen((isOpen) => !isOpen)
              setSearchOpen(false)
            }}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div id="mobile-navigation" className={`mobile-menu${menuOpen ? ' is-open' : ''}`} aria-hidden={!menuOpen}>
          <p className="mobile-menu-label">Explore Apa Terra</p>
          <nav aria-label="Mobile navigation">
            {links.map(([label, href]) => (
              <NavLink key={label} to={href} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>
                <span>{label}</span>
                <ArrowUpRight size={17} />
              </NavLink>
            ))}
          </nav>
          <div className="mobile-menu-tools">
            <button
              type="button"
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => {
                setMenuOpen(false)
                navigate('/account')
              }}
            >
              <span>
                {profilePhoto ? (
                  <img className="mobile-menu-profile-photo" src={profilePhoto} alt="" />
                ) : (
                  <UserRound size={17} />
                )}{' '}
                My profile
              </span>
              <ArrowUpRight size={16} />
            </button>
            <button
              type="button"
              tabIndex={menuOpen ? 0 : -1}
              onClick={() => setDarkMode((current) => !current)}
            >
              <span>
                {darkMode ? <Sun size={17} /> : <Moon size={17} />} {darkMode ? 'Light mode' : 'Dark mode'}
              </span>
              <span className={`mobile-theme-switch${darkMode ? ' active' : ''}`} aria-hidden="true">
                <i />
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
