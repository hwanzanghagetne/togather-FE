import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronLeft, Lock, UserPlus } from 'lucide-react'
import { apiFetch } from '../api'

interface MeetupDetail {
  id: number
  title: string
  category: string
  currentCount: number
  hostNickname: string
  isPublic?: boolean
}

const CAT_EMOJI: Record<string, string> = {
  FOOD: '🍽', CAFE: '☕', ACTIVITY: '⚡', SIGHTSEEING: '📍',
}

type Step = 'requesting' | 'done'

export default function JoinRequestPage() {
  const navigate = useNavigate()
  const { meetupId } = useParams<{ meetupId: string }>()
  const mid = meetupId ?? ''

  const [meetup, setMeetup] = useState<MeetupDetail | null>(null)
  const [step, setStep] = useState<Step>('requesting')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    apiFetch(`/api/meetups/${mid}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setMeetup(d))
      .catch(() => {})
  }, [mid])

  const handleRequest = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await apiFetch(`/api/meetups/${mid}/join`, { method: 'POST' }).catch(() => {})
      setStep('done')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (cancelling) return
    setCancelling(true)
    try {
      await apiFetch(`/api/meetups/${mid}/join`, { method: 'DELETE' }).catch(() => {})
      navigate(-1)
    } finally {
      setCancelling(false)
    }
  }

  // ── ② 요청 보냄 · 승인 대기 ─────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div style={s.page}>
        <div style={s.shell}>
          <header style={s.header}>
            <button style={s.backBtn} onClick={() => navigate('/meetups')}>
              <ChevronLeft size={22} />
            </button>
          </header>

          <div style={s.doneScroll}>
            {/* 모래시계 아이콘 */}
            <div style={s.doneIconWrap}>
              <span style={{ fontSize: 30 }}>⏳</span>
            </div>

            <div style={s.doneTitle}>참여 요청을 보냈어요</div>
            <div style={s.doneDesc}>방장이 확인하면 알림으로 알려드릴게요</div>

            {/* 모임 요약 카드 */}
            {meetup && (
              <div style={s.summaryCard}>
                <div style={s.summaryTile}>
                  {CAT_EMOJI[meetup.category] ?? '●'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.summaryTitle}>{meetup.title}</div>
                  <div style={s.summaryMeta}>{meetup.hostNickname} · {meetup.currentCount}명 참여</div>
                </div>
                <div style={s.pendingBadge}>승인 대기 중</div>
              </div>
            )}
          </div>

          {/* 요청 취소 버튼 */}
          <div style={s.footer}>
            <button
              style={{ ...s.cancelBtn, opacity: cancelling ? 0.6 : 1 }}
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? '취소 중...' : '요청 취소'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ① 참여 요청 진입 ──────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>참여 요청</span>
        </header>

        <div style={s.scroll}>
          {/* 비공개 배지 */}
          <div style={s.privateBadge}>
            <Lock size={13} color="#6541F2" />
            <span>비공개 모임</span>
          </div>

          {/* 모임 정보 카드 */}
          {meetup && (
            <div style={s.meetupCard}>
              <div style={s.catTile}>{CAT_EMOJI[meetup.category] ?? '●'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.meetupTitle}>{meetup.title}</div>
                <div style={s.meetupMeta}>{meetup.hostNickname} 방장 · {meetup.currentCount}명 참여</div>
              </div>
            </div>
          )}

          {/* 안내 */}
          <div style={s.infoBox}>
            <div style={s.infoTitle}>비공개 모임이에요</div>
            <div style={s.infoDesc}>방장이 요청을 수락해야 채팅방에 참여할 수 있어요.</div>
          </div>
        </div>

        <div style={s.footer}>
          <button
            style={{ ...s.primaryBtn, opacity: submitting ? 0.6 : 1 }}
            onClick={handleRequest}
            disabled={submitting}
          >
            {submitting ? (
              '요청 보내는 중...'
            ) : (
              <>
                <UserPlus size={17} color="#fff" />
                참여 요청하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

const VIOLET = '#6541F2'

const s: Record<string, React.CSSProperties> = {
  page:  { minHeight: '100dvh', background: '#fff' },
  shell: { minHeight: '100dvh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column' },

  header: { height: 54, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--wds-line)', flexShrink: 0 },
  backBtn: { border: 'none', background: 'transparent', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  headerTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },

  scroll: { flex: 1, overflowY: 'auto', padding: '24px 20px' },

  privateBadge: { display: 'inline-flex', alignItems: 'center', gap: 5, background: `rgba(101,65,242,.1)`, borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, color: VIOLET, marginBottom: 16 },

  meetupCard: { display: 'flex', alignItems: 'center', gap: 13, padding: '16px', borderRadius: 16, background: 'var(--wds-fill)', marginBottom: 20 },
  catTile: { width: 48, height: 48, borderRadius: 13, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 },
  meetupTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meetupMeta: { marginTop: 4, fontSize: 12, color: 'var(--text-assistive)' },

  infoBox: { display: 'flex', flexDirection: 'column', gap: 6 },
  infoTitle: { fontSize: 19, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  infoDesc: { fontSize: 14, color: 'var(--text-assistive)', lineHeight: 1.6 },

  footer: { padding: '12px 20px 36px', borderTop: '1px solid var(--wds-line)', flexShrink: 0 },
  primaryBtn: { width: '100%', height: 50, borderRadius: 13, border: 'none', background: VIOLET, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity 150ms ease' },
  cancelBtn: { width: '100%', height: 48, borderRadius: 13, border: '1px solid var(--wds-line)', background: '#fff', color: 'var(--text-secondary)', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'opacity 150ms ease' },

  // done state
  doneScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 32px', gap: 0 },
  doneIconWrap: { width: 80, height: 80, borderRadius: 999, background: 'rgba(255,146,0,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  doneTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 8 },
  doneDesc: { fontSize: 14, color: 'var(--text-assistive)', lineHeight: 1.6, textAlign: 'center', marginBottom: 28 },

  summaryCard: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'var(--wds-fill-alt)' },
  summaryTile: { width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  summaryTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  summaryMeta: { fontSize: 12, color: 'var(--text-assistive)', marginTop: 2 },
  pendingBadge: { fontSize: 12.5, fontWeight: 700, color: '#FF9200', flexShrink: 0 },
}

// suppress unused import warning
void Check
