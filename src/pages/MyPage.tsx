import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Flag, LogOut, MapPin, Settings, User } from 'lucide-react'
import { clearJoinedMeetups } from '../meetupSession'
import { apiFetch } from '../api'

interface Me {
  id: number
  nickname?: string
  email?: string
}

interface Stats {
  joinedCount: number
  hostedCount: number
  reviewCount: number
  mannerTemperature?: number
}

export default function MyPage() {
  const navigate = useNavigate()
  const [me, setMe] = useState<Me | null>(null)
  const [stats, setStats] = useState<Stats>({ joinedCount: 0, hostedCount: 0, reviewCount: 0, mannerTemperature: 36.5 })
  const [statsLoading, setStatsLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    apiFetch('/api/members/me')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setMe(d))
      .catch(() => {})
    apiFetch('/api/members/me/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d) })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
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

  const initial = me?.nickname?.charAt(0) ?? '?'

  return (
    <div style={s.page}>
      <div style={s.scroll}>
        <div style={s.pageHeader}>마이</div>

        {/* 프로필 카드 */}
        <div style={s.profileCard}>
          <div style={s.avatar}>
            {me ? (
              <span style={s.avatarInitial}>{initial}</span>
            ) : (
              <User size={22} color="var(--primary)" />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.profileName}>{me?.nickname ?? 'ToGather 사용자'}</div>
            <div style={s.profileEmail}>{me?.email ?? '로그인 중...'}</div>
          </div>
          <button style={s.editBtn} onClick={() => navigate('/profile/edit')}>
            <Settings size={16} color="var(--text-secondary)" />
          </button>
        </div>

        {/* 매너온도 카드 */}
        <div style={s.tempCard}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={s.tempLabel}>매너온도</div>
              <div style={s.tempDesc}>모임에서 받은 평가가 반영돼요</div>
            </div>
            {statsLoading ? (
              <div style={s.tempSkeleton} />
            ) : (
              <div style={s.tempValue}>{(stats.mannerTemperature ?? 36.5).toFixed(1)}°</div>
            )}
          </div>
          <div style={s.gaugeTrack}>
            <div style={{ ...s.gaugeFill, width: `${Math.min(stats.mannerTemperature ?? 36.5, 100)}%` }} />
            <div style={{ ...s.gaugeThumb, left: `${Math.min(stats.mannerTemperature ?? 36.5, 100)}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={s.gaugeEnd}>0°</span>
            <span style={s.gaugeEnd}>100°</span>
          </div>
        </div>

        {/* 통계 */}
        <div style={s.statsRow}>
          {[
            { label: '참여한 모임', value: statsLoading ? '—' : String(stats.joinedCount) },
            { label: '만든 모임', value: statsLoading ? '—' : String(stats.hostedCount) },
            { label: '받은 평가', value: statsLoading ? '—' : String(stats.reviewCount) },
          ].map((stat) => (
            <div key={stat.label} style={s.statItem}>
              <div style={s.statValue}>{stat.value}</div>
              <div style={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 메뉴 */}
        <div style={s.menuCard}>
          {[
            { icon: <MapPin size={17} color="var(--primary)" />, label: '내 주변 모임 탐색', sub: '지도로 이동', onClick: () => navigate('/home') },
            { icon: <Bell size={17} color="var(--text-secondary)" />, label: '알림 설정', sub: '알림 항목 선택', onClick: () => navigate('/settings/notifications') },
            { icon: <Flag size={17} color="var(--cautionary)" />, label: '안전센터', sub: '신고·차단 관리', onClick: () => navigate('/safety') },
          ].map((item, i, arr) => (
            <button
              key={item.label}
              style={{ ...s.menuRow, borderBottom: i < arr.length - 1 ? '1px solid var(--wds-line)' : 'none' }}
              onClick={item.onClick}
            >
              <div style={s.menuIcon}>{item.icon}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={s.menuLabel}>{item.label}</div>
                <div style={s.menuSub}>{item.sub}</div>
              </div>
              <ChevronRight size={16} color="var(--text-placeholder)" />
            </button>
          ))}
        </div>

        {/* 로그아웃 */}
        <button
          style={{ ...s.logoutBtn, opacity: loggingOut ? 0.6 : 1 }}
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={17} />
          {loggingOut ? '로그아웃 중...' : '로그아웃'}
        </button>

        <div style={s.version}>ToGather v0.1.0</div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { height: '100%', background: 'var(--wds-fill)', overflowY: 'auto' },
  scroll: { maxWidth: 430, margin: '0 auto', padding: '20px 16px 36px', display: 'flex', flexDirection: 'column', gap: 12 },

  pageHeader: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em', marginBottom: 4 },

  profileCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '18px 16px', borderRadius: 20, background: '#fff',
    boxShadow: 'var(--shadow-card)',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 999,
    background: 'var(--primary-tint)', color: 'var(--primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarInitial: { fontSize: 20, fontWeight: 700, color: 'var(--primary)' },
  profileName: { fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },
  profileEmail: { marginTop: 3, fontSize: 12.5, color: 'var(--text-assistive)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  editBtn: { width: 36, height: 36, borderRadius: 10, border: '1px solid var(--wds-line)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },

  tempCard: { padding: '18px 16px', borderRadius: 20, background: '#fff', boxShadow: 'var(--shadow-card)' },
  tempLabel: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)' },
  tempDesc: { marginTop: 2, fontSize: 12, color: 'var(--text-assistive)' },
  tempValue: { fontSize: 28, fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' },
  gaugeTrack: { height: 8, borderRadius: 999, background: 'var(--wds-fill)', position: 'relative' },
  gaugeFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 999, background: 'linear-gradient(90deg, #16A9C4, #1192AC)', transition: 'width 600ms ease' },
  gaugeThumb: { position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 16, height: 16, borderRadius: 999, background: '#fff', border: '2.5px solid var(--primary)', boxShadow: '0 2px 6px rgba(22,169,196,.3)', transition: 'left 600ms ease' },
  tempSkeleton: { width: 72, height: 34, borderRadius: 8, background: 'var(--wds-fill)', animation: 'pulse 1.4s ease infinite' },
  gaugeEnd: { fontSize: 11, color: 'var(--text-assistive)' },

  statsRow: { display: 'flex', gap: 10 },
  statItem: { flex: 1, padding: '16px 0', borderRadius: 16, background: '#fff', textAlign: 'center', boxShadow: 'var(--shadow-card)' },
  statValue: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  statLabel: { marginTop: 3, fontSize: 11, color: 'var(--text-assistive)', fontWeight: 500 },

  menuCard: { borderRadius: 20, background: '#fff', overflow: 'hidden', boxShadow: 'var(--shadow-card)' },
  menuRow: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
  },
  menuIcon: { width: 34, height: 34, borderRadius: 10, background: 'var(--wds-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel: { fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' },
  menuSub: { marginTop: 2, fontSize: 12, color: 'var(--text-assistive)' },

  logoutBtn: {
    width: '100%', height: 50, borderRadius: 14, border: 'none',
    background: 'var(--wds-fill)', color: 'var(--text-secondary)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  version: { textAlign: 'center', fontSize: 11, color: 'var(--text-placeholder)', marginTop: 4 },
}
