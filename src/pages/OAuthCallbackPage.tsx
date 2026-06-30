import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export default function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(false)

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code')
    if (!code) {
      setError(true)
      return
    }

    fetch(`${API_BASE}/api/auth/exchange?code=${code}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('exchange failed')
        navigate('/home', { replace: true })
      })
      .catch(() => setError(true))
  }, [navigate])

  if (error) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontSize: 32 }}>😞</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-normal)' }}>로그인에 실패했어요</div>
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{ marginTop: 8, padding: '10px 24px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: 999, border: '3px solid var(--primary-tint)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}
