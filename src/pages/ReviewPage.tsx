import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Star } from 'lucide-react'
import { apiFetch } from '../api'

const TAGS = ['시간 약속을 잘 지켜요', '대화가 즐거워요', '친절해요', '또 만나고 싶어요']

const AVATAR_PALETTE = [
  { bg: '#D7E4FF', color: '#16A9C4' },
  { bg: '#FFD9C7', color: '#E0531F' },
  { bg: '#D9F2DD', color: '#00973A' },
  { bg: '#EDE4FF', color: '#6541F2' },
]

interface Meetup {
  title: string
  currentCount: number
}

interface Participant {
  userId: number
  nickname: string
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [meetup, setMeetup] = useState<Meetup | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [rating, setRating] = useState(5)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiFetch(`/api/meetups/${id}`).then((r) => r.ok ? r.json() : null),
      apiFetch(`/api/meetups/${id}/participants`).then((r) => r.ok ? r.json() : []),
    ]).then(([m, p]) => {
      if (m) setMeetup(m)
      if (Array.isArray(p)) setParticipants(p)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await apiFetch(`/api/meetups/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, tags: selectedTags }),
      })
      setDone(true)
      setTimeout(() => navigate('/meetups', { replace: true }), 1800)
    } finally {
      setSubmitting(false)
    }
  }

  const displayTitle = meetup?.title ?? (loading ? '' : '이 모임')
  const avatarList = participants.slice(0, 4)

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <div style={s.topLabel}>모임 평가</div>
          <span style={{ width: 36 }} />
        </header>

        <div style={s.body}>
          {loading ? (
            <>
              <div style={s.skeletonTitle} />
              <div style={s.skeletonSub} />
            </>
          ) : (
            <>
              <div style={s.question}>
                {displayTitle ? `${displayTitle}, 어땠나요?` : '모임이 어땠나요?'}
              </div>
              <div style={s.sub}>평가는 매너온도에 반영돼요</div>
            </>
          )}

          {/* 참여자 아바타 스택 */}
          <div style={s.avatarRow}>
            {avatarList.length > 0 ? (
              avatarList.map((p, i) => {
                const av = AVATAR_PALETTE[i % AVATAR_PALETTE.length]
                return (
                  <div key={p.userId} style={{ ...s.avatar, background: av.bg, color: av.color, marginLeft: i === 0 ? 0 : -14, zIndex: i }}>
                    {p.nickname.charAt(0)}
                  </div>
                )
              })
            ) : (
              /* 참여자 API 없을 때 — 개수만큼 팔레트 순서로 표시 */
              Array.from({ length: Math.min(meetup?.currentCount ?? 3, 4) }).map((_, i) => {
                const av = AVATAR_PALETTE[i % AVATAR_PALETTE.length]
                return (
                  <div key={i} style={{ ...s.avatar, background: av.bg, color: av.color, marginLeft: i === 0 ? 0 : -14, zIndex: i }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                )
              })
            )}
          </div>

          {/* 별점 */}
          <div style={s.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} style={s.starBtn} onClick={() => setRating(i + 1)}>
                <Star size={34} color="#FFB020" fill={i < rating ? '#FFB020' : 'transparent'} />
              </button>
            ))}
          </div>

          {/* 태그 */}
          <div>
            <div style={s.tagLabel}>어떤 점이 좋았나요?</div>
            <div style={s.tagWrap}>
              {TAGS.map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    style={{ ...s.tag, ...(active ? s.tagActive : {}) }}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {done && <div style={s.doneBanner}>평가가 저장됐어요 ✓</div>}
        </div>

        <div style={s.footer}>
          <button
            style={{ ...s.submitBtn, opacity: submitting || done ? 0.6 : 1 }}
            disabled={submitting || done}
            onClick={handleSubmit}
          >
            {done ? '완료!' : submitting ? '저장 중...' : '평가 보내기'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#fff' },
  shell: { minHeight: '100dvh', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' },
  header: { height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--wds-line)', flexShrink: 0 },
  backBtn: { width: 36, height: 36, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  topLabel: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)' },
  body: { flex: 1, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 24 },
  question: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em', lineHeight: 1.3 },
  sub: { fontSize: 13.5, color: '#9A9DA6', marginTop: -16 },
  skeletonTitle: { height: 30, width: '75%', borderRadius: 8, background: 'var(--wds-fill)', animation: 'pulse 1.4s ease infinite' },
  skeletonSub: { height: 18, width: '50%', borderRadius: 6, background: 'var(--wds-fill)', animation: 'pulse 1.4s ease infinite', marginTop: -16 },
  avatarRow: { display: 'flex', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 999, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 },
  stars: { display: 'flex', gap: 4 },
  starBtn: { border: 'none', background: 'transparent', padding: 2, cursor: 'pointer' },
  tagLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text-normal)', marginBottom: 10 },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { padding: '8px 14px', borderRadius: 999, border: '1.5px solid var(--wds-line)', background: '#fff', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' },
  tagActive: { border: '1.5px solid var(--primary)', background: 'rgba(22,169,196,.08)', color: 'var(--primary)', fontWeight: 600 },
  doneBanner: { textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#00973A', padding: '12px 0', background: 'rgba(0,151,58,.08)', borderRadius: 12 },
  footer: { padding: '12px 18px 36px', borderTop: '1px solid var(--wds-line)' },
  submitBtn: { width: '100%', height: 50, border: 'none', borderRadius: 13, background: 'var(--primary)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
}
