import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { apiFetch } from '../api'

interface NotiSettings {
  joinRequest: boolean
  meetupStart: boolean
  chatMessage: boolean
  review: boolean
  marketing: boolean
}

const DEFAULT: NotiSettings = {
  joinRequest: true,
  meetupStart: true,
  chatMessage: true,
  review: true,
  marketing: false,
}

const ITEMS: { key: keyof NotiSettings; label: string; desc: string }[] = [
  { key: 'joinRequest', label: '참가 요청', desc: '비공개 모임에 참가 요청이 오면 알려요' },
  { key: 'meetupStart', label: '모임 시작 알림', desc: '참여한 모임이 시작되면 알려요' },
  { key: 'chatMessage', label: '새 채팅 메시지', desc: '읽지 않은 메시지가 있을 때 알려요' },
  { key: 'review', label: '평가 요청', desc: '모임 종료 후 평가를 요청할 때 알려요' },
  { key: 'marketing', label: '이벤트·혜택', desc: '프로모션 및 새 기능 소식을 받아요' },
]

export default function NotificationSettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<NotiSettings>(DEFAULT)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch('/api/members/me/notification-settings')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSettings(d) })
      .catch(() => {})
  }, [])

  const toggle = async (key: keyof NotiSettings) => {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    setSaving(true)
    await apiFetch('/api/members/me/notification-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => {})
    setSaving(false)
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>알림 설정</span>
          {saving && <span style={s.savingText}>저장 중...</span>}
        </header>

        <div style={s.scroll}>
          <div style={s.section}>
            <div style={s.sectionTitle}>알림 항목</div>
            <div style={s.card}>
              {ITEMS.map((item, i) => (
                <div key={item.key} style={{ ...s.row, borderBottom: i < ITEMS.length - 1 ? '1px solid var(--wds-line)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={s.rowLabel}>{item.label}</div>
                    <div style={s.rowDesc}>{item.desc}</div>
                  </div>
                  <button
                    style={{ ...s.toggle, background: settings[item.key] ? 'var(--primary)' : '#D8DAE0' }}
                    onClick={() => toggle(item.key)}
                    role="switch"
                    aria-checked={settings[item.key]}
                  >
                    <div style={{ ...s.toggleThumb, transform: settings[item.key] ? 'translateX(20px)' : 'translateX(2px)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={s.note}>
            기기 설정에서 ToGather 알림이 켜져 있어야 알림을 받을 수 있어요.
          </div>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: 'var(--wds-fill)' },
  shell: { minHeight: '100dvh', maxWidth: 430, margin: '0 auto', background: 'var(--wds-fill)', display: 'flex', flexDirection: 'column' },

  header: { height: 54, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#fff', borderBottom: '1px solid var(--wds-line)', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 },
  backBtn: { border: 'none', background: 'transparent', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },
  savingText: { fontSize: 12, color: 'var(--text-assistive)' },

  scroll: { flex: 1, overflowY: 'auto', padding: '20px 16px 40px' },
  section: {},
  sectionTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.02em' },
  card: { borderRadius: 16, background: '#fff', overflow: 'hidden', border: '1px solid var(--wds-line)' },
  row: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' },
  rowLabel: { fontSize: 14, fontWeight: 600, color: 'var(--text-normal)', marginBottom: 2 },
  rowDesc: { fontSize: 12, color: 'var(--text-assistive)', lineHeight: 1.4 },
  toggle: { width: 44, height: 26, borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer', position: 'relative', transition: 'background 200ms ease', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: 3, width: 20, height: 20, borderRadius: 999, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'transform 200ms ease' },

  note: { marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--wds-fill-alt)', fontSize: 12.5, color: 'var(--text-assistive)', lineHeight: 1.5 },
}
