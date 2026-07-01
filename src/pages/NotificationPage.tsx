import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, UserPlus, Zap } from 'lucide-react'
import { apiFetch } from '../api'

interface Notification {
  id: number
  type: 'JOIN_REQUESTED' | 'APPROVED' | 'REJECTED'
  actorNickname: string
  meetupId?: number
  isRead: boolean
  createdAt: string
}

function notiMessage(n: Notification): string {
  if (n.type === 'JOIN_REQUESTED') return `${n.actorNickname}님이 참여를 요청했어요`
  if (n.type === 'APPROVED') return '참여 요청이 승인됐어요! 채팅방에 입장할 수 있어요'
  if (n.type === 'REJECTED') return '참여 요청이 거절됐어요'
  return ''
}

const NOTI_ICON: Record<string, React.ReactNode> = {
  JOIN_REQUESTED: <UserPlus size={18} color="#6541F2" />,
  APPROVED:       <span style={{ fontSize: 18 }}>✅</span>,
  REJECTED:       <span style={{ fontSize: 18 }}>❌</span>,
}

const NOTI_BG: Record<string, string> = {
  JOIN_REQUESTED: 'rgba(101,65,242,.1)',
  APPROVED:       'rgba(0,191,64,.1)',
  REJECTED:       'rgba(255,66,66,.08)',
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '방금'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}시간 전`
  return `${Math.floor(diffH / 24)}일 전`
}

function groupByDate(items: Notification[]) {
  const today = new Date().toDateString()
  const groups: { label: string; items: Notification[] }[] = []
  const todayItems = items.filter((n) => new Date(n.createdAt).toDateString() === today)
  const olderItems = items.filter((n) => new Date(n.createdAt).toDateString() !== today)
  if (todayItems.length) groups.push({ label: '오늘', items: todayItems })
  if (olderItems.length) groups.push({ label: '이전', items: olderItems })
  return groups
}

export default function NotificationPage() {
  const navigate = useNavigate()
  const [notis, setNotis] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotis = useCallback(() => {
    apiFetch('/api/members/me/notifications')
      .then((r) => r.ok ? r.json() : [])
      .then((d: Notification[]) => setNotis(d))
      .catch(() => setNotis([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchNotis() }, [fetchNotis])

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) fetchNotis() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [fetchNotis])

  const markRead = async (id: number) => {
    await apiFetch(`/api/members/me/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {})
    setNotis((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n))
  }

  const unreadCount = notis.filter((n) => !n.isRead).length
  const groups = groupByDate(notis)

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>알림</span>
          {unreadCount > 0 && (
            <span style={s.unreadBadge}>{unreadCount}</span>
          )}
        </header>

        {loading ? (
          <div style={s.loadingWrap}>
            <div style={s.spinner} />
          </div>
        ) : notis.length === 0 ? (
          <div style={s.emptyWrap}>
            <div style={s.emptyIcon}>🔔</div>
            <div style={s.emptyTitle}>새 알림이 없어요</div>
            <div style={s.emptyDesc}>근처 모임에 참여하면 알림을 받아요</div>
          </div>
        ) : (
          <div style={s.scroll}>
            {groups.map((g) => (
              <div key={g.label}>
                <div style={s.groupLabel}>{g.label}</div>
                {g.items.map((n) => (
                  <button
                    key={n.id}
                    style={{ ...s.notiRow, background: n.isRead ? '#fff' : 'rgba(22,169,196,.04)' }}
                    onClick={() => {
                      markRead(n.id)
                      if (!n.meetupId) return
                      if (n.type === 'JOIN_REQUESTED') navigate(`/meetups/${n.meetupId}/join-requests`)
                      else if (n.type === 'APPROVED') navigate(`/chat/${n.meetupId}`)
                      // REJECTED: 이동 없음
                    }}
                  >
                    <div style={{ ...s.iconWrap, background: NOTI_BG[n.type] ?? 'var(--wds-fill)' }}>
                      {NOTI_ICON[n.type] ?? <Zap size={18} />}
                    </div>
                    <div style={s.notiBody}>
                      <div style={s.notiMsg}>{notiMessage(n)}</div>
                      <div style={s.notiTime}>{formatTime(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <div style={s.unreadDot} />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: '#fff' },
  shell: { minHeight: '100dvh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column' },

  header: { height: 54, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: '1px solid var(--wds-line)', position: 'sticky', top: 0, background: '#fff', zIndex: 10, flexShrink: 0 },
  backBtn: { border: 'none', background: 'transparent', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 999, background: 'var(--negative)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' },

  loadingWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: 32, height: 32, borderRadius: 999, border: '3px solid var(--primary-tint)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' },

  emptyWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, paddingBottom: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-normal)', marginBottom: 6 },
  emptyDesc: { fontSize: 13.5, color: 'var(--text-assistive)', textAlign: 'center' },

  scroll: { flex: 1, overflowY: 'auto' },
  groupLabel: { padding: '14px 20px 6px', fontSize: 12, fontWeight: 700, color: 'var(--text-assistive)', letterSpacing: '0.02em' },

  notiRow: { width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '14px 20px', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--wds-line)', transition: 'background 150ms ease' },
  iconWrap: { width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notiBody: { flex: 1, minWidth: 0 },
  notiMsg: { fontSize: 14, fontWeight: 500, color: 'var(--text-normal)', lineHeight: 1.45 },
  notiTime: { marginTop: 3, fontSize: 11.5, color: 'var(--text-assistive)' },
  unreadDot: { width: 8, height: 8, borderRadius: 999, background: 'var(--primary)', flexShrink: 0 },
}

