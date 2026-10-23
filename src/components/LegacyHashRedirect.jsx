import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export default function LegacyHashRedirect() {
  const { hash } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hash.startsWith('#/')) return
    navigate(hash.slice(1), { replace: true })
  }, [hash, navigate])

  return null
}
