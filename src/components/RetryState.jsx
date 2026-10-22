import { AlertCircle, RefreshCw } from 'lucide-react'

export default function RetryState({ title = 'This section could not be loaded.', message = '', onRetry, compact = false }) {
  return (
    <section className={`retry-state${compact ? ' is-compact' : ''}`} role="alert">
      <AlertCircle size={compact ? 17 : 22} />
      <div><strong>{title}</strong>{message && <p>{message}</p>}</div>
      {onRetry && <button type="button" onClick={onRetry}><RefreshCw size={14} /> Retry</button>}
    </section>
  )
}
