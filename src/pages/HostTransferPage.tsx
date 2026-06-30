import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Crown } from 'lucide-react'
import { apiFetch } from '../api'
import { markLeftMeetup } from '../meetupSession'

interface Participant {
  id: number
  nickname: string
  profileImageUrl?: string
  joinedAt: string
}

interface MeetupDetail {
  id: number
  title: string
  hostId: number
}

const AVATAR_COLORS = [
  { bg: '#FFD9C7', fg: '#E0531F' },
  { bg: '#D7E4FF', fg: '#16A9C4' },
  { bg: '#D9F2DD', fg: '#00973A' },
  { bg: '#EDE4FF', fg: '#6541F2' },
]

export default function HostTransferPage() {
  const navigate = useNavigate()
  const { meetupId } = useParams<{ meetupId: string }>()
  const mid = meetupId ?? ''

  const [meetup, setMeetup] = useState<MeetupDetail | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/meetups/${mid}`).then((r) => r.ok ? r.json() : null),
      apiFetch(`/api/meetups/${mid}/participants`).then((r) => r.ok ? r.json() : []),
    ]).then(([m, p]) => {
      setMeetup(m)
      // 나 자신 제외
      if (m) setParticipants((p as Participant[]).filter((u: Participant) => u.id !== m.hostId))
    }).catch(() => {})
  }, [mid])

  const selectedUser = participants.find((p) => p.id === selected)

  const handleTransfer = async () => {
    if (!selected || submitting) return
    setSubmitting(true)
    try {
      const r = await apiFetch(`/api/meetups/${mid}/host`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newHostId: selected }),
      })
      if (!r.ok) return
      markLeftMeetup(Number(mid))
      setStep('done')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'done') {
    return (
      <div style={s.page}>
        <div style={s.shell}>
          <div style={s.doneWrap}>
            <div style={s.doneIcon}>
              <Crown size={36} color="#FF9200" fill="rgba(255,146,0,.2)" />
            </div>
            <div style={s.doneTitle}>방장을 넘겼어요</div>
            <div style={s.doneDesc}>
              <strong>{selectedUser?.nickname}</strong>님이 새 방장이에요
            </div>
            <button style={s.doneBtn} onClick={() => navigate('/meetups', { replace: true })}>
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
          <button style={s.backBtn} onClick={() => step === 'confirm' ? setStep('select') : navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>
            {step === 'confirm' ? '방장 양도 확인' : '방장 양도'}
          </span>
        </header>

        {step === 'select' && (
          <div style={s.scroll}>
            <div style={s.desc}>방장을 넘길 사람을 선택해요. 나가기 전에 꼭 선택해야 해요.</div>

            {meetup && (
              <div style={s.meetupBanner}>
                <Crown size={16} color="#FF9200" />
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-normal)' }}>{meetup.title}</span>
              </div>
            )}

            <div style={s.listLabel}>참여자 {participants.length}명</div>
            <div style={s.list}>
              {participants.length === 0 ? (
                <div style={s.emptyList}>
                  <div style={{ fontSize: 14, color: 'var(--text-assistive)', textAlign: 'center', padding: '24px 0' }}>
                    다른 참여자가 없어요.<br />방장이 나가면 모임이 종료돼요.
                  </div>
                  <button style={s.dissolveBtn} onClick={async () => {
                    await apiFetch(`/api/meetups/${mid}`, { method: 'DELETE' }).catch(() => {})
                    markLeftMeetup(Number(mid))
                    navigate('/meetups', { replace: true })
                  }}>
                    모임 종료하고 나가기
                  </button>
                </div>
              ) : (
                participants.map((p, i) => {
                  const c = AVATAR_COLORS[i % AVATAR_COLORS.length]
                  const isSelected = selected === p.id
                  return (
                    <button
                      key={p.id}
                      style={{ ...s.participantRow, background: isSelected ? 'var(--primary-tint)' : '#fff', borderColor: isSelected ? 'var(--primary)' : 'var(--wds-line)' }}
                      onClick={() => setSelected(isSelected ? null : p.id)}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 999, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: c.fg, flexShrink: 0 }}>
                        {p.nickname.charAt(0)}
                      </div>
                      <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--text-normal)', textAlign: 'left' }}>{p.nickname}</span>
                      <div style={{ ...s.radioOuter, borderColor: isSelected ? 'var(--primary)' : 'var(--wds-line)' }}>
                        {isSelected && <div style={s.radioInner} />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {step === 'confirm' && selectedUser && (
          <div style={s.confirmWrap}>
            <div style={s.confirmCard}>
              <Crown size={32} color="#FF9200" />
              <div style={s.confirmName}>{selectedUser.nickname}</div>
              <div style={s.confirmDesc}>이 분에게 방장을 넘길까요?</div>
              <div style={s.confirmNote}>방장을 넘기면 당신은 일반 참여자가 돼요</div>
            </div>
          </div>
        )}

        <div style={s.footer}>
          {step === 'select' && participants.length > 0 && (
            <button
              style={{ ...s.primaryBtn, opacity: selected ? 1 : 0.4 }}
              onClick={() => selected && setStep('confirm')}
              disabled={!selected}
            >
              <Crown size={16} color="#fff" />
              이 분에게 방장 넘기기
            </button>
          )}
          {step === 'confirm' && (
            <>
              <button
                style={{ ...s.primaryBtn, opacity: submitting ? 0.6 : 1 }}
                onClick={handleTransfer}
                disabled={submitting}
              >
                {submitting ? '처리 중...' : '방장 넘기고 나가기'}
              </button>
              <button style={s.ghostBtn} onClick={() => setStep('select')}>
                다시 선택
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: 'var(--wds-fill)' },
  shell: { minHeight: '100dvh', maxWidth: 430, margin: '0 auto', background: '#fff', display: 'flex', flexDirection: 'column' },

  header: { height: 54, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--wds-line)', flexShrink: 0 },
  backBtn: { border: 'none', background: 'transparent', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  headerTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },

  scroll: { flex: 1, overflowY: 'auto', padding: '20px 16px' },
  desc: { fontSize: 14, color: 'var(--text-assistive)', lineHeight: 1.6, marginBottom: 16 },
  meetupBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,146,0,.08)', marginBottom: 20 },
  listLabel: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: '0.02em' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  participantRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1.5px solid', background: '#fff', cursor: 'pointer', transition: 'all 150ms ease' },
  radioOuter: { width: 20, height: 20, borderRadius: 999, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 150ms ease' },
  radioInner: { width: 10, height: 10, borderRadius: 999, background: 'var(--primary)' },
  emptyList: { display: 'flex', flexDirection: 'column', gap: 12 },
  dissolveBtn: { height: 46, borderRadius: 12, border: 'none', background: 'rgba(255,66,66,.08)', color: 'var(--negative)', fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  confirmWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px' },
  confirmCard: { width: '100%', borderRadius: 20, background: 'var(--wds-fill)', padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' },
  confirmName: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  confirmDesc: { fontSize: 15, color: 'var(--text-secondary)' },
  confirmNote: { fontSize: 12.5, color: 'var(--text-assistive)', lineHeight: 1.5 },

  footer: { padding: '12px 16px 36px', display: 'flex', flexDirection: 'column', gap: 9, flexShrink: 0, borderTop: '1px solid var(--wds-line)' },
  primaryBtn: { height: 50, borderRadius: 13, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'opacity 150ms ease' },
  ghostBtn: { height: 46, borderRadius: 13, border: '1.5px solid var(--wds-line)', background: '#fff', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  doneWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 24px', textAlign: 'center' },
  doneIcon: { width: 80, height: 80, borderRadius: 999, background: 'rgba(255,146,0,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneTitle: { fontSize: 24, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  doneDesc: { fontSize: 15, color: 'var(--text-secondary)' },
  doneBtn: { marginTop: 16, height: 50, borderRadius: 13, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '0 32px' },
}
