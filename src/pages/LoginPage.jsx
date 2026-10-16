import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import heroImage from '../assets/apaterra-hero-v4.png'
import routineImage from '../assets/apaterra-routine-v1.png'
import protectiveImage from '../assets/hair-needs/protective-styles-v3.png'

const slides = [
  {
    image: heroImage,
    title: 'Stay rooted.',
    subtitle: 'Crown your texture.',
  },
  {
    image: routineImage,
    title: 'Pure botanicals.',
    subtitle: 'Step-by-step care.',
  },
  {
    image: protectiveImage,
    title: 'Care without compromise.',
    subtitle: 'Nourished coils & braids.',
  },
]

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const navigate = useNavigate()

  // Auto-advance slide every 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    if (!email.trim() || !password) {
      setNotice('Please enter your email and password.')
      return
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        setNotice('Please enter your full name to create an account.')
        return
      }

      const parts = fullName.trim().split(' ')
      const firstName = parts[0] || 'Valued'
      const lastName = parts.slice(1).join(' ') || 'Customer'

      try {
        const existing = JSON.parse(window.localStorage.getItem('apaterra-profile') || '{}')
        const newProfile = {
          ...existing,
          firstName,
          lastName,
          email: email.trim(),
        }
        window.localStorage.setItem('apaterra-profile', JSON.stringify(newProfile))
        window.dispatchEvent(new CustomEvent('apaterra-profile-updated', { detail: newProfile }))
      } catch {
        // Fallback gracefully
      }
    }

    window.localStorage.setItem(
      'apaterra-session',
      JSON.stringify({ email: email.trim(), signedInAt: new Date().toISOString() })
    )

    setNotice(isSignUp ? 'Account created! Opening your profile…' : 'Signed in. Welcome back…')
    setTimeout(() => navigate('/account'), 300)
  }

  function handleSocialLogin(provider) {
    setNotice(`Connecting securely with ${provider}…`)
    setTimeout(() => {
      const demoEmail = `member@${provider.toLowerCase()}.com`
      window.localStorage.setItem(
        'apaterra-session',
        JSON.stringify({ email: demoEmail, signedInAt: new Date().toISOString() })
      )
      navigate('/account')
    }, 450)
  }

  return (
    <main className="flow-login-page">
      <div className="flow-login-frame">
        {/* Left Column: Visual Card with bottom-left pill badge */}
        <div className="flow-visual-card">
          <Link to="/" className="flow-back-home" title="Return to store">
            <ArrowLeft size={15} />
            <span>Store</span>
          </Link>
          {slides.map((slide, index) => (
            <img
              key={slide.title}
              src={slide.image}
              alt={slide.subtitle}
              className={`flow-visual-img ${index === activeSlide ? 'is-active' : ''}`}
            />
          ))}
          <div className="flow-visual-gradient" />

          {/* Bottom-left pill badge from inspo */}
          <div className="flow-visual-badge">
            <span className="flow-badge-icon">
              <Leaf size={16} />
            </span>
            <div className="flow-badge-text">
              <strong>{slides[activeSlide].title}</strong>
              <span>{slides[activeSlide].subtitle}</span>
            </div>
          </div>
        </div>

        {/* Center seam carousel indicator dots */}
        <div className="flow-carousel-dots" role="tablist" aria-label="Slide navigation">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`flow-dot ${index === activeSlide ? 'is-active' : ''}`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Right Column: Warm Ambient Gradient Form Card */}
        <div className="flow-form-card">
          {/* Top-Right Toggle Link */}
          <div className="flow-top-switch">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false)
                    setNotice('')
                  }}
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true)
                    setNotice('')
                  }}
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>

          <form className="flow-form-content" onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flow-heading">
              <h1>{isSignUp ? 'Build Your Profile' : 'Welcome Back'}</h1>
              <p>
                {isSignUp
                  ? 'Create your account and get started with a clear mind'
                  : 'Sign in to access your saved hair profile and orders'}
              </p>
            </div>

            {/* Inputs */}
            <div className="flow-input-group">
              {isSignUp && (
                <div className="flow-input-wrap">
                  <UserRound size={17} className="flow-input-icon" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setNotice('')
                    }}
                    placeholder="Full Name"
                    autoComplete="name"
                    required
                  />
                </div>
              )}

              <div className="flow-input-wrap">
                <Mail size={17} className="flow-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setNotice('')
                  }}
                  placeholder="Email Address"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flow-input-wrap">
                <LockKeyhole size={17} className="flow-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setNotice('')
                  }}
                  placeholder="Password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className="flow-eye-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {notice && (
              <p className="flow-notice" role="status">
                {notice}
              </p>
            )}

            {/* Main Action Button */}
            <button className="flow-submit-btn" type="submit">
              <span>{isSignUp ? 'Sign Up' : 'Log In'}</span>
              <ArrowRight size={17} />
            </button>

            {/* Divider */}
            <div className="flow-divider">
              <span>or continue with</span>
            </div>

            {/* Social Buttons */}
            <div className="flow-social-grid">
              <button
                type="button"
                className="flow-social-btn"
                onClick={() => handleSocialLogin('Google')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16.4C3.7 20.1 7.5 23.5 12 23.5z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                className="flow-social-btn"
                onClick={() => handleSocialLogin('Apple')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.15.65-2.82 1.44-.59.68-1.11 1.77-.97 2.84 1.13.09 2.22-.56 2.83-1.33z" />
                </svg>
                <span>Apple</span>
              </button>

              <button
                type="button"
                className="flow-social-btn"
                onClick={() => handleSocialLogin('Mobile')}
              >
                <Smartphone size={15} />
                <span>Phone</span>
              </button>
            </div>

            {/* Legal text */}
            <p className="flow-legal">
              By signing up, you agree to our<br />
              <button type="button" className="flow-legal-link">Terms of Service</button> and{' '}
              <button type="button" className="flow-legal-link">Privacy Policy</button>
            </p>
          </form>
        </div>
      </div>
    </main>
  )
}
