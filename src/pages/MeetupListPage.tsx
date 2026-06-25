import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, MessageCircle, Plus, Users, Zap } from 'lucide-react'

interface Meetup {
  id: number
  hostNickname: string
  title: string
  address: string
  category: string
  maxParticipants: number
  currentCount: number
  status: string
  expiresAt: string
}

const CATEGORY_LABEL: Record<string, string> = {
  FOOD: '식사',
  CAFE: '카페·술',
  ACTIVITY: '액티비티',
  SIGHTSEEING: '관광',
  OTHER: '기타',
}

const CATEGORY_COLOR: Record<string, string> = {
  FOOD: '#FF6B35',
  CAFE: '#8B5CF6',
  ACTIVITY: '#0066FF',
  SIGHTSEEING: '#00973A',
  OTHER: '#9A9DA6',
}

export default function MeetupListPage() {
  const navigate = useNavigate()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loading, setLoading] = useState(true)
  const [lat, setLat] = useState(35.15)
  const [lng, setLng] = useState(129.12)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude) },
      () => {},
    )
  }, [])

  const fetchMeetups = () => {
    setLoading(true)
    fetch(`/api/meetups/nearby?lat=${lat}&lng=${lng}&radius=10`, { credentials: 'include' })
      .then((r) => { if (r.status === 401) { navigate('/'); return [] }; return r.json() })
      .then((data) => { if (data) setMeetups(data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMeetups() }, [lat, lng])

  const handleJoin = async (meetupId: number) => {
    const res = await fetch(`/api/meetups/${meetupId}/join`, {
      method: 'POST',
      credentials: 'include',
    })
    if (res.ok) {
      fetchMeetups()
      navigate(`/chat/${meetupId}`)
    }
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <MapPin size={16} color="var(--primary)" />
          <span style={s.location}>내 주변</span>
        </div>
        <button style={s.createBtn} onClick={() => navigate('/meetups/new')}>
          <Plus size={16} />
          번개 만들기
        </button>
      </header>

      <div style={s.content}>
        <div style={s.sectionTitle}>
          <Zap size={16} color="#FF6B35" fill="#FF6B35" />
          지금 근처 번개
        </div>

        {loading ? (
          <div style={s.empty}>불러오는 중...</div>
        ) : meetups.length === 0 ? (
          <div style={s.emptyBox}>
            <div style={s.emptyIcon}>⚡</div>
            <div style={s.emptyTitle}>아직 근처 번개가 없어요</div>
            <div style={s.emptyDesc}>첫 번째로 번개를 열어보세요!</div>
            <button style={s.emptyBtn} onClick={() => navigate('/meetups/new')}>
              번개 만들기
            </button>
          </div>
        ) : (
          <div style={s.list}>
            {meetups.map((m) => (
              <div key={m.id} style={s.card}>
                <div style={s.cardTop}>
                  <span style={{ ...s.categoryBadge, color: CATEGORY_COLOR[m.category] ?? '#9A9DA6', background: `${CATEGORY_COLOR[m.category] ?? '#9A9DA6'}18` }}>
                    {CATEGORY_LABEL[m.category] ?? m.category}
                  </span>
                  <span style={{ ...s.statusDot, color: m.status === 'OPEN' ? '#00973A' : '#9A9DA6' }}>
                    {m.status === 'OPEN' ? '모집 중' : '마감'}
                  </span>
                </div>

                <div style={s.cardTitle}>{m.title}</div>

                <div style={s.cardMeta}>
                  <MapPin size={13} color="#9A9DA6" />
                  <span>{m.address || '위치 미정'}</span>
                  <span style={s.dot}>·</span>
                  <span>{m.hostNickname}</span>
                </div>

                <div style={s.cardBottom}>
                  <div style={s.participants}>
                    <Users size={14} color="#9A9DA6" />
                    <span style={s.participantText}>
                      {m.currentCount}
                      <span style={s.participantMax}> / {m.maxParticipants}명</span>
                    </span>
                  </div>

                  <div style={s.cardActions}>
                    <button style={s.chatBtn} onClick={() => navigate(`/chat/${m.id}`)}>
                      <MessageCircle size={14} />
                      채팅
                    </button>
                    <button
                      style={{ ...s.joinBtn, ...(m.status !== 'OPEN' ? s.joinBtnDisabled : {}) }}
                      disabled={m.status !== 'OPEN'}
                      onClick={() => handleJoin(m.id)}
                    >
                      참가하기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#F3F5F8' },
  header: {
    position: 'sticky', top: 0, zIndex: 10,
    background: '#FFFFFF', borderBottom: '1px solid var(--wds-line)',
    height: 56, padding: '0 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 6 },
  location: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)' },
  createBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '8px 14px', border: 'none', borderRadius: 999,
    background: 'var(--primary)', color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  content: { maxWidth: 480, margin: '0 auto', padding: '16px 16px 40px' },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 15, fontWeight: 700, color: 'var(--text-normal)',
    marginBottom: 14,
  },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    background: '#FFFFFF', borderRadius: 16, padding: '16px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  categoryBadge: {
    fontSize: 11.5, fontWeight: 600,
    padding: '3px 8px', borderRadius: 999,
  },
  statusDot: { fontSize: 12, fontWeight: 600 },
  cardTitle: {
    fontSize: 16, fontWeight: 700, color: 'var(--text-normal)',
    marginBottom: 6, lineHeight: 1.35,
  },
  cardMeta: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 12.5, color: '#9A9DA6', marginBottom: 12,
  },
  dot: { color: '#D0D3DA' },
  cardBottom: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  participants: { display: 'flex', alignItems: 'center', gap: 5 },
  participantText: { fontSize: 13.5, fontWeight: 700, color: 'var(--text-normal)' },
  participantMax: { fontWeight: 400, color: '#9A9DA6' },
  cardActions: { display: 'flex', gap: 8 },
  chatBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '7px 13px', border: '1.5px solid var(--wds-line)',
    borderRadius: 999, background: '#fff',
    fontSize: 13, fontWeight: 600, color: 'var(--text-normal)', cursor: 'pointer',
  },
  joinBtn: {
    padding: '7px 16px', border: 'none', borderRadius: 999,
    background: 'var(--primary)', color: '#fff',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
  joinBtnDisabled: { background: '#E5E7EB', color: '#9A9DA6', cursor: 'default' },
  empty: { textAlign: 'center', color: '#9A9DA6', marginTop: 60, fontSize: 14 },
  emptyBox: {
    marginTop: 60, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-normal)' },
  emptyDesc: { fontSize: 13.5, color: '#9A9DA6' },
  emptyBtn: {
    marginTop: 12, padding: '10px 24px', border: 'none',
    borderRadius: 999, background: 'var(--primary)', color: '#fff',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
}
