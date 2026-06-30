import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Lock } from 'lucide-react'
import { apiFetch } from '../api'

interface MeetupDetail {
  id: number
  title: string
  category: string
  currentCount: number
  maxParticipants: number
  hostNickname: string
}

const CAT_EMOJI: Record<string, string> = {
  FOOD: '🍽', CAFE: '☕', ACTIVITY: '⚡', SIGHTSEEING: '📍', OTHER: '●',
}

type Step = 'intro' | 'message' | 'done'

export default function JoinRequestPage() {
  const navigate = useNavigate()
  const { meetupId } = useParams<{ meetupId: string }>()
  const mid = meetupId ?? ''

  const [meetup, setMeetup] = useState<MeetupDetail | null>(null)
  const [step, setStep] = useState<Step>('intro')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msgFocused, setMsgFocused] = useState(false)

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
      await apiFetch(`/api/meetups/${mid}/join-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      }).catch(() => {})
      setStep('done')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div style={s.page}>
        <div style={s.shell}>
          <header style={s.header}>
            <button style={s.backBtn} onClick={() => navigate(-1)}>
              <ChevronLeft size={22} />
            </button>
          </header>
          <div style={s.doneWrap}>
            <div style={s.doneIconWrap}>
              <Lock size={32} color="var(--primary)" />
            </div>
            <div style={s.doneTitle}>요청을 보냈어요!</div>
            <div style={s.doneDesc}>
              <strong>{meetup?.hostNickname ?? '방장'}</strong>님이 수락하면<br />
              채팅방에 입장할 수 있어요
            </div>
            <div style={s.pendingCard}>
              <div style={s.pendingDot} />
              <span style={s.pendingLabel}>수락 대기 중</span>
              <span style={s.pendingNote}>알림으로 알려드려요</span>
            </div>
            <button style={s.doneBtn} onClick={() => navigate('/meetups')}>
              내 모임으로 이동
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <button style={s.backBtn} onClick={() => step === 'message' ? setStep('intro') : navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>참가 요청</span>
        </header>

        <div style={s.scroll}>
          {/* 모임 정보 카드 */}
          {meetup && (
            <div style={s.meetupCard}>
              <div style={s.catTile}>{CAT_EMOJI[meetup.category] ?? '●'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Lock size={13} color="var(--text-assistive)" />
                  <span style={s.privateBadge}>비공개</span>
                </div>
                <div style={s.meetupTitle}>{meetup.title}</div>
                <div style={s.meetupMeta}>{meetup.hostNickname} 방장 · {meetup.currentCount}/{meetup.maxParticipants}명</div>
              </div>
            </div>
          )}

          {step === 'intro' && (
            <div style={s.introSection}>
              <div style={s.infoTitle}>비공개 모임이에요</div>
              <div style={s.infoDesc}>
                방장이 요청을 수락해야 채팅방에 참여할 수 있어요.<br />
                요청 메시지와 함께 보내면 수락률이 높아져요.
              </div>
              <div style={s.tips}>
                {[
                  '짧게 자기소개를 해보세요',
                  '어디서 왔는지 알려주세요',
                  '모임에 관심 있는 이유를 말해요',
                ].map((tip, i) => (
                  <div key={i} style={s.tipRow}>
                    <span style={s.tipBullet}>·</span>
                    <span style={s.tipText}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'message' && (
            <div style={s.messageSection}>
              <div style={s.infoTitle}>방장에게 메시지를 남겨요</div>
              <div style={s.infoDesc}>짧은 소개로 수락 가능성을 높여보세요.</div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onFocus={() => setMsgFocused(true)}
                onBlur={() => setMsgFocused(false)}
                placeholder="안녕하세요! 저는 부산 여행 중인 관광객인데요..."
                rows={5}
                maxLength={200}
                style={{
                  ...s.textarea,
                  border: msgFocused ? '1.5px solid var(--primary)' : '1px solid var(--wds-line)',
                  boxShadow: msgFocused ? '0 0 0 4px rgba(22,169,196,.08)' : 'none',
                }}
              />
              <div style={s.charCount}>{message.length}/200</div>
            </div>
          )}
        </div>

        <div style={s.footer}>
          {step === 'intro' && (
            <button style={s.primaryBtn} onClick={() => setStep('message')}>
              <Lock size={16} color="#fff" />
              참가 요청하기
            </button>
          )}
          {step === 'message' && (
            <button
              style={{ ...s.primaryBtn, opacity: submitting ? 0.6 : 1 }}
              onClick={handleRequest}
              disabled={submitting}
            >
              {submitting ? '요청 보내는 중...' : '요청 보내기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#fff' },
  shell: { minHeight: '100dvh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column' },

  header: { height: 54, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--wds-line)', flexShrink: 0 },
  backBtn: { border: 'none', background: 'transparent', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  headerTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },

  scroll: { flex: 1, overflowY: 'auto', padding: '20px 20px' },

  meetupCard: { display: 'flex', alignItems: 'flex-start', gap: 13, padding: '16px', borderRadius: 16, background: 'var(--wds-fill)', marginBottom: 24 },
  catTile: { width: 52, height: 52, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 },
  privateBadge: { fontSize: 11, fontWeight: 700, color: 'var(--text-assistive)' },
  meetupTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)', lineHeight: 1.35 },
  meetupMeta: { marginTop: 4, fontSize: 12, color: 'var(--text-assistive)' },

  introSection: { display: 'flex', flexDirection: 'column', gap: 16 },
  infoTitle: { fontSize: 19, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  infoDesc: { fontSize: 14, color: 'var(--text-assistive)', lineHeight: 1.6 },
  tips: { display: 'flex', flexDirection: 'column', gap: 8, padding: '16px', borderRadius: 14, background: 'var(--primary-tint)' },
  tipRow: { display: 'flex', gap: 8 },
  tipBullet: { color: 'var(--primary)', fontWeight: 700, flexShrink: 0 },
  tipText: { fontSize: 13.5, color: '#0C7A91', fontWeight: 500, lineHeight: 1.5 },

  messageSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  textarea: { width: '100%', borderRadius: 14, padding: '14px', fontSize: 14, color: 'var(--text-normal)', outline: 'none', background: '#fff', boxSizing: 'border-box', resize: 'none', lineHeight: 1.6, transition: 'border 150ms ease, box-shadow 150ms ease' },
  charCount: { fontSize: 11.5, color: 'var(--text-assistive)', textAlign: 'right' },

  footer: { padding: '12px 20px 36px', borderTop: '1px solid var(--wds-line)', flexShrink: 0 },
  primaryBtn: { width: '100%', height: 50, borderRadius: 13, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity 150ms ease' },

  doneWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 28px', textAlign: 'center' },
  doneIconWrap: { width: 80, height: 80, borderRadius: 999, background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneTitle: { fontSize: 24, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  doneDesc: { fontSize: 14, color: 'var(--text-assistive)', lineHeight: 1.7 },
  pendingCard: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'var(--wds-fill)', marginTop: 4 },
  pendingDot: { width: 8, height: 8, borderRadius: 999, background: '#FF9200', flexShrink: 0 },
  pendingLabel: { fontSize: 13.5, fontWeight: 700, color: '#FF9200' },
  pendingNote: { fontSize: 12, color: 'var(--text-assistive)', marginLeft: 4 },
  doneBtn: { marginTop: 12, height: 50, borderRadius: 13, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '0 40px' },
}
