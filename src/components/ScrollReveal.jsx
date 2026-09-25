import { useEffect, useRef, useState } from 'react'

export default function ScrollReveal({ as: Tag = 'section', className = '', children, rootMargin = '0px 0px -18% 0px', threshold = 0.24 }) {
  const elementRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { rootMargin, threshold },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return <Tag ref={elementRef} className={`scroll-reveal ${isVisible ? 'is-visible' : ''} ${className}`.trim()}>{children}</Tag>
}
