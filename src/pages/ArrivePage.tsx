import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Clock3, MapPin } from 'lucide-react'

interface Participant {
  userId: number
  nickname: string
  arrived: boolean
}

export default function ArrivePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [arrived, setArrived] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/meetups/${id}/participants`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setParticipants(data))
      .catch(() => {})
  }, [id])

  const handleArrive = async () => {
    if (!id) return
    await fetch(`/api/meetups/${id}/arrive`, { method: 'POST', credentials: 'include' })
    setArrived(true)
    setTimeout(() => navigate(`/meetups/${id}/review`), 1500)
  }

  const AVATAR_COLORS = [
    { bg: '#D7E4FF', color: '#0066FF' },
    { bg: '#FFD9C7', color: '#E0531F' },
    { bg: '#D9F2DD', color: '#00973A' },
  ]

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <button style={s.iconBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <div>
            <div style={s.title}>도착 확인</div>
          </div>
          <span style={{ width: 22 }} />
        </header>

        <div style={s.body}>
          <div style={s.timeBanner}>
            <Clock3 size={15} color="#fff" />
            30분 뒤 만나요
          </div>

          <div style={s.card}>
            <div style={s.cardTitle}>도착 현황</div>
            {participants.length === 0 ? (
              // 백엔드 연결 전 데모 데이터
              [
                { userId: 1, nickname: '민준 (방장)', arrived: true },
                { userId: 2, nickname: 'Sarah', arrived: true },
                { userId: 3, nickname: '유나', arrived: false },
              ].map((p, i) => (
                <div key={p.userId} style={s.row}>
                  <div style={{ ...s.avatar, background: AVATAR_COLORS[i % 3].bg, color: AVATAR_COLORS[i % 3].color }}>
                    {p.nickname.charAt(0)}
                  </div>
                  <span style={s.name}>{p.nickname}</span>
                  {p.arrived ? (
                    <span style={s.arrivedBadge}>
                      <CheckCircle2 size={13} fill="currentColor" />
                      도착
                    </span>
                  ) : (
                    <span style={s.movingBadge}>이동 중</span>
                  )}
                </div>
              ))
            ) : (
              participants.map((p, i) => (
                <div key={p.userId} style={s.row}>
                  <div style={{ ...s.avatar, background: AVATAR_COLORS[i % 3].bg, color: AVATAR_COLORS[i % 3].color }}>
                    {p.nickname.charAt(0)}
                  </div>
                  <span style={s.name}>{p.nickname}</span>
                  {p.arrived ? (
                    <span style={s.arrivedBadge}><CheckCircle2 size={13} fill="currentColor" />도착</span>
                  ) : (
                    <span style={s.movingBadge}>이동 중</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={s.footer}>
          <button
            style={{ ...s.arriveBtn, background: arrived ? '#00973A' : 'var(--primary)' }}
            onClick={handleArrive}
            disabled={arrived}
          >
            <MapPin size={18} fill="rgba(255,255,255,.25)" />
            {arrived ? '도착 확인됐어요 ✓' : '도착했어요'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#F3F5F8' },
  shell: { minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: '#fff', display: 'flex', flexDirection: 'column' },
  header: { height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--wds-line)' },
  iconBtn: { width: 22, height: 22, border: 'none', background: 'transparent', color: 'var(--text-normal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' },
  title: { fontSize: 16, fontWeight: 700, color: 'var(--text-normal)' },
  body: { flex: 1, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 },
  timeBanner: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', borderRadius: 12, background: '#FF9500', color: '#fff', fontSize: 14, fontWeight: 700 },
  card: { borderRadius: 16, border: '1px solid var(--wds-line)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text-assistive)', marginBottom: 2 },
  row: { display: 'flex', alignItems: 'center', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 },
  name: { flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' },
  arrivedBadge: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: '#00973A' },
  movingBadge: { fontSize: 12.5, color: '#9A9DA6' },
  footer: { padding: '12px 18px 36px' },
  arriveBtn: { width: '100%', height: 52, border: 'none', borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 300ms' },
}
