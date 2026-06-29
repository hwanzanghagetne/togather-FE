import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { apiFetch } from '../api'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'unauth'>('loading')

  useEffect(() => {
    apiFetch('/api/members/me')
      .then((r) => setStatus(r.ok ? 'ok' : 'unauth'))
      .catch(() => setStatus('unauth'))
  }, [])

  if (status === 'loading') return <div style={{ minHeight: '100dvh' }} />
  if (status === 'unauth') return <Navigate to="/" replace />
  return <>{children}</>
}
