import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Plus, Users, Zap } from 'lucide-react'
import { markJoinedMeetup, markLeftMeetup, readJoinedMeetupIds } from '../meetupSession'
import { apiFetch } from '../api'

interface Meetup {
  id: number
  hostId: number
  hostNickname: string
  title: string
  address: string
  latitude: number
  longitude: number
  category: string
  currentCount: number
  maxParticipants: number
  status: string
  expiresAt: string
}

const CAT: Record<string, { color: string; emoji: string; label: string }> = {
  FOOD:       { color: '#FF6B35', emoji: '🍽', label: '식사' },
  CAFE:       { color: '#6541F2', emoji: '☕', label: '카페·술' },
  ACTIVITY:   { color: '#16A9C4', emoji: '⚡', label: '액티비티' },
  SIGHTSEEING:{ color: '#00973A', emoji: '📍', label: '관광' },
  OTHER:      { color: '#9A9DA6', emoji: '●', label: '기타' },
}

function formatDeadline(expiresAt: string) {
  if (!expiresAt) return '오늘 중'
  const d = new Date(expiresAt)
  if (Number.isNaN(d.getTime())) return '오늘 중'
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}까지`
}

export default function MeetupListPage() {
  const navigate = useNavigate()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<number | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [pos, setPos] = useState({ lat: 35.1796, lng: 129.0756 })
  const [joinedIds, setJoinedIds] = useState<number[]>(() => readJoinedMeetupIds())

  useEffect(() => {
    apiFetch('/api/members/me')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setMyId(d?.id ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (c) => setPos({ lat: c.coords.latitude, lng: c.coords.longitude }),
      () => {}, { enableHighAccuracy: true },
    )
  }, [])

  const fetchMeetups = useCallback(async (p = pos) => {
    setLoading(true)
    try {
      const r = await apiFetch(`/api/meetups/nearby?lat=${p.lat}&lng=${p.lng}&radius=10`)
      if (r.status === 401) { navigate('/'); return }
      if (!r.ok) return
      setMeetups(await r.json())
    } finally {
      setLoading(false)
    }
  }, [navigate, pos])

  useEffect(() => { fetchMeetups(pos) }, [fetchMeetups, pos])

  const handleJoin = async (meetupId: number) => {
    setPendingId(meetupId)
    try {
      const r = await apiFetch(`/api/meetups/${meetupId}/join`, { method: 'POST' })
      if (!r.ok) return
      markJoinedMeetup(meetupId)
      setJoinedIds((prev) => [...new Set([...prev, meetupId])])
      await fetchMeetups()
      navigate(`/chat/${meetupId}`)
    } finally { setPendingId(null) }
  }

  const handleLeave = async (meetupId: number) => {
    setPendingId(meetupId)
    try {
      const r = await apiFetch(`/api/meetups/${meetupId}/join`, { method: 'DELETE' })
      if (!r.ok) return
      markLeftMeetup(meetupId)
      setJoinedIds((prev) => prev.filter((id) => id !== meetupId))
      await fetchMeetups()
    } finally { setPendingId(null) }
  }

  const cards = useMemo(() => meetups.map((m) => ({
    ...m,
    cat: CAT[m.category] ?? CAT.OTHER,
    joined: joinedIds.includes(m.id) || m.hostId === myId,
    isHost: m.hostId === myId,
    deadline: formatDeadline(m.expiresAt),
  })), [meetups, joinedIds, myId])

  const joinedCards = cards.filter((c) => c.joined)
  const nearbyCards = cards.filter((c) => !c.joined)

  return (
    <div style={s.page}>
      {/* 헤더 */}
      <div style={s.header}>
        <div>
          <div style={s.title}>모임</div>
          <div style={s.sub}>근처에서 열린 즉석 모임이에요</div>
        </div>
        <button style={s.createBtn} onClick={() => navigate('/meetups/new')}>
          <Plus size={16} strokeWidth={2.5} />
          만들기
        </button>
      </div>

      <div style={s.scroll}>
        {loading ? (
          <div style={s.loadingWrap}>
            <div style={s.loadingDot} />
            <span style={s.loadingText}>모임 불러오는 중...</span>
          </div>
        ) : cards.length === 0 ? (
          /* 빈 상태 */
          <div style={s.emptyWrap}>
            <div style={s.emptyIcon}>⚡</div>
            <div style={s.emptyTitle}>지금 열려 있는 모임이 없어요</div>
            <div style={s.emptyDesc}>첫 번째 모임을 만들면 바로 지도에 노출돼요</div>
            <button style={s.emptyBtn} onClick={() => navigate('/meetups/new')}>
              새 모임 만들기
            </button>
          </div>
        ) : (
          <>
            {/* 참여중 섹션 */}
            {joinedCards.length > 0 && (
              <section style={s.section}>
                <div style={s.sectionLabel}>
                  <span style={s.sectionDot} />
                  참여중 {joinedCards.length}개
                </div>
                {joinedCards.map((m) => (
                  <MeetupCard
                    key={m.id}
                    meetup={m}
                    onChat={() => navigate(`/chat/${m.id}`)}
                    onLeave={() => handleLeave(m.id)}
                    pending={pendingId === m.id}
                  />
                ))}
              </section>
            )}

            {/* 근처 모임 섹션 */}
            {nearbyCards.length > 0 && (
              <section style={s.section}>
                <div style={s.sectionLabel}>
                  <Zap size={13} color="#FF6B35" fill="#FF6B35" />
                  지금 근처 {nearbyCards.length}개
                </div>
                {nearbyCards.map((m) => (
                  <MeetupCard
                    key={m.id}
                    meetup={m}
                    onJoin={() => handleJoin(m.id)}
                    pending={pendingId === m.id}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MeetupCard({
  meetup, onJoin, onChat, onLeave, pending,
}: {
  meetup: ReturnType<typeof buildCard>
  onJoin?: () => void
  onChat?: () => void
  onLeave?: () => void
  pending: boolean
}) {
  return (
    <div style={s.card}>
      {/* 카테고리 아이콘 + 제목 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 13, flexShrink: 0,
          background: meetup.cat.color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {meetup.cat.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ ...s.catBadge, color: meetup.cat.color, background: meetup.cat.color + '14' }}>
              {meetup.cat.label}
            </span>
            {meetup.isHost && (
              <span style={s.hostBadge}>👑 방장</span>
            )}
            {meetup.joined && !meetup.isHost && (
              <span style={s.joinedBadge}>참여중</span>
            )}
            <span style={s.deadline}>{meetup.deadline}</span>
          </div>
          <div style={s.cardTitle}>{meetup.title}</div>
          <div style={s.cardMeta}>
            <Users size={12} color="var(--text-assistive)" />
            <span>{meetup.currentCount}명 가는 중</span>
            {meetup.address && (
              <>
                <span style={{ color: 'var(--wds-line-strong)' }}>·</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
                  {meetup.address}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {meetup.joined ? (
          <>
            <button
              style={s.leaveBtn}
              onClick={onLeave}
              disabled={pending}
            >
              나가기
            </button>
            <button style={s.chatBtn} onClick={onChat}>
              <MessageCircle size={14} strokeWidth={2.2} />
              채팅 열기
            </button>
          </>
        ) : (
          <button
            style={{ ...s.joinBtn, opacity: pending || meetup.status !== 'OPEN' ? 0.6 : 1 }}
            onClick={onJoin}
            disabled={pending || meetup.status !== 'OPEN'}
          >
            <MessageCircle size={14} strokeWidth={2.2} />
            {meetup.status === 'OPEN' ? '채팅 참여하기' : '마감됨'}
          </button>
        )}
      </div>
    </div>
  )
}

type buildCard = ReturnType<typeof Array.prototype.map> extends Array<infer T> ? T : never

const s: Record<string, React.CSSProperties> = {
  page: { height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wds-fill)' },

  header: {
    padding: '20px 20px 14px',
    background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid var(--wds-line)',
    flexShrink: 0,
  },
  title: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  sub: { marginTop: 3, fontSize: 12.5, color: 'var(--text-assistive)' },
  createBtn: {
    height: 36, borderRadius: 999, border: 'none',
    background: 'var(--primary)', color: '#fff',
    padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
  },

  scroll: { flex: 1, overflowY: 'auto', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 0 },

  loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 80 },
  loadingDot: { width: 36, height: 36, borderRadius: 999, background: 'var(--primary-tint)', animation: 'pulse 1.5s infinite' },
  loadingText: { fontSize: 14, color: 'var(--text-assistive)' },

  emptyWrap: { paddingTop: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },
  emptyDesc: { marginTop: 6, fontSize: 13.5, color: 'var(--text-assistive)', lineHeight: 1.5 },
  emptyBtn: {
    marginTop: 20, height: 46, borderRadius: 999, border: 'none',
    background: 'var(--primary)', color: '#fff', padding: '0 22px',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },

  section: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 },
  sectionLabel: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)',
    marginBottom: 4, paddingLeft: 2,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 999, background: 'var(--positive)', display: 'inline-block' },

  card: {
    background: '#fff', borderRadius: 18,
    border: '1px solid var(--wds-line)',
    padding: '16px',
    boxShadow: 'var(--shadow-card)',
  },

  catBadge: {
    fontSize: 11.5, fontWeight: 700, borderRadius: 6, padding: '2px 7px',
    display: 'inline-flex', alignItems: 'center',
  },
  hostBadge: { fontSize: 11, fontWeight: 600, color: '#FF9200', background: 'rgba(255,146,0,.1)', borderRadius: 6, padding: '2px 6px' },
  joinedBadge: { fontSize: 11, fontWeight: 700, color: 'var(--positive-dark)', background: 'rgba(0,151,58,.1)', borderRadius: 6, padding: '2px 6px' },
  deadline: { marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-assistive)', fontWeight: 500 },

  cardTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)', lineHeight: 1.35 },
  cardMeta: { marginTop: 5, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-assistive)' },

  chatBtn: {
    height: 38, borderRadius: 999, border: 'none',
    background: 'var(--primary)', color: '#fff',
    padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  joinBtn: {
    height: 38, borderRadius: 999, border: 'none',
    background: 'var(--primary)', color: '#fff',
    padding: '0 15px', display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  leaveBtn: {
    height: 38, borderRadius: 999, border: 'none',
    background: 'rgba(255,66,66,.08)', color: 'var(--negative)',
    padding: '0 13px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
}
