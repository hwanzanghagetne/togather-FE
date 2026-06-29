import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, MapPin, User } from 'lucide-react'
import { clearJoinedMeetups } from '../meetupSession'
import { apiFetch } from '../api'

interface Me {
  id: number
  nickname?: string
  email?: string
}

export default function MyPage() {
  const navigate = useNavigate()
  const [me, setMe] = useState<Me | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    apiFetch('/api/members/me')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setMe(data))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' })
    } finally {
      clearJoinedMeetups()
      navigate('/', { replace: true })
      setLoggingOut(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.content}>
        <div style={s.header}>마이</div>

        <section style={s.profileCard}>
          <div style={s.avatar}>
            <User size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.name}>{me?.nickname || 'ToGather 사용자'}</div>
            <div style={s.subtext}>{me?.email || '현재 로그인된 계정'}</div>
          </div>
        </section>

        <section style={s.infoCard}>
          <div style={s.infoRow}>
            <div style={s.infoLeft}>
              <MapPin size={16} color="var(--primary)" />
              <span>내 주변 모임 탐색</span>
            </div>
            <ChevronRight size={16} color="#9A9DA6" />
          </div>
          <div style={s.infoCaption}>일단 기본 설정 페이지 대신, 필요한 기능부터 차근차근 붙여둘게요.</div>
        </section>
      </div>

      <div style={s.footer}>
        <button style={{ ...s.logoutButton, opacity: loggingOut ? 0.6 : 1 }} onClick={handleLogout} disabled={loggingOut}>
          <LogOut size={18} />
          {loggingOut ? '로그아웃 중...' : '로그아웃'}
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100%',
    background: '#F3F5F8',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    padding: '24px 16px 20px',
    maxWidth: 430,
    width: '100%',
    margin: '0 auto',
  },
  header: {
    fontSize: 24,
    fontWeight: 700,
    color: '#16161A',
    marginBottom: 18,
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '18px 16px',
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 4px 12px rgba(15,20,30,0.05)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    background: 'rgba(22,169,196,0.1)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
    color: '#16161A',
  },
  subtext: {
    marginTop: 4,
    fontSize: 12.5,
    color: '#8A8E97',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  infoCard: {
    marginTop: 14,
    padding: '16px',
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 4px 12px rgba(15,20,30,0.05)',
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  infoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    fontWeight: 600,
    color: '#16161A',
  },
  infoCaption: {
    marginTop: 10,
    fontSize: 12.5,
    lineHeight: 1.5,
    color: '#8A8E97',
  },
  footer: {
    padding: '12px 16px 30px',
    maxWidth: 430,
    width: '100%',
    margin: '0 auto',
  },
  logoutButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    border: 'none',
    background: '#16161A',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  },
}
