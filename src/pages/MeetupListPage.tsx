import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Crown, MessageCircle, Plus } from 'lucide-react'
import { apiFetch } from '../api'

interface Meetup {
  id: number
  hostId: number
  hostNickname: string
  title: string
  address: string
  category: string
  currentCount: number
  maxParticipants: number
  status: string
  expiresAt: string
}

const CAT: Record<string, { color: string; emoji: string; label: string }> = {
  FOOD:        { color: '#FF6B35', emoji: '🍽', label: '식사' },
  CAFE:        { color: '#6541F2', emoji: '☕', label: '카페·술' },
  ACTIVITY:    { color: '#16A9C4', emoji: '⚡', label: '액티비티' },
  SIGHTSEEING: { color: '#00973A', emoji: '📍', label: '관광' },
  OTHER:       { color: '#9A9DA6', emoji: '●', label: '기타' },
}

function timeLeft(expiresAt: string) {
  if (!expiresAt) return '오늘 중'
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return '종료됨'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h >= 1) return `${h}시간 ${m}분 남음`
  return `${m}분 남음`
}

type TabKey = 'joined' | 'hosted' | 'past'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'joined', label: '참여중' },
  { key: 'hosted', label: '내가 만든' },
  { key: 'past', label: '지난 모임' },
]

export default function MeetupListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialTab = location.state?.tab as TabKey | undefined
  const [tab, setTab] = useState<TabKey>(initialTab ?? 'joined')
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<number | null>(null)

  useEffect(() => {
    apiFetch('/api/members/me')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setMyId(d?.id ?? null))
      .catch(() => {})
  }, [])

  const fetchMyMeetups = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const r = await apiFetch('/api/meetups/my')
      if (r.status === 401) { navigate('/'); return }
      if (!r.ok) return
      setMeetups(await r.json())
    } finally {
      if (!silent) setLoading(false)
    }
  }, [navigate])

  useEffect(() => { fetchMyMeetups() }, [fetchMyMeetups])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) fetchMyMeetups(true) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetchMyMeetups])

  useEffect(() => {
    const requestedTab = location.state?.tab as TabKey | undefined
    if (requestedTab && requestedTab !== tab) {
      setTab(requestedTab)
    }
  }, [location.state, tab])

  const categorized = useMemo(() => {
    const active = meetups.filter((m) => m.status !== 'CLOSED')
    const past = meetups.filter((m) => m.status === 'CLOSED')
    return {
      joined: active, // 내가 만든 모임도 참여중에 표시
      hosted: active.filter((m) => m.hostId === myId),
      past,
    }
  }, [meetups, myId])

  const visible = categorized[tab]

  return (
    <div style={s.page}>
      {/* 헤더 */}
      <div style={s.header}>
        <div style={s.title}>내 모임</div>
        <button style={s.createBtn} onClick={() => navigate('/meetups/new')}>
          <Plus size={16} strokeWidth={2.5} />
          모임 만들기
        </button>
      </div>

      {/* 탭 */}
      <div style={s.tabBar}>
        {TABS.map((t) => {
          const isActive = tab === t.key
          const count = categorized[t.key].length
          return (
            <button
              key={t.key}
              style={{ ...s.tabBtn, color: isActive ? 'var(--primary)' : 'var(--text-assistive)', borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => { setTab(t.key); fetchMyMeetups(true) }}
            >
              {t.label}
              {count > 0 && (
                <span style={{ ...s.tabCount, background: isActive ? 'var(--primary)' : 'var(--wds-fill-strong)', color: isActive ? '#fff' : 'var(--text-assistive)' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 내용 */}
      <div style={s.scroll}>
        {loading ? (
          <div style={s.loadingWrap}>
            <div style={s.loadingSpinner} />
            <span style={s.loadingText}>불러오는 중...</span>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState tab={tab} onNavigate={() => navigate('/home')} onCreate={() => navigate('/meetups/new')} />
        ) : (
          <div style={s.list}>
            {visible.map((m) => (
              <MeetupCard
                key={m.id}
                meetup={m}
                isHost={m.hostId === myId}
                isPast={tab === 'past'}
                onClick={() => navigate(`/chat/${m.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MeetupCard({ meetup, isHost, isPast, onClick }: {
  meetup: Meetup
  isHost: boolean
  isPast: boolean
  onClick: () => void
}) {
  const cat = CAT[meetup.category] ?? CAT.OTHER
  const remaining = timeLeft(meetup.expiresAt)

  return (
    <div style={{ ...s.card, opacity: isPast ? 0.65 : 1 }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        {/* 카테고리 아이콘 */}
        <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0, background: cat.color + '16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {cat.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 뱃지 row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            {isHost ? (
              <span style={s.hostBadge}>
                <Crown size={10} strokeWidth={2.5} fill="currentColor" />
                방장
              </span>
            ) : (
              <span style={s.joinedBadge}>참여중</span>
            )}
            {!isPast && (
              <span style={s.timeLeft}>{remaining}</span>
            )}
          </div>
          {/* 제목 */}
          <div style={s.cardTitle}>{meetup.title}</div>
          {/* 메타 */}
          <div style={s.cardMeta}>
            <span>{meetup.currentCount}명 참여</span>
            {meetup.address && (
              <>
                <span style={s.dot}>·</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>
                  {meetup.address.replace(/^대한민국\s*/, '')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 채팅 아이콘 */}
        {!isPast && (
          <div style={s.chatIcon}>
            <MessageCircle size={18} color="var(--primary)" strokeWidth={2} />
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ tab, onNavigate, onCreate }: { tab: TabKey; onNavigate: () => void; onCreate: () => void }) {
  const cfg = {
    joined: { icon: '💬', title: '참여한 모임이 없어요', desc: '근처 모임을 탐색해 참여해보세요', btnLabel: '근처 모임 둘러보기', onBtn: onNavigate },
    hosted: { icon: '⚡', title: '내가 만든 모임이 없어요', desc: '첫 번째 모임을 지금 만들어보세요', btnLabel: '모임 만들기', onBtn: onCreate },
    past: { icon: '🕐', title: '지난 모임이 없어요', desc: '종료된 모임이 여기에 나타나요', btnLabel: '근처 모임 둘러보기', onBtn: onNavigate },
  }[tab]

  return (
    <div style={s.emptyWrap}>
      <div style={s.emptyIcon}>{cfg.icon}</div>
      <div style={s.emptyTitle}>{cfg.title}</div>
      <div style={s.emptyDesc}>{cfg.desc}</div>
      <button style={s.emptyBtn} onClick={cfg.onBtn}>{cfg.btnLabel}</button>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wds-fill)' },

  header: { padding: '20px 20px 14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--wds-line)', flexShrink: 0 },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  createBtn: { height: 36, borderRadius: 999, border: 'none', background: 'var(--primary)', color: '#fff', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  tabBar: { display: 'flex', background: '#fff', borderBottom: '1px solid var(--wds-line)', flexShrink: 0, padding: '0 20px' },
  tabBtn: { flex: 1, height: 46, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'color 150ms ease, border-color 150ms ease' },
  tabCount: { minWidth: 18, height: 18, borderRadius: 999, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', transition: 'all 150ms ease' },

  scroll: { flex: 1, overflowY: 'auto', padding: '16px 16px 32px' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },

  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, paddingTop: 80 },
  loadingSpinner: { width: 32, height: 32, borderRadius: 999, border: '3px solid var(--primary-tint)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' },
  loadingText: { fontSize: 14, color: 'var(--text-assistive)' },

  emptyWrap: { paddingTop: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { marginTop: 14, fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },
  emptyDesc: { marginTop: 6, fontSize: 13.5, color: 'var(--text-assistive)', lineHeight: 1.5 },
  emptyBtn: { marginTop: 22, height: 46, borderRadius: 999, border: 'none', background: 'var(--primary)', color: '#fff', padding: '0 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  card: { background: '#fff', borderRadius: 18, border: '1px solid var(--wds-line)', padding: '16px', boxShadow: 'var(--shadow-card)', cursor: 'pointer' },

  hostBadge: { fontSize: 11, fontWeight: 700, color: '#FF9200', background: 'rgba(255,146,0,.12)', borderRadius: 6, padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 },
  joinedBadge: { fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-tint)', borderRadius: 6, padding: '2px 7px' },
  timeLeft: { fontSize: 11.5, color: 'var(--text-assistive)', fontWeight: 500 },

  cardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMeta: { marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-assistive)' },
  dot: { color: 'var(--wds-line-strong)' },

  chatIcon: { width: 40, height: 40, borderRadius: 12, background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
}


