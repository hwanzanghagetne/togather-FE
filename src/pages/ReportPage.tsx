import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Flag } from 'lucide-react'
import { apiFetch } from '../api'

type ReportReason = 'OFFENSIVE' | 'FRAUD' | 'NO_SHOW' | 'SPAM' | 'OTHER'

const REASONS: { key: ReportReason; label: string; desc: string }[] = [
  { key: 'OFFENSIVE', label: '불쾌한 언어·행동', desc: '욕설, 혐오 발언, 성희롱 등' },
  { key: 'FRAUD', label: '사기 의심', desc: '금전 요구, 허위 정보 제공' },
  { key: 'NO_SHOW', label: '모임 불이행', desc: '약속을 지키지 않아 모임이 무산됨' },
  { key: 'SPAM', label: '광고·스팸', desc: '반복적인 홍보 또는 도배' },
  { key: 'OTHER', label: '기타', desc: '위에 해당하지 않는 문제' },
]

type Step = 'reason' | 'detail' | 'confirm' | 'done'

export default function ReportPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetType = searchParams.get('type') ?? 'USER'
  const targetId = searchParams.get('id') ?? ''

  const [step, setStep] = useState<Step>('reason')
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [detailFocused, setDetailFocused] = useState(false)

  const handleSubmit = async () => {
    if (!reason || submitting) return
    setSubmitting(true)
    try {
      await apiFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, detail: detail.trim() }),
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
          <div style={s.doneWrap}>
            <div style={s.doneIconWrap}>
              <Flag size={32} color="var(--negative)" />
            </div>
            <div style={s.doneTitle}>신고가 접수됐어요</div>
            <div style={s.doneDesc}>
              검토까지 최대 24시간이 걸릴 수 있어요.<br />
              결과는 알림으로 알려드려요.
            </div>
            <button style={s.doneBtn} onClick={() => navigate(-2)}>
              확인
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
          <button style={s.backBtn} onClick={() => step === 'reason' ? navigate(-1) : setStep(step === 'confirm' ? 'detail' : 'reason')}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>신고하기</span>
          <div style={s.stepIndicator}>
            {(['reason', 'detail', 'confirm'] as Step[]).map((st, i) => (
              <div key={st} style={{ ...s.stepDot, background: step === st ? 'var(--primary)' : step === 'done' || (['reason','detail','confirm'] as Step[]).indexOf(step) > i ? 'var(--primary)' : 'var(--wds-line-strong)' }} />
            ))}
          </div>
        </header>

        <div style={s.scroll}>
          {step === 'reason' && (
            <>
              <div style={s.stepTitle}>어떤 문제가 있었나요?</div>
              <div style={s.stepDesc}>신고 이유를 선택해요. 검토 후 조치를 취할게요.</div>
              <div style={s.list}>
                {REASONS.map((r) => (
                  <button
                    key={r.key}
                    style={{ ...s.reasonRow, borderColor: reason === r.key ? 'var(--primary)' : 'var(--wds-line)', background: reason === r.key ? 'var(--primary-tint)' : '#fff' }}
                    onClick={() => setReason(r.key)}
                  >
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ ...s.reasonLabel, color: reason === r.key ? 'var(--primary)' : 'var(--text-normal)' }}>{r.label}</div>
                      <div style={s.reasonDesc}>{r.desc}</div>
                    </div>
                    <div style={{ ...s.radio, borderColor: reason === r.key ? 'var(--primary)' : 'var(--wds-line-strong)' }}>
                      {reason === r.key && <div style={s.radioDot} />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'detail' && (
            <>
              <div style={s.stepTitle}>자세한 내용을 알려주세요</div>
              <div style={s.stepDesc}>선택 사항이에요. 더 정확한 검토에 도움돼요.</div>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                onFocus={() => setDetailFocused(true)}
                onBlur={() => setDetailFocused(false)}
                placeholder="어떤 일이 있었는지 알려주세요 (최대 300자)"
                rows={6}
                maxLength={300}
                style={{
                  ...s.textarea,
                  border: detailFocused ? '1.5px solid var(--primary)' : '1px solid var(--wds-line)',
                  boxShadow: detailFocused ? '0 0 0 4px rgba(22,169,196,.08)' : 'none',
                }}
              />
              <div style={s.charCount}>{detail.length}/300</div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div style={s.stepTitle}>신고 내용을 확인해요</div>
              <div style={s.confirmCard}>
                <div style={s.confirmRow}>
                  <span style={s.confirmKey}>신고 유형</span>
                  <span style={s.confirmVal}>{REASONS.find((r) => r.key === reason)?.label}</span>
                </div>
                {detail && (
                  <div style={{ ...s.confirmRow, alignItems: 'flex-start', borderBottom: 'none' }}>
                    <span style={s.confirmKey}>상세 내용</span>
                    <span style={{ ...s.confirmVal, lineHeight: 1.5, textAlign: 'right', maxWidth: 180 }}>{detail}</span>
                  </div>
                )}
              </div>
              <div style={s.warningBox}>
                허위 신고는 서비스 이용이 제한될 수 있어요.
              </div>
            </>
          )}
        </div>

        <div style={s.footer}>
          {step === 'reason' && (
            <button style={{ ...s.primaryBtn, opacity: reason ? 1 : 0.4 }} onClick={() => reason && setStep('detail')} disabled={!reason}>
              다음
            </button>
          )}
          {step === 'detail' && (
            <button style={s.primaryBtn} onClick={() => setStep('confirm')}>
              다음
            </button>
          )}
          {step === 'confirm' && (
            <button style={{ ...s.primaryBtn, background: 'var(--negative)', opacity: submitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? '신고 중...' : '신고 제출하기'}
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },
  stepIndicator: { display: 'flex', gap: 5, alignItems: 'center' },
  stepDot: { width: 6, height: 6, borderRadius: 999, transition: 'background 200ms ease' },

  scroll: { flex: 1, overflowY: 'auto', padding: '28px 20px' },
  stepTitle: { fontSize: 21, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em', marginBottom: 6 },
  stepDesc: { fontSize: 13.5, color: 'var(--text-assistive)', lineHeight: 1.5, marginBottom: 24 },

  list: { display: 'flex', flexDirection: 'column', gap: 9 },
  reasonRow: { display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderRadius: 14, border: '1.5px solid', background: '#fff', cursor: 'pointer', width: '100%', transition: 'all 150ms ease' },
  reasonLabel: { fontSize: 14, fontWeight: 700, marginBottom: 2 },
  reasonDesc: { fontSize: 12, color: 'var(--text-assistive)' },
  radio: { width: 20, height: 20, borderRadius: 999, border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'border-color 150ms ease' },
  radioDot: { width: 10, height: 10, borderRadius: 999, background: 'var(--primary)' },

  textarea: { width: '100%', borderRadius: 14, padding: '14px', fontSize: 14, color: 'var(--text-normal)', outline: 'none', background: '#fff', boxSizing: 'border-box', resize: 'none', lineHeight: 1.6, transition: 'border 150ms ease, box-shadow 150ms ease', marginTop: 4 },
  charCount: { fontSize: 11.5, color: 'var(--text-assistive)', textAlign: 'right', marginTop: 6 },

  confirmCard: { borderRadius: 16, border: '1px solid var(--wds-line)', overflow: 'hidden', marginTop: 8 },
  confirmRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--wds-line)', gap: 12 },
  confirmKey: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', flexShrink: 0 },
  confirmVal: { fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' },
  warningBox: { marginTop: 14, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,66,66,.06)', fontSize: 12.5, color: 'var(--negative)', fontWeight: 500, lineHeight: 1.5 },

  footer: { padding: '12px 20px 36px', borderTop: '1px solid var(--wds-line)', flexShrink: 0 },
  primaryBtn: { width: '100%', height: 50, borderRadius: 13, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'opacity 150ms ease' },

  doneWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '0 28px', textAlign: 'center' },
  doneIconWrap: { width: 80, height: 80, borderRadius: 999, background: 'rgba(255,66,66,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneTitle: { fontSize: 22, fontWeight: 700, color: 'var(--text-normal)', letterSpacing: '-0.02em' },
  doneDesc: { fontSize: 14, color: 'var(--text-assistive)', lineHeight: 1.6 },
  doneBtn: { marginTop: 20, height: 50, borderRadius: 13, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', padding: '0 40px' },
}
