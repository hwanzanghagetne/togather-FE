import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft, X } from 'lucide-react'
import { apiFetch } from '../api'

interface JoinRequest {
  requestId: number
  userId: number
  nickname: string
}

const AVATAR_COLORS = [
  { bg: '#FFD9C7', color: '#E0531F' },
  { bg: '#D7E4FF', color: '#16A9C4' },
  { bg: '#D9F2DD', color: '#00973A' },
  { bg: '#EDE4FF', color: '#6541F2' },
]

export default function JoinRequestManagePage() {
  const navigate = useNavigate()
  const { meetupId } = useParams<{ meetupId: string }>()
  const mid = meetupId ?? ''

  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<number | null>(null)

  const fetchRequests = useCallback(() => {
    apiFetch(`/api/meetups/${mid}/join-requests`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setRequests(Array.isArray(d) ? d : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }, [mid])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) fetchRequests() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetchRequests])

  const handleAccept = async (req: JoinRequest) => {
    if (acting) return
    setActing(req.requestId)
    try {
      await apiFetch(`/api/meetups/${mid}/join-requests/${req.requestId}/approve`, { method: 'POST' }).catch(() => {})
      setRequests((prev) => prev.filter((r) => r.requestId !== req.requestId))
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (req: JoinRequest) => {
    if (acting) return
    setActing(req.requestId)
    try {
      await apiFetch(`/api/meetups/${mid}/join-requests/${req.requestId}/reject`, { method: 'POST' }).catch(() => {})
      setRequests((prev) => prev.filter((r) => r.requestId !== req.requestId))
    } finally {
      setActing(null)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>참여 요청 {requests.length > 0 ? requests.length : ''}</span>
          <div style={{ width: 36 }} />
        </header>

        <div style={s.scroll}>
          {/* 안내 */}
          <p style={s.caption}>참여를 요청한 사람들이에요. 수락하면 채팅방에 입장해요.</p>

          {loading && (
            <div style={s.empty}>불러오는 중...</div>
          )}

          {!loading && requests.length === 0 && (
            <div style={s.empty}>새로운 참여 요청이 없어요</div>
          )}

          {requests.map((req) => {
            const avatarIdx = req.userId % 4
            const av = AVATAR_COLORS[avatarIdx]
            const isActing = acting === req.requestId

            return (
              <div key={req.requestId} style={s.card}>
                {/* 요청자 정보 */}
                <div style={s.cardInfo}>
                  {/* 아바타 44px */}
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, flexShrink: 0 }}>
                    {req.nickname.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-normal)' }}>
                        {req.nickname}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 거절 / 수락 버튼 */}
                <div style={s.cardActions}>
                  <button
                    style={{ ...s.rejectBtn, opacity: isActing ? 0.5 : 1 }}
                    onClick={() => handleReject(req)}
                    disabled={!!acting}
                  >
                    <X size={15} />
                    거절
                  </button>
                  <button
                    style={{ ...s.acceptBtn, opacity: isActing ? 0.5 : 1 }}
                    onClick={() => handleAccept(req)}
                    disabled={!!acting}
                  >
                    <Check size={15} />
                    수락
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:  { minHeight: '100dvh', background: 'var(--wds-fill)' },
  shell: { minHeight: '100dvh', maxWidth: 430, margin: '0 auto', background: '#fff', display: 'flex', flexDirection: 'column' },

  header: { height: 54, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--wds-line)', flexShrink: 0 },
  backBtn: { border: 'none', background: 'transparent', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text-normal)' },

  scroll: { flex: 1, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  caption: { fontSize: 13, color: 'var(--text-assistive)', lineHeight: 1.6, margin: '0 0 4px' },
  empty: { textAlign: 'center', padding: '48px 0', fontSize: 14, color: 'var(--text-assistive)' },

  card: { borderRadius: 14, border: '1px solid var(--wds-line)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 },
  cardInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  cardActions: { display: 'flex', gap: 8 },

  rejectBtn: { flex: 1, height: 42, borderRadius: 11, border: 'none', background: 'var(--wds-fill-alt)', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
  acceptBtn: { flex: 1, height: 42, borderRadius: 11, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
}
