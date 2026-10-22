import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { createPortal } from 'react-dom'

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Keep it', tone = 'danger', busy = false, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [busy, onCancel, open])

  if (!open) return null
  return createPortal(
    <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={() => !busy && onCancel()}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="confirm-dialog-close" aria-label="Close" disabled={busy} onClick={onCancel}><X size={18} /></button>
        <span className={`confirm-dialog-icon is-${tone}`}><AlertTriangle size={22} /></span>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{description}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-keep" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className={`confirm-dialog-confirm is-${tone}`} disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </section>
    </div>,
    document.body,
  )
}
