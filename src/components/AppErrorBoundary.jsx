import { Component } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { captureRenderError } from '../lib/monitoring'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Apa Terra application error', error, info)
    captureRenderError(error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="app-error-page">
        <section className="app-error-card" role="alert">
          <span className="app-error-icon"><AlertTriangle size={25} /></span>
          <p className="eyebrow">Something went wrong</p>
          <h1>We couldn’t finish loading this page.</h1>
          <p>Your account and order information are safe. Try loading the page again.</p>
          <div>
            <button type="button" onClick={() => window.location.reload()}><RefreshCw size={16} /> Try again</button>
            <a href={import.meta.env.BASE_URL}><Home size={16} /> Return home</a>
          </div>
        </section>
      </main>
    )
  }
}
