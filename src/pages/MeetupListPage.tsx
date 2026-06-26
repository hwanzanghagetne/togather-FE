import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, List, MapPin, MessageCircle, Plus, Users, Zap } from 'lucide-react'
import { markJoinedMeetup, markLeftMeetup, readJoinedMeetupIds } from '../meetupSession'

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

const CATEGORY_META: Record<string, { color: string; label: string }> = {
  FOOD: { color: '#FF6B35', label: '식사' },
  CAFE: { color: '#8B5CF6', label: '카페·술' },
  ACTIVITY: { color: '#00973A', label: '액티비티' },
  SIGHTSEEING: { color: '#00A3A3', label: '관광' },
  OTHER: { color: '#9A9DA6', label: '기타' },
}

function formatDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadius = 6371e3
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const meters = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function formatDeadline(expiresAt: string) {
  if (!expiresAt) return '오늘 중'

  const date = new Date(expiresAt)
  if (Number.isNaN(date.getTime())) return '오늘 중'

  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}까지`
}

export default function MeetupListPage() {
  const navigate = useNavigate()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<number | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [position, setPosition] = useState({ lat: 35.1796, lng: 129.0756 })
  const [joinedMeetupIds, setJoinedMeetupIds] = useState<number[]>(() => readJoinedMeetupIds())

  useEffect(() => {
    fetch('/api/members/me', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setMyId(data?.id ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (coords) => setPosition({ lat: coords.coords.latitude, lng: coords.coords.longitude }),
      () => {},
      { enableHighAccuracy: true },
    )
  }, [])

  const fetchMeetups = useCallback(async (nextPosition = position) => {
    setLoading(true)

    try {
      const response = await fetch(`/api/meetups/nearby?lat=${nextPosition.lat}&lng=${nextPosition.lng}&radius=10`, {
        credentials: 'include',
      })

      if (response.status === 401) {
        navigate('/')
        return
      }

      if (!response.ok) return

      const data: Meetup[] = await response.json()
      setMeetups(data)
    } finally {
      setLoading(false)
    }
  }, [navigate, position])

  useEffect(() => {
    fetchMeetups(position)
  }, [fetchMeetups, position])

  const syncJoinedState = (meetupId: number, joined: boolean) => {
    if (joined) {
      markJoinedMeetup(meetupId)
      setJoinedMeetupIds((prev) => [...new Set([...prev, meetupId])])
      return
    }

    markLeftMeetup(meetupId)
    setJoinedMeetupIds((prev) => prev.filter((id) => id !== meetupId))
  }

  const handleJoin = async (meetupId: number) => {
    setPendingId(meetupId)
    try {
      const response = await fetch(`/api/meetups/${meetupId}/join`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) return

      syncJoinedState(meetupId, true)
      await fetchMeetups()
      navigate(`/chat/${meetupId}`)
    } finally {
      setPendingId(null)
    }
  }

  const handleLeave = async (meetupId: number) => {
    setPendingId(meetupId)
    try {
      const response = await fetch(`/api/meetups/${meetupId}/join`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) return

      syncJoinedState(meetupId, false)
      await fetchMeetups()
    } finally {
      setPendingId(null)
    }
  }

  const cards = useMemo(() => {
    return meetups.map((meetup) => {
      const category = CATEGORY_META[meetup.category] ?? CATEGORY_META.OTHER
      const joined = joinedMeetupIds.includes(meetup.id) || meetup.hostId === myId

      return {
        ...meetup,
        category,
        joined,
        distance: formatDistance(position.lat, position.lng, meetup.latitude, meetup.longitude),
        deadline: formatDeadline(meetup.expiresAt),
      }
    })
  }, [joinedMeetupIds, meetups, myId, position.lat, position.lng])

  return (
    <div style={s.page}>
      <div style={s.sheet}>
        <div style={s.handle} />

        <header style={s.header}>
          <button style={s.backButton} onClick={() => navigate('/home')}>
            <ChevronLeft size={20} />
          </button>
          <div>
            <div style={s.headerTitle}>지금 근처 모임</div>
            <div style={s.headerSub}>지도에서 바로 참여할 수 있는 모임이에요</div>
          </div>
          <button style={s.createButton} onClick={() => navigate('/meetups/new')}>
            <Plus size={16} />
            만들기
          </button>
        </header>

        <div style={s.countBanner}>
          <Zap size={14} color="#FFC247" fill="#FFC247" />
          {loading ? '불러오는 중...' : `${meetups.length}개의 모임이 근처에 있어요`}
        </div>

        <div style={s.content}>
          {loading ? (
            <div style={s.emptyState}>목록을 불러오는 중이에요...</div>
          ) : cards.length === 0 ? (
            <div style={s.emptyCard}>
              <div style={s.emptyIcon}>⚡</div>
              <div style={s.emptyTitle}>지금 열려 있는 모임이 없어요</div>
              <div style={s.emptyDescription}>첫 번째 모임을 열면 바로 지도에 노출돼요.</div>
              <button style={s.emptyButton} onClick={() => navigate('/meetups/new')}>
                새 모임 만들기
              </button>
            </div>
          ) : (
            <div style={s.list}>
              {cards.map((meetup) => (
                <div key={meetup.id} style={s.card}>
                  <div style={s.cardTop}>
                    <span style={{ ...s.categoryBadge, color: meetup.category.color, background: `${meetup.category.color}12` }}>
                      {meetup.category.label}
                    </span>
                    <span style={s.deadlineText}>{meetup.deadline}</span>
                  </div>

                  <div style={s.cardTitle}>{meetup.title}</div>

                  <div style={s.metaRow}>
                    <MapPin size={13} color="#9A9DA6" />
                    <span>{meetup.address || '근처 지역만 표시'}</span>
                    <span style={s.dot}>·</span>
                    <span>{meetup.distance}</span>
                    <span style={s.dot}>·</span>
                    <span>{meetup.hostNickname}</span>
                  </div>

                  <div style={s.bottomRow}>
                    <div style={s.peopleRow}>
                      <Users size={14} color="#5A5D66" />
                      <span style={s.peopleText}>{meetup.currentCount}명 가는 중</span>
                    </div>

                    {meetup.joined ? (
                      <div style={s.actionRow}>
                        <button style={s.chatButton} onClick={() => navigate(`/chat/${meetup.id}`)}>
                          <MessageCircle size={14} />
                          채팅 열기
                        </button>
                        <button
                          style={{ ...s.leaveButton, opacity: pendingId === meetup.id ? 0.6 : 1 }}
                          onClick={() => handleLeave(meetup.id)}
                          disabled={pendingId === meetup.id}
                        >
                          나가기
                        </button>
                      </div>
                    ) : (
                      <button
                        style={{ ...s.joinButton, opacity: pendingId === meetup.id || meetup.status !== 'OPEN' ? 0.6 : 1 }}
                        onClick={() => handleJoin(meetup.id)}
                        disabled={pendingId === meetup.id || meetup.status !== 'OPEN'}
                      >
                        <MessageCircle size={14} />
                        {meetup.status === 'OPEN' ? '채팅 참여하기' : '마감됨'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button style={s.mapButton} onClick={() => navigate('/home')}>
          <List size={17} />
          지도로 돌아가기
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#E9EEF4',
    padding: '10px 0 0',
  },
  sheet: {
    minHeight: 'calc(100dvh - 10px)',
    maxWidth: 430,
    margin: '0 auto',
    background: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -6px 20px rgba(0,0,0,0.08)',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    background: '#D8DCE6',
    margin: '10px auto 4px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px 10px',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: 'none',
    background: 'var(--wds-fill-alt)',
    color: '#16161A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#16161A',
  },
  headerSub: {
    marginTop: 3,
    fontSize: 12,
    color: '#8A8E97',
  },
  createButton: {
    marginLeft: 'auto',
    height: 36,
    borderRadius: 999,
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    padding: '0 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  countBanner: {
    margin: '4px 16px 0',
    borderRadius: 999,
    background: '#16161A',
    color: '#fff',
    padding: '9px 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    fontWeight: 600,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 16px 20px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    borderRadius: 18,
    border: '1px solid var(--wds-line)',
    background: '#fff',
    padding: '16px',
    boxShadow: '0 4px 12px rgba(15,20,30,0.04)',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  categoryBadge: {
    height: 28,
    borderRadius: 999,
    padding: '0 10px',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 12,
    fontWeight: 700,
  },
  deadlineText: {
    fontSize: 12,
    color: '#8A8E97',
    fontWeight: 600,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: 700,
    color: '#16161A',
    lineHeight: 1.35,
  },
  metaRow: {
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    fontSize: 12.5,
    color: '#8A8E97',
  },
  dot: {
    color: '#C8CAD0',
    margin: '0 2px',
  },
  bottomRow: {
    marginTop: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  peopleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  peopleText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#5A5D66',
  },
  actionRow: {
    display: 'flex',
    gap: 8,
  },
  chatButton: {
    height: 40,
    borderRadius: 999,
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    padding: '0 14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  leaveButton: {
    height: 40,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(255,66,66,0.08)',
    color: '#FF4242',
    padding: '0 14px',
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  joinButton: {
    height: 40,
    borderRadius: 999,
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    padding: '0 15px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12.5,
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyState: {
    marginTop: 72,
    textAlign: 'center',
    color: '#8A8E97',
    fontSize: 14,
  },
  emptyCard: {
    marginTop: 56,
    borderRadius: 18,
    border: '1px dashed #D8DCE6',
    background: '#FBFCFD',
    padding: '28px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 34,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: 700,
    color: '#16161A',
  },
  emptyDescription: {
    marginTop: 6,
    fontSize: 13,
    color: '#8A8E97',
    lineHeight: 1.5,
  },
  emptyButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 999,
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    padding: '0 20px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  mapButton: {
    margin: '0 16px 16px',
    height: 48,
    borderRadius: 14,
    border: '1px solid var(--wds-line)',
    background: '#fff',
    color: '#16161A',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
}
