import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldUser, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import loginAfro from '../assets/login-afro-wide.jpg'
import { useAuth } from '../context/auth-store'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { configured, recoveryMode, resetPassword, signIn, signUp, updatePassword } = useAuth()
  const returnTo = typeof location.state?.from === 'string' ? location.state.from : '/shop'

  async function handleSubmit(event) {
    event.preventDefault()
    if (!configured) {
      setNotice('Add your Supabase project URL and publishable key to .env.local first.')
      return
    }
    if (recoveryMode) {
      if (password.length < 8) {
        setNotice('Use at least 8 characters for your new password.')
        return
      }
      if (password !== confirmPassword) {
        setNotice('The passwords do not match.')
        return
      }

      setSubmitting(true)
      setNotice('')
      const { error } = await updatePassword(password)
      setSubmitting(false)
      if (error) {
        setNotice(error.message)
        return
      }
      navigate('/account', { replace: true })
      return
    }
    if (isForgotPassword) {
      if (!identifier.trim() || !identifier.includes('@')) {
        setNotice('Please enter a valid email address.')
        return
      }
      setSubmitting(true)
      setNotice('')
      const { error } = await resetPassword(identifier.trim().toLowerCase())
      setSubmitting(false)
      setNotice(error ? error.message : `Password reset instructions have been sent to ${identifier.trim()}.`)
      return
    }
    if (!identifier.trim() || !password) {
      setNotice('Please enter your email address and password.')
      return
    }

    if (!identifier.includes('@')) {
      setNotice('Please enter a valid email address.')
      return
    }

    if (isSignUp) {
      if (!fullName.trim()) {
        setNotice('Please enter your full name to create an account.')
        return
      }

    }

    setSubmitting(true)
    setNotice('')
    const email = identifier.trim().toLowerCase()
    const result = isSignUp
      ? await signUp({ email, password, fullName })
      : await signIn({ email, password })
    setSubmitting(false)

    if (result.error) {
      setNotice(result.error.message)
      return
    }

    if (isSignUp && !result.data.session) {
      setNotice('Account created. Check your email to confirm your address, then sign in.')
      return
    }

    setNotice(isSignUp ? 'Account created. Welcome to Apa Terra…' : 'Signed in. Welcome back…')
    navigate(returnTo, { replace: true })
  }

  return (
    <main className="inspo-login-page">
      <div className="inspo-login-body">
        <section className="inspo-login-form-col" aria-label="Account authentication">
          <div className="inspo-login-card">
            <div className="inspo-login-brand">
              <BrandMark />
              <span>Natural care for textured hair</span>
            </div>

            <header className="inspo-login-heading">
              <p>{recoveryMode ? 'Secure your account' : isForgotPassword ? 'Account recovery' : isSignUp ? 'Join Apaterra' : 'Welcome back'}</p>
              <h1>{recoveryMode ? 'Choose a new password.' : isForgotPassword ? 'Reset your password.' : isSignUp ? 'Begin your care journey.' : 'Care starts here.'}</h1>
              <span>
                {recoveryMode
                  ? 'Enter and confirm a new password for your Apaterra account.'
                  : isForgotPassword
                  ? 'Enter the email connected to your account and we’ll send you a secure reset link.'
                  : isSignUp
                  ? 'Create your account and make every wash day feel considered.'
                  : 'Sign in to continue your personalised hair-care journey.'}
              </span>
            </header>

            {!recoveryMode && !isForgotPassword && <div className="inspo-login-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={!isSignUp}
                className={`inspo-tab-btn ${!isSignUp ? 'active' : ''}`}
                onClick={() => {
                  setIsSignUp(false)
                  setNotice('')
                }}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isSignUp}
                className={`inspo-tab-btn ${isSignUp ? 'active' : ''}`}
                onClick={() => {
                  setIsSignUp(true)
                  setNotice('')
                }}
              >
                Sign up
              </button>
            </div>}

            <form className="inspo-login-form" onSubmit={handleSubmit} noValidate>
              {isSignUp && !recoveryMode && (
                <label className="inspo-pill-field">
                  <span className="inspo-field-badge" aria-hidden="true">
                    <UserRound size={15} strokeWidth={2} />
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      setNotice('')
                    }}
                    placeholder="Full name"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              {!recoveryMode && <label className="inspo-pill-field">
                <span className="inspo-field-badge" aria-hidden="true">
                  <ShieldUser size={15} strokeWidth={2} />
                </span>
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value)
                    setNotice('')
                  }}
                  placeholder="Email address"
                  autoComplete="username"
                  required
                />
              </label>}

              {(!isForgotPassword || recoveryMode) && <label className="inspo-pill-field">
                <span className="inspo-field-badge" aria-hidden="true">
                  <LockKeyhole size={15} strokeWidth={2} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setNotice('')
                  }}
                  placeholder={recoveryMode ? 'New password' : 'Password'}
                  autoComplete={isSignUp || recoveryMode ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className="inspo-eye-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </label>}

              {recoveryMode && (
                <label className="inspo-pill-field">
                  <span className="inspo-field-badge" aria-hidden="true">
                    <LockKeyhole size={15} strokeWidth={2} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setNotice('')
                    }}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                </label>
              )}

              {notice && (
                <p className="inspo-login-notice" role="status">
                  {notice}
                </p>
              )}

              <div className="inspo-login-actions">
                <button type="submit" className="inspo-submit-pill" disabled={submitting}>
                  <span>{submitting ? 'Please wait…' : recoveryMode ? 'Update password' : isForgotPassword ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in'}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>

                {!isSignUp && !recoveryMode && !isForgotPassword && (
                  <button
                    type="button"
                    className="inspo-forgot-link"
                    onClick={() => {
                      setIsForgotPassword(true)
                      setNotice('')
                      setPassword('')
                    }}
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
            </form>

            {!recoveryMode && <p className="inspo-account-switch">
              {isForgotPassword ? 'Remember your password?' : isSignUp ? 'Already have an account?' : 'New to Apaterra?'}{' '}
              <button
                type="button"
                onClick={() => {
                  if (isForgotPassword) {
                    setIsForgotPassword(false)
                    setIsSignUp(false)
                  } else {
                    setIsSignUp((current) => !current)
                  }
                  setNotice('')
                }}
              >
                {isForgotPassword ? 'Back to login' : isSignUp ? 'Log in' : 'Create an account'}
              </button>
            </p>}
          </div>
        </section>

        <div className="inspo-login-design-space">
          <figure className="inspo-login-portrait">
            <img src={loginAfro} alt="Black woman wearing a natural afro hairstyle" />
          </figure>
        </div>
      </div>
    </main>
  )
}
