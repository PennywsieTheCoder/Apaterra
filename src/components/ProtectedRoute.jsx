import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth-store'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { configured, loading, role, user } = useAuth()
  const location = useLocation()

  if (!configured) {
    return (
      <main className="auth-gate-page">
        <section>
          <p className="eyebrow">Authentication setup</p>
          <h1>Connect Supabase to continue.</h1>
          <p>Add the project URL and publishable key to your local environment file.</p>
        </section>
      </main>
    )
  }

  if (loading || (user && role === null)) {
    return <main className="auth-gate-page" aria-label="Loading account"><span className="auth-loader" /></main>
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (requireAdmin && role !== 'admin') return <Navigate to="/account" replace />

  return children
}
