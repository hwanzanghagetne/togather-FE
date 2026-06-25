import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Compass, MapPin, Ticket, UtensilsCrossed, Zap } from 'lucide-react'

type CategoryKey = 'FOOD' | 'CAFE' | 'ACTIVITY' | 'SIGHTSEEING'

const CATEGORIES: Array<{ key: CategoryKey; label: string; icon: typeof UtensilsCrossed; accent: string; tint: string }> = [
  { key: 'FOOD', label: '식사', icon: UtensilsCrossed, accent: '#FF6B35', tint: 'rgba(255,107,53,.12)' },
  { key: 'CAFE', label: '카페·술', icon: Ticket, accent: '#8B5CF6', tint: 'rgba(139,92,246,.12)' },
  { key: 'ACTIVITY', label: '액티비티', icon: Compass, accent: '#0066FF', tint: 'rgba(0,102,255,.10)' },
  { key: 'SIGHTSEEING', label: '관광', icon: MapPin, accent: '#00973A', tint: 'rgba(0,151,58,.10)' },
]

export default function CreateMeetupPage() {
  const navigate = useNavigate()
  const [timing, setTiming] = useState<'now' | 'later'>('now')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryKey>('FOOD')
  const [maxParticipants, setMaxParticipants] = useState(4)
  const [autoApprove, setAutoApprove] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [lat] = useState(35.15)
  const [lng] = useState(129.12)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        category,
        maxParticipants,
        latitude: lat,
        longitude: lng,
      }
      if (timing === 'later' && expiresAt) {
        body.expiresAt = expiresAt
      }
      const res = await fetch('/api/meetups', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        navigate(`/meetups/${data.id}/posted`, { replace: true })
      } else {
        alert('모임 생성에 실패했어요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.topBar}>
          <button style={s.iconBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.topTitle}>
            <Zap size={17} color="#FF6B35" fill="#FF6B35" />
            번개 모임 만들기
          </span>
          <span style={{ width: 22 }} />
        </header>

        <div style={s.body}>
          {/* 지금 바로 / 시간 지정 */}
          <div style={s.modeRow}>
            {(['now', 'later'] as const).map((t) => (
              <button
                key={t}
                style={{ ...s.modeCard, background: timing === t ? 'var(--primary)' : 'var(--wds-fill-alt)', color: timing === t ? '#fff' : 'var(--text-secondary)' }}
                onClick={() => setTiming(t)}
              >
                <div style={{ fontSize: 14, fontWeight: timing === t ? 700 : 600 }}>
                  {t === 'now' ? '지금 바로' : '시간 지정'}
                </div>
                <div style={{ marginTop: 2, fontSize: 11, opacity: timing === t ? 0.85 : 0.6 }}>
                  {t === 'now' ? '바로 모집 시작' : '날짜·시간 선택'}
                </div>
              </button>
            ))}
          </div>

          {timing === 'later' && (
            <section>
              <div style={s.label}>날짜·시간</div>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                style={s.fieldInput}
              />
            </section>
          )}

          <section>
            <div style={s.label}>무엇을 함께 할까요?</div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 오늘 저녁 곱창 같이 먹어요"
              style={{ ...s.fieldInput, borderColor: title ? 'var(--primary)' : 'var(--wds-line)' }}
            />
          </section>

          <section>
            <div style={s.label}>카테고리</div>
            <div style={s.categoryGrid}>
              {CATEGORIES.map((opt) => {
                const Icon = opt.icon
                const active = category === opt.key
                return (
                  <button
                    key={opt.key}
                    style={{ ...s.categoryCard, background: active ? opt.tint : 'var(--wds-fill-alt)', borderColor: active ? opt.accent : 'transparent' }}
                    onClick={() => setCategory(opt.key)}
                  >
                    <Icon size={21} color={active ? opt.accent : '#9A9DA6'} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? opt.accent : '#9A9DA6' }}>{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={s.label}>최대 인원</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{maxParticipants}명</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9A9DA6', marginTop: 4 }}>
              <span>2명</span>
              <span>20명</span>
            </div>
          </section>

          <div style={s.locationCard}>
            <span style={s.locationText}>
              <MapPin size={17} color="var(--primary)" />
              현재 위치 기반
            </span>
            <span style={{ fontSize: 12.5, color: 'var(--primary)', fontWeight: 600 }}>변경</span>
          </div>

          <div style={s.toggleRow}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' }}>자동 승인</div>
              <div style={{ fontSize: 11.5, color: '#9A9DA6', marginTop: 2 }}>누구나 바로 합류</div>
            </div>
            <button
              style={{ ...s.toggle, background: autoApprove ? 'var(--primary)' : '#D8DCE6' }}
              onClick={() => setAutoApprove((v) => !v)}
            >
              <span style={{ ...s.toggleKnob, left: autoApprove ? 21.5 : 2.5 }} />
            </button>
          </div>
        </div>

        <div style={s.footer}>
          <button
            style={{ ...s.submitBtn, opacity: !title.trim() || submitting ? 0.5 : 1 }}
            disabled={!title.trim() || submitting}
            onClick={handleSubmit}
          >
            <Zap size={18} fill="#fff" />
            {submitting ? '게시 중...' : '지금 게시하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#F3F5F8' },
  shell: { minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: '#fff', display: 'flex', flexDirection: 'column' },
  topBar: { height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--wds-line)' },
  topTitle: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: 'var(--text-normal)' },
  iconBtn: { width: 22, height: 22, border: 'none', background: 'transparent', color: 'var(--text-normal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' },
  body: { flex: 1, padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 20 },
  modeRow: { display: 'flex', gap: 10 },
  modeCard: { flex: 1, border: 'none', borderRadius: 14, padding: '13px 0', textAlign: 'center', cursor: 'pointer' },
  label: { fontSize: 13, fontWeight: 700, color: 'var(--text-normal)', marginBottom: 8 },
  fieldInput: { width: '100%', borderRadius: 12, border: '1.5px solid var(--wds-line)', padding: '13px 14px', fontSize: 15, color: 'var(--text-normal)', outline: 'none', boxSizing: 'border-box' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 },
  categoryCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '11px 0', borderRadius: 12, border: '1.5px solid transparent', cursor: 'pointer' },
  locationCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', borderRadius: 12, background: 'var(--wds-fill-alt)' },
  locationText: { display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-normal)' },
  toggleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { width: 46, height: 27, borderRadius: 999, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 200ms' },
  toggleKnob: { position: 'absolute', top: 2.5, width: 22, height: 22, borderRadius: 999, background: '#fff', transition: 'left 150ms ease' },
  footer: { padding: '12px 18px 36px', borderTop: '1px solid var(--wds-line)' },
  submitBtn: { width: '100%', height: 52, borderRadius: 14, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' },
}
