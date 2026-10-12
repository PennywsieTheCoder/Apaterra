import { useLayoutEffect, useRef } from 'react'

export default function ScrollReveal({ as: Tag = 'section', className = '', children, rootMargin = '0px 0px -8% 0px', threshold = 0.08 }) {
  const elementRef = useRef(null)

  useLayoutEffect(() => {
    const element = elementRef.current
    if (!element) return undefined

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const siblingIndex = element.parentElement ? [...element.parentElement.children].indexOf(element) : 0
    element.style.setProperty('--reveal-delay', `${Math.min(Math.max(siblingIndex, 0) * 70, 280)}ms`)

    if (reducedMotion || !('IntersectionObserver' in window)) {
      element.classList.add('is-visible')
      return () => element.style.removeProperty('--reveal-delay')
    }

    let observer
    const frame = window.requestAnimationFrame(() => {
      observer = new IntersectionObserver(([entry]) => {
        element.classList.toggle('is-visible', entry.isIntersecting)
      }, { rootMargin, threshold })
      observer.observe(element)
    })

    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
      element.classList.remove('is-visible')
      element.style.removeProperty('--reveal-delay')
    }
  }, [rootMargin, threshold])

  return <Tag ref={elementRef} className={`scroll-reveal ${className}`.trim()}>{children}</Tag>
}
