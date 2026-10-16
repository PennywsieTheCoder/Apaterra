import { useRef, useState } from 'react'
import { Camera, Check, ChevronRight, Heart, KeyRound, Leaf, LockKeyhole, MapPin, MonitorSmartphone, Package, ShieldCheck, Smartphone, Sparkles, Trash2, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatMoney, hairNeeds } from '../data/catalog'

const regions = [
  'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
  'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West',
  'Volta', 'Western', 'Western North',
]

const emptyProfile = {
  firstName: '', lastName: '', email: '', phone: '', region: '', city: '', address: '',
  hairNeeds: [], emailUpdates: true, photo: '',
}

function readProfile() {
  try {
    const saved = JSON.parse(window.localStorage.getItem('apaterra-profile') || '{}')
    return { ...emptyProfile, ...saved, hairNeeds: Array.isArray(saved.hairNeeds) ? saved.hairNeeds : [] }
  } catch {
    return emptyProfile
  }
}

function readOrders() {
  try {
    const saved = JSON.parse(window.localStorage.getItem('apaterra-orders') || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

const accountTabs = [
  { id: 'overview', label: 'My details', icon: UserRound },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'address', label: 'Delivery', icon: MapPin },
  { id: 'preferences', label: 'Hair profile', icon: Heart },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState(readProfile)
  const [savedProfile, setSavedProfile] = useState(readProfile)
  const [orders] = useState(readOrders)
  const [saved, setSaved] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const [securityMessage, setSecurityMessage] = useState('')
  const photoInputRef = useRef(null)

  const fullName = [savedProfile.firstName, savedProfile.lastName].filter(Boolean).join(' ')
  const initials = [savedProfile.firstName, savedProfile.lastName].filter(Boolean).map((value) => value[0]).join('').slice(0, 2).toUpperCase() || 'AT'

  const milestones = [
    {
      id: 'identity',
      title: 'Personal Info',
      tab: 'overview',
      icon: UserRound,
      isComplete: Boolean(savedProfile.firstName?.trim() && savedProfile.email?.trim()),
      completedLabel: [savedProfile.firstName, savedProfile.lastName].filter(Boolean).join(' ') || 'Saved',
      pendingLabel: 'Add name & email',
      actionLabel: 'Complete details',
      description: 'Add your name and email to enable order receipts & care guidance.',
    },
    {
      id: 'address',
      title: 'Delivery Address',
      tab: 'address',
      icon: MapPin,
      isComplete: Boolean(savedProfile.region?.trim() && savedProfile.city?.trim() && savedProfile.address?.trim()),
      completedLabel: savedProfile.city ? `${savedProfile.city}, ${savedProfile.region}` : (savedProfile.region || 'Saved'),
      pendingLabel: 'Add shipping address',
      actionLabel: 'Add address',
      description: 'Set your region, town and street for 1-click express checkout.',
    },
    {
      id: 'hair',
      title: 'Hair & Scalp Profile',
      tab: 'preferences',
      icon: Heart,
      isComplete: Boolean(savedProfile.hairNeeds && savedProfile.hairNeeds.length > 0),
      completedLabel: `${savedProfile.hairNeeds.length} ${savedProfile.hairNeeds.length === 1 ? 'goal' : 'goals'} set`,
      pendingLabel: 'Select hair goals',
      actionLabel: 'Choose goals',
      description: 'Tell us what your crown needs to surface tailored botanicals.',
    },
    {
      id: 'portrait',
      title: 'Profile Photo',
      tab: 'overview',
      icon: Camera,
      isComplete: Boolean(savedProfile.photo),
      completedLabel: 'Photo uploaded',
      pendingLabel: 'Add profile picture',
      actionLabel: 'Upload photo',
      description: 'Personalize your profile with an avatar for a tailored experience.',
      isPhotoUpload: true,
    },
  ]

  const completedCount = milestones.filter((m) => m.isComplete).length
  const completion = Math.round((completedCount / milestones.length) * 100)
  const nextMilestone = milestones.find((m) => !m.isComplete)
  const primaryHairNeed = hairNeeds.find((item) => savedProfile.hairNeeds.includes(item.name))

  function navigateToMilestone(tabId, isPhoto) {
    if (isPhoto && !savedProfile.photo) {
      photoInputRef.current?.click()
    } else {
      setActiveTab(tabId)
      const layout = document.querySelector('.account-layout')
      if (layout && window.innerWidth <= 900) {
        layout.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setProfile((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setSaved(false)
  }

  function toggleHairNeed(need) {
    setProfile((current) => ({
      ...current,
      hairNeeds: current.hairNeeds.includes(need)
        ? current.hairNeeds.filter((item) => item !== need)
        : [...current.hairNeeds, need],
    }))
    setSaved(false)
  }

  function saveProfile(event) {
    event.preventDefault()
    window.localStorage.setItem('apaterra-profile', JSON.stringify(profile))
    window.dispatchEvent(new CustomEvent('apaterra-profile-updated'))
    setSavedProfile(profile)
    setSaved(true)
  }

  function updatePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setPhotoError('Choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Choose an image smaller than 2 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const nextSavedProfile = { ...savedProfile, photo: reader.result }
      setProfile((current) => ({ ...current, photo: reader.result }))
      setSavedProfile(nextSavedProfile)
      window.localStorage.setItem('apaterra-profile', JSON.stringify(nextSavedProfile))
      window.dispatchEvent(new CustomEvent('apaterra-profile-updated', { detail: { photo: reader.result } }))
      setPhotoError('')
      setSaved(true)
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function explainSecurity(action) {
    if (action === 'password' && !savedProfile.email) {
      setSecurityMessage('Add and save your email address in My details before requesting a password reset.')
      return
    }
    const messages = {
      password: `Password reset is ready to send to ${savedProfile.email}, once secure account authentication is connected.`,
      mfa: 'MFA setup requires a secure authentication service to generate and verify your one-time codes.',
      sessions: 'Session management will become available when customer sign-in is connected.',
    }
    setSecurityMessage(messages[action])
  }

  return <main className={`account-page account-redesign${completion === 100 ? ' account-complete' : ''}`}>
    <section className="account-hero">
      <div className="account-hero-inner">
        <div className="account-app-profile">
          <div className="account-avatar-control">
            <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={updatePhoto} hidden />
            <button
              type="button"
              className={`account-avatar${savedProfile.photo ? ' has-photo' : ''}`}
              aria-label={savedProfile.photo ? 'Change profile picture' : 'Add profile picture'}
              onClick={() => photoInputRef.current?.click()}
            >
              {savedProfile.photo ? <img src={savedProfile.photo} alt={`${fullName || 'Customer'} profile`} /> : initials}
              <span className="account-avatar-edit"><Camera size={12} /></span>
            </button>
          </div>
          <div>
            <small>My Apa Terra</small>
            <strong>{fullName || 'Welcome to Apa Terra'}</strong>
            <span>{photoError || savedProfile.email || 'Complete your account details'}</span>
          </div>
        </div>

        {completion < 100 && <div className="account-dashboard-card">
          <div className="account-dashboard-card-heading">
            <div className="account-progress-title-block">
              <div className="account-progress-eyebrow">
                <Leaf size={12} />
                <span>Care Profile Journey</span>
              </div>
              <h2>Care Profile Progress</h2>
              <p className="account-progress-status-note">
                {completion === 100
                  ? 'Your profile is fully prepared for personalized care and 1-click checkout.'
                  : 'A few details make checkout faster and unlock personalized routine recommendations.'}
              </p>
            </div>

            <div className="account-progress-gauge" aria-label="Care profile progress">
              <svg className="progress-ring" width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
                <defs>
                  <linearGradient id="apaterraProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c5a367" />
                    <stop offset="100%" stopColor="#f2d7a6" />
                  </linearGradient>
                </defs>
                <circle
                  className="progress-ring-track"
                  cx="38"
                  cy="38"
                  r="31"
                  fill="transparent"
                  strokeWidth="5"
                />
                <circle
                  className="progress-ring-fill"
                  cx="38"
                  cy="38"
                  r="31"
                  fill="transparent"
                  stroke="url(#apaterraProgressGradient)"
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 31}
                  strokeDashoffset={2 * Math.PI * 31 * (1 - completedCount / milestones.length)}
                  strokeLinecap="round"
                  transform="rotate(-90 38 38)"
                />
              </svg>
              <div className="progress-gauge-value icon-only">
                {completion === 100 ? (
                  <Check size={22} className="gauge-icon complete" />
                ) : (
                  <Leaf size={19} className="gauge-icon in-progress" />
                )}
              </div>
            </div>
          </div>

          <div className="account-milestones-grid">
            {milestones.map((m, idx) => {
              const Icon = m.icon
              const isNext = nextMilestone?.id === m.id
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`account-milestone-pill ${m.isComplete ? 'is-complete' : 'is-pending'} ${isNext ? 'is-next' : ''}`}
                  onClick={() => navigateToMilestone(m.tab, m.isPhotoUpload)}
                  title={m.isComplete ? `${m.title}: Completed (${m.completedLabel})` : `${m.title}: Click to complete`}
                >
                  <div className="milestone-pill-top">
                    <span className="milestone-icon-wrap">
                      <Icon size={14} />
                    </span>
                    <span className="milestone-step-tag">
                      {m.isComplete ? (
                        <span className="tag-done"><Check size={11} /> Done</span>
                      ) : isNext ? (
                        <span className="tag-next">Next</span>
                      ) : (
                        <span className="tag-step">0{idx + 1}</span>
                      )}
                    </span>
                  </div>
                  <div className="milestone-text">
                    <strong className="milestone-title">{m.title}</strong>
                    <span className="milestone-status">{m.isComplete ? m.completedLabel : m.pendingLabel}</span>
                  </div>
                  <div className="milestone-indicator-line">
                    <span className={`indicator-fill ${m.isComplete ? 'filled' : isNext ? 'next' : ''}`} />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="account-dashboard-footer">
            {completion < 100 && nextMilestone ? (
              <div className="account-progress-next-action">
                <div className="next-action-info">
                  <span className="next-action-pill">Next Step</span>
                  <p>{nextMilestone.description}</p>
                </div>
                <button
                  type="button"
                  className="next-action-btn"
                  onClick={() => navigateToMilestone(nextMilestone.tab, nextMilestone.isPhotoUpload)}
                >
                  <span>{nextMilestone.actionLabel}</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            ) : (
              <div className="account-progress-celebration">
                <div className="celebration-content">
                  <Sparkles size={18} className="celebration-icon" />
                  <div>
                    <strong>Care Profile Prepared</strong>
                    <p>Express checkout and bespoke hair recommendations are unlocked across Apa Terra.</p>
                  </div>
                </div>
                <Link
                  to={primaryHairNeed ? `/shop?need=${encodeURIComponent(primaryHairNeed.name)}` : '/shop'}
                  className="celebration-link"
                >
                  <span>Shop Your Focus</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            )}

            <div className="account-dashboard-quick-stats">
              <button type="button" className="quick-stat-chip" onClick={() => setActiveTab('orders')} title="View order history">
                <Package size={13} />
                <span><strong>{orders.length}</strong> {orders.length === 1 ? 'Order' : 'Orders'}</span>
              </button>
              <button type="button" className="quick-stat-chip" onClick={() => setActiveTab('preferences')} title="View hair profile">
                <Heart size={13} />
                <span><strong>{savedProfile.hairNeeds.length}</strong> {savedProfile.hairNeeds.length === 1 ? 'Goal' : 'Goals'}</span>
              </button>
              <button type="button" className="quick-stat-chip" onClick={() => setActiveTab('address')} title="View delivery address">
                <MapPin size={13} />
                <span>{savedProfile.city || savedProfile.region || 'Add address'}</span>
              </button>
            </div>
          </div>
        </div>}
      </div>
    </section>

    <div className="account-layout">
      <aside className="account-sidebar">
        <div className="account-sidebar-title"><Leaf size={16} /><span>Your account</span></div>
        <nav aria-label="Account sections">
          {accountTabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={activeTab === id ? 'active' : ''} aria-selected={activeTab === id} onClick={() => setActiveTab(id)}><Icon size={17} /><span>{label}</span><ChevronRight size={15} /></button>)}
        </nav>
        <div className="account-privacy-note"><ShieldCheck size={18} /><p><strong>Private on this device</strong><span>Your details stay in this browser until account sign-in is connected.</span></p></div>
      </aside>

      <section className="account-content">
        {activeTab === 'overview' && <>
          <div className="account-section-heading">
            <div>
              <p className="eyebrow">Personal details</p>
              <h2>Tell us who you are.</h2>
            </div>
            <span className="account-progress-badge">
              <Check size={13} />
              <span>Care Profile</span>
            </span>
          </div>
          {primaryHairNeed ? <article className="account-care-snapshot"><img src={primaryHairNeed.image} alt="" /><div><span>Your primary focus</span><h3>{primaryHairNeed.name}</h3><p>{primaryHairNeed.description}. We’ll use this to surface more relevant care.</p></div><Link to={`/shop?need=${encodeURIComponent(primaryHairNeed.name)}`}>Shop this need</Link></article> : <article className="account-care-snapshot empty"><span><Leaf size={20} /></span><div><span>Personalise your care</span><h3>Add your hair goals</h3><p>Tell us what your hair needs and we’ll make the collection easier to navigate.</p></div><button type="button" onClick={() => setActiveTab('preferences')}>Build hair profile</button></article>}
          <form className="account-form" onSubmit={saveProfile}>
            <div className="account-fields two-columns">
              <label><span>First name</span><input name="firstName" autoComplete="given-name" value={profile.firstName} onChange={updateField} /></label>
              <label><span>Last name</span><input name="lastName" autoComplete="family-name" value={profile.lastName} onChange={updateField} /></label>
              <label><span>Email address</span><input type="email" name="email" autoComplete="email" value={profile.email} onChange={updateField} /></label>
              <label><span>Phone number</span><input type="tel" name="phone" autoComplete="tel" inputMode="tel" placeholder="+233" value={profile.phone} onChange={updateField} /></label>
            </div>
            <div className="account-form-footer"><p>{saved && <><Check size={15} /> Changes saved</>}</p><button type="submit">Save details</button></div>
          </form>
        </>}

        {activeTab === 'orders' && <>
          <div className="account-section-heading"><div><p className="eyebrow">Order history</p><h2>Your recent care.</h2></div><span>{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></div>
          {orders.length ? <div className="account-orders">{orders.map((order) => <article key={order.reference}>
            <div className="account-order-top"><div><span>{order.reference}</span><strong>{new Date(order.date).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div><i>{order.status}</i></div>
            <div className="account-order-items">{order.items?.map((item) => <div key={item.id}><img src={item.image} alt="" /><p><strong>{item.name}</strong><span>{item.size} · Qty {item.quantity}</span></p><b>{formatMoney(item.price * item.quantity)}</b></div>)}</div>
            <div className="account-order-total"><span>{order.paymentMethod === 'delivery' ? 'Pay on delivery' : 'Mobile Money'} · Products total</span><strong>{formatMoney(order.subtotal)}</strong></div>
          </article>)}</div> : <div className="account-empty-state"><span><Package size={28} /></span><h3>Your order history starts here.</h3><p>Once you place an order request, you’ll be able to revisit its details here.</p><Link className="button button-primary" to="/shop">Shop the collection</Link></div>}
        </>}

        {activeTab === 'address' && <>
          <div className="account-section-heading"><div><p className="eyebrow">Delivery details</p><h2>Your saved address.</h2></div><MapPin size={22} /></div>
          <form className="account-form" onSubmit={saveProfile}>
            <div className="account-fields two-columns">
              <label><span>Region</span><select name="region" value={profile.region} onChange={updateField}><option value="">Select your region</option>{regions.map((region) => <option key={region}>{region}</option>)}</select></label>
              <label><span>Town or city</span><input name="city" autoComplete="address-level2" value={profile.city} onChange={updateField} /></label>
              <label className="full-width"><span>Delivery address</span><textarea name="address" rows="4" autoComplete="street-address" placeholder="House number, street and area" value={profile.address} onChange={updateField} /></label>
            </div>
            <div className="account-form-footer"><p>{saved && <><Check size={15} /> Address saved</>}</p><button type="submit">Save address</button></div>
          </form>
        </>}

        {activeTab === 'preferences' && <>
          <div className="account-section-heading"><div><p className="eyebrow">Hair profile</p><h2>What does your hair need?</h2><p>Choose all that apply to help us make your shopping experience more relevant.</p></div><Heart size={22} /></div>
          <form className="account-form" onSubmit={saveProfile}>
            <div className="account-need-grid">{hairNeeds.map((need) => {
              const selected = profile.hairNeeds.includes(need.name)
              return <button key={need.name} type="button" className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => toggleHairNeed(need.name)}><img src={need.image} alt="" /><span><strong>{need.name}</strong><small>{need.description}</small></span>{selected && <Check size={17} />}</button>
            })}</div>
            <label className="account-checkbox"><input type="checkbox" name="emailUpdates" checked={profile.emailUpdates} onChange={updateField} /><span><strong>Notes from Apa Terra</strong><small>Receive care guidance, product news and thoughtful routine tips.</small></span></label>
            <div className="account-form-footer"><p>{saved && <><Check size={15} /> Preferences saved</>}</p><button type="submit">Save preferences</button></div>
          </form>
        </>}

        {activeTab === 'security' && <>
          <div className="account-section-heading"><div><p className="eyebrow">Account security</p><h2>Protect your account.</h2><p>Manage password recovery, multi-factor authentication and signed-in devices.</p></div><LockKeyhole size={22} /></div>
          <div className="security-connection-note"><ShieldCheck size={19} /><div><strong>Authentication connection required</strong><p>This profile currently lives only in this browser. Connect a secure authentication backend before these controls can protect a real customer account.</p></div></div>
          <div className="security-settings">
            <article><span className="security-setting-icon"><KeyRound size={20} /></span><div><div className="security-setting-title"><h3>Password</h3><span>Not connected</span></div><p>Send a secure password-reset link to your verified account email.</p><small>{savedProfile.email ? `Recovery email: ${savedProfile.email}` : 'No recovery email saved'}</small></div><button type="button" onClick={() => explainSecurity('password')}>Request reset</button></article>
            <article><span className="security-setting-icon"><Smartphone size={20} /></span><div><div className="security-setting-title"><h3>Multi-factor authentication</h3><span>Not active</span></div><p>Add an authenticator app or SMS verification, with downloadable backup codes.</p><small>Recommended for every customer account</small></div><button type="button" onClick={() => explainSecurity('mfa')}>Set up MFA</button></article>
            <article><span className="security-setting-icon"><MonitorSmartphone size={20} /></span><div><div className="security-setting-title"><h3>Active sessions</h3><span>This browser</span></div><p>Review devices signed into your account and sign out sessions you do not recognise.</p><small>Session history requires customer sign-in</small></div><button type="button" onClick={() => explainSecurity('sessions')}>Review sessions</button></article>
          </div>
          {securityMessage && <div className="security-status" role="status"><ShieldCheck size={17} /><p>{securityMessage}</p><button type="button" aria-label="Dismiss security message" onClick={() => setSecurityMessage('')}><Trash2 size={14} /></button></div>}
        </>}
      </section>
    </div>
  </main>
}
