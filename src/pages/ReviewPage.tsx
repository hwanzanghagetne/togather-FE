import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star } from 'lucide-react'
import { apiFetch } from '../api'

const TAGS = ['시간 약속을 잘 지켜요', '대화가 즐거워요', '친절해요', '또 만나고 싶어요']

const AVATARS = [
  { label: '민', bg: '#D7E4FF', color: '#0066FF' },
  { label: 'S', bg: '#FFD9C7', color: '#E0531F' },
  { label: '유', bg: '#D9F2DD', color: '#00973A' },
]

export default function ReviewPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [rating, setRating] = useState(5)
  const [selectedTags, setSelectedTags] = useState<string[]>(['시간 약속을 잘 지켜요', '대화가 즐거워요'])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

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

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <div style={s.topLabel}>모임 평가</div>

        <div style={s.body}>
          <div style={s.question}>오늘 곱창 번개, 어땠나요?</div>
          <div style={s.sub}>평가는 매너온도에 반영돼요</div>

          <div style={s.avatarRow}>
            {AVATARS.map((a, i) => (
              <div key={a.label} style={{ ...s.avatar, background: a.bg, color: a.color, marginLeft: i === 0 ? 0 : -14, zIndex: i }}>
                {a.label}
              </div>
            ))}
          </div>

          <div style={s.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} style={s.starBtn} onClick={() => setRating(i + 1)}>
                <Star size={34} color="#FFB020" fill={i < rating ? '#FFB020' : 'transparent'} />
              </button>
            ))}
          </div>

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
  topLabel: { paddingTop: 20, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-assistive)', letterSpacing: '0.04em' },
  body: { flex: 1, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 24 },
  question: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em', lineHeight: 1.3 },
  sub: { fontSize: 13.5, color: '#9A9DA6', marginTop: -16 },
  avatarRow: { display: 'flex', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 999, border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 },
  stars: { display: 'flex', gap: 4 },
  starBtn: { border: 'none', background: 'transparent', padding: 2, cursor: 'pointer' },
  tagLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text-normal)', marginBottom: 10 },
  tagWrap: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  tag: { padding: '8px 14px', borderRadius: 999, border: '1.5px solid var(--wds-line)', background: '#fff', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' },
  tagActive: { border: '1.5px solid var(--primary)', background: 'rgba(0,102,255,.08)', color: 'var(--primary)', fontWeight: 600 },
  doneBanner: { textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#00973A', padding: '12px 0', background: 'rgba(0,151,58,.08)', borderRadius: 12 },
  footer: { padding: '12px 18px 36px', borderTop: '1px solid var(--wds-line)' },
  submitBtn: { width: '100%', height: 52, border: 'none', borderRadius: 14, background: 'var(--primary)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' },
}
