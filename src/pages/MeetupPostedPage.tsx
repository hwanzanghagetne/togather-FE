import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, UtensilsCrossed } from 'lucide-react'
import { apiFetch } from '../api'

interface MeetupDetail {
  id: number
  title: string
  currentCount: number
}

export default function MeetupPostedPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [meetup, setMeetup] = useState<MeetupDetail | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!id) return
    apiFetch(`/api/meetups/${id}`)
      .then((r) => r.json())
      .then((data) => setMeetup(data))
      .catch(() => {})
  }, [id])

  // 게시 후 경과 초 카운터
  useEffect(() => {
    const timer = setInterval(() => setElapsed((v) => v + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatElapsed = (sec: number) => {
    if (sec < 60) return `${sec}초`
    return `${Math.floor(sec / 60)}분 ${sec % 60}초`
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <div style={s.body}>
          {/* 체크 아이콘 */}
          <div style={s.checkOuter}>
            <div style={s.checkInner}>
              <Check size={32} color="#fff" strokeWidth={3} />
            </div>
          </div>

          <div style={s.title}>번개가 떴어요</div>
          <div style={s.desc}>
            반경 2km 안 <strong style={{ color: 'var(--text-normal)' }}>38명</strong>에게
            <br />방금 알림을 보냈어요
          </div>

          {/* 실시간 통계 카드 */}
          <div style={s.card}>
            <div style={s.mapArea}>
              <div style={s.mapHalo} />
              <div style={s.mapPin}>
                <UtensilsCrossed size={18} color="#fff" />
              </div>
              <div style={s.liveBadge}>
                <span style={s.liveDot} />
                실시간 노출 중
              </div>
            </div>
            <div style={s.stats}>
              <div style={s.statCell}>
                <strong>{formatElapsed(elapsed)}</strong>
                <span>게시 후</span>
              </div>
              <div style={s.statCell}>
                <strong>{meetup?.currentCount ?? 0}</strong>
                <span>참가</span>
              </div>
              <div style={s.statCell}>
                <strong style={{ color: 'var(--primary)' }}>0</strong>
                <span>관심</span>
              </div>
            </div>
          </div>
        </div>

        <div style={s.footer}>
          <button style={s.primaryBtn} onClick={() => navigate(`/chat/${id}`)}>
            모임 채팅 보기
          </button>
          <button style={s.ghostBtn} onClick={() => navigate('/meetups')}>
            목록으로
          </button>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#F3F5F8' },
  shell: { minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: '#fff', display: 'flex', flexDirection: 'column' },
  body: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px 0', textAlign: 'center' },
  checkOuter: { width: 96, height: 96, borderRadius: 999, background: 'rgba(0,102,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  checkInner: { width: 66, height: 66, borderRadius: 999, background: 'var(--primary)', boxShadow: '0 8px 20px rgba(0,102,255,.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em', marginBottom: 10 },
  desc: { fontSize: 15, lineHeight: 1.6, color: '#9A9DA6', marginBottom: 32 },
  card: { width: '100%', borderRadius: 16, border: '1px solid var(--wds-line)', overflow: 'hidden' },
  mapArea: { height: 120, background: '#EFF2F6', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mapHalo: { position: 'absolute', width: 80, height: 80, borderRadius: 999, background: 'rgba(0,102,255,.12)', animation: 'pulse 2s infinite' },
  mapPin: { width: 44, height: 44, borderRadius: 999, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,102,255,.3)' },
  liveBadge: { position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: '#fff', fontSize: 11.5, fontWeight: 600, color: 'var(--text-normal)', boxShadow: '0 1px 6px rgba(0,0,0,.1)' },
  liveDot: { width: 6, height: 6, borderRadius: 999, background: '#00C853', display: 'inline-block' },
  stats: { display: 'flex' },
  statCell: { flex: 1, padding: '14px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, borderTop: '1px solid var(--wds-line)', fontSize: 12, color: '#9A9DA6', fontWeight: 500 },
  footer: { padding: '16px 18px 36px', display: 'flex', flexDirection: 'column', gap: 10 },
  primaryBtn: { height: 52, border: 'none', borderRadius: 14, background: 'var(--primary)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  ghostBtn: { height: 46, border: '1.5px solid var(--wds-line)', borderRadius: 14, background: 'transparent', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
