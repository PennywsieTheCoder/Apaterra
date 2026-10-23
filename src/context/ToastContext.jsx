import { useCallback, useMemo, useState } from 'react'
import { AlertCircle, Check, X } from 'lucide-react'
import { ToastContext } from './toast-store'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((message, options = {}) => {
    const id = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    const toast = {
      id,
      message,
      type: options.type || 'success',
      actionLabel: options.actionLabel,
      onAction: options.onAction,
    }
    setToasts((current) => [...current.slice(-2), toast])
    window.setTimeout(() => dismissToast(id), options.duration || 4200)
    return id
  }, [dismissToast])

  const value = useMemo(() => ({ dismissToast, pushToast }), [dismissToast, pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`app-toast is-${toast.type}`} role="status" key={toast.id}>
            <span>{toast.type === 'error' ? <AlertCircle size={17} /> : <Check size={17} />}</span>
            <p>{toast.message}</p>
            <div className="app-toast-actions">
              {toast.actionLabel && toast.onAction && <button type="button" className="app-toast-action" onClick={() => { toast.onAction(); dismissToast(toast.id) }}>{toast.actionLabel}</button>}
              <button type="button" aria-label="Dismiss notification" onClick={() => dismissToast(toast.id)}><X size={15} /></button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
