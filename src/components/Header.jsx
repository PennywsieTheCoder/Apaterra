import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Bell, LogOut, Moon, Search, ShoppingCart, Sun, UserRound, X } from 'lucide-react'
import BrandMark from './BrandMark'
import { useCart } from '../context/cart-store'
import { useAuth } from '../context/auth-store'
import { useToast } from '../context/toast-store'
import { supabase } from '../lib/supabase'

const links = [['Shop', '/shop'], ['Routines', '/routines'], ['Hair needs', '/hair-needs'], ['Our story', '/story']]

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
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isClearingNotifications, setIsClearingNotifications] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = window.localStorage.getItem('apaterra-theme')
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const mobileSearchInput = useRef(null)
  const accountMenuRef = useRef(null)
  const notificationsRef = useRef(null)
  const { itemCount, setIsOpen } = useCart()
  const { profile: authProfile, role, signOut, user } = useAuth()
  const { pushToast } = useToast()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isHome = pathname === '/'
  const navigationLinks = role === 'admin' ? [...links, ['Admin', '/admin']] : links
  const profilePhoto = user ? authProfile?.photo_url || '' : profile.photo || ''
  const profileInitials = [
    user ? authProfile?.first_name || user.user_metadata?.first_name : profile.firstName,
    user ? authProfile?.last_name || user.user_metadata?.last_name : profile.lastName,
  ]
    .filter(Boolean).map((name) => name[0]).join('').slice(0, 2).toUpperCase() || 'AT'
  const profileName = [
    user ? authProfile?.first_name || user.user_metadata?.first_name : profile.firstName,
    user ? authProfile?.last_name || user.user_metadata?.last_name : profile.lastName,
  ].filter(Boolean).join(' ') || user?.email || 'Your account'

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

  useEffect(() => {
    if (!notificationsOpen) return undefined
    const closeOnOutsideInteraction = (event) => {
      if (!notificationsRef.current?.contains(event.target)) setNotificationsOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideInteraction)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideInteraction)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [notificationsOpen])

  useEffect(() => {
    if (!supabase || !user?.id) {
      setNotifications([])
      return undefined
    }
    let active = true
    const loadNotifications = () => {
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => { if (active) setNotifications(data || []) })
    }
    loadNotifications()
    window.addEventListener('apaterra-notifications-cleared', loadNotifications)
    const channel = supabase
      .channel(`header-notifications-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, ({ new: notification }) => {
        setNotifications((current) => current.some((item) => item.id === notification.id) ? current : [notification, ...current].slice(0, 5))
      })
      .subscribe()
    return () => {
      active = false
      window.removeEventListener('apaterra-notifications-cleared', loadNotifications)
      supabase.removeChannel(channel)
    }
  }, [user?.id])

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
    setNotificationsOpen(false)
    setAccountMenuOpen(false)
    requestAnimationFrame(() => mobileSearchInput.current?.focus())
  }

  function viewProfile() {
    setAccountMenuOpen(false)
    setMenuOpen(false)
    navigate('/account')
  }

  async function logOut() {
    setAccountMenuOpen(false)
    setMenuOpen(false)
    await signOut()
    navigate('/login')
  }

  function openNotifications() {
    setNotificationsOpen((current) => !current)
    setAccountMenuOpen(false)
    setMenuOpen(false)
    setSearchOpen(false)
  }

  async function markAllNotificationsRead() {
    if (!notifications.some((notification) => !notification.read_at) || !supabase) return
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at || readAt })))
    await supabase.from('notifications').update({ read_at: readAt }).is('read_at', null)
  }

  async function clearReadNotifications() {
    if (!supabase || !user?.id || isClearingNotifications || !notifications.some((notification) => notification.read_at)) return
    setIsClearingNotifications(true)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .not('read_at', 'is', null)
    setIsClearingNotifications(false)
    if (error) {
      pushToast('Read notifications could not be cleared. Please try again.', { type: 'error' })
      return
    }
    setNotifications((current) => current.filter((notification) => !notification.read_at))
    window.dispatchEvent(new Event('apaterra-notifications-cleared'))
    pushToast('Read notifications cleared.')
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
          {navigationLinks.map(([label, href]) => (
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
              setNotificationsOpen(false)
              setMenuOpen(false)
              setIsOpen(true)
            }}
          >
            <ShoppingCart size={20} />
            <span className="cart-count" key={itemCount}>{itemCount}</span>
          </button>
          {user && (
            <div className="header-notification-menu" ref={notificationsRef}>
              <button type="button" className={`header-notification-button${notifications.some((notification) => !notification.read_at) ? ' has-unread' : ''}`} aria-label="Open notifications" aria-expanded={notificationsOpen} onClick={openNotifications}>
                <Bell size={18} />
              </button>
              {notificationsOpen && (
                <div className="header-notification-popover" role="status">
                  <div className="header-notification-popover-head"><strong>Notifications</strong><span>{notifications.length}</span><div className="header-notification-actions">{notifications.some((notification) => !notification.read_at) && <button type="button" onClick={markAllNotificationsRead}>Mark all read</button>}{notifications.some((notification) => notification.read_at) && <button type="button" disabled={isClearingNotifications} onClick={clearReadNotifications}>{isClearingNotifications ? 'Clearing…' : 'Clear read'}</button>}</div></div>
                  {notifications.length ? notifications.map((notification) => (
                    <button type="button" key={notification.id} className={`header-notification-item${notification.read_at ? '' : ' unread'}`} onClick={() => { setNotificationsOpen(false); navigate(notification.order_id ? `/account?tab=orders&order=${encodeURIComponent(notification.order_id)}` : '/account?tab=notifications') }}><strong>{notification.title}</strong><p>{notification.message}</p></button>
                  )) : <p className="header-notification-empty">You’re all caught up.</p>}
                  <button type="button" className="header-notification-view-all" onClick={() => { setNotificationsOpen(false); navigate('/account?tab=notifications') }}>View all activity</button>
                </div>
              )}
            </div>
          )}
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
                {user && pathname !== '/account' && (
                  <button type="button" role="menuitem" onClick={viewProfile}>
                    <UserRound size={16} /> View profile
                  </button>
                )}
                {user ? (
                  <button type="button" role="menuitem" onClick={logOut}>
                    <LogOut size={16} /> Log out
                  </button>
                ) : (
                  <button type="button" role="menuitem" onClick={() => navigate('/login')}>
                    <UserRound size={16} /> Log in
                  </button>
                )}
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
              setNotificationsOpen(false)
              setAccountMenuOpen(false)
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
            {navigationLinks.map(([label, href]) => (
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
                navigate(user ? '/account' : '/login')
              }}
            >
              <span className="mobile-menu-account">
                {profilePhoto ? (
                  <img className="mobile-menu-profile-photo" src={profilePhoto} alt="" />
                ) : (
                  <span className="mobile-menu-profile-monogram" aria-hidden="true">{profileInitials}</span>
                )}
                <span className="mobile-menu-account-copy">
                  <strong>{user ? profileName : 'Sign in'}</strong>
                  <small>{user ? 'View your profile' : 'Access your account'}</small>
                </span>
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
            {user && (
              <button type="button" className="mobile-menu-logout" tabIndex={menuOpen ? 0 : -1} onClick={logOut}>
                <span><LogOut size={17} /> Log out</span>
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
