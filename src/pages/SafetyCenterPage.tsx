import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, ChevronLeft, ChevronRight, Flag, MapPin, Shield, X } from 'lucide-react'
import { apiFetch } from '../api'

interface BlockedUser {
  id: number
  nickname: string
  profileImageUrl?: string
}

export default function SafetyCenterPage() {
  const navigate = useNavigate()
  const [blocked, setBlocked] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/api/members/me/blocked')
      .then((r) => r.ok ? r.json() : [])
      .then((d: BlockedUser[]) => setBlocked(d))
      .catch(() => setBlocked([]))
      .finally(() => setLoading(false))
  }, [])

  const handleUnblock = async (id: number) => {
    await apiFetch(`/api/members/${id}/block`, { method: 'DELETE' }).catch(() => {})
    setBlocked((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <header style={s.header}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>안전센터</span>
        </header>

        <div style={s.scroll}>
          {/* 안전 기능 카드들 */}
          <div style={s.section}>
            <div style={s.sectionTitle}>안전 기능</div>
            <div style={s.safetyCards}>
              <SafetyCard
                icon={<BadgeCheck size={22} color="#00973A" />}
                iconBg="rgba(0,151,58,.1)"
                title="소셜계정 가입"
                desc="Google 또는 Kakao 계정으로 인증돼요"
                active
              />
              <SafetyCard
                icon={<MapPin size={22} color="var(--primary)" />}
                iconBg="var(--primary-tint)"
                title="위치 비공개"
                desc="정확한 위치는 모임 참여 후에만 공유돼요"
                active
              />
              <SafetyCard
                icon={<Shield size={22} color="#FF9200" />}
                iconBg="rgba(255,146,0,.1)"
                title="추가 본인 인증"
                desc="곧 제공될 예정이에요"
                active={false}
                comingSoon
              />
            </div>
          </div>

          {/* 신고·차단 */}
          <div style={s.section}>
            <div style={s.sectionTitle}>신고·차단</div>
            <div style={s.menuCard}>
              <button style={s.menuRow} onClick={() => navigate('/report')}>
                <div style={s.menuIcon}>
                  <Flag size={17} color="var(--negative)" />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={s.menuLabel}>신고하기</div>
                  <div style={s.menuSub}>부적절한 사용자나 모임을 신고해요</div>
                </div>
                <ChevronRight size={16} color="var(--text-placeholder)" />
              </button>
            </div>
          </div>

          {/* 차단 목록 */}
          <div style={s.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={s.sectionTitle}>차단한 사용자</div>
              {blocked.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-assistive)' }}>{blocked.length}명</span>
              )}
            </div>

            {loading ? (
              <div style={s.loadingRow}>
                <div style={s.spinner} />
              </div>
            ) : blocked.length === 0 ? (
              <div style={s.emptyBlock}>
                차단한 사용자가 없어요
              </div>
            ) : (
              <div style={s.blockedList}>
                {blocked.map((u) => (
                  <div key={u.id} style={s.blockedRow}>
                    <div style={s.blockedAvatar}>
                      {u.profileImageUrl ? (
                        <img src={u.profileImageUrl} alt={u.nickname} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 999 }} />
                      ) : (
                        <span style={s.blockedInitial}>{u.nickname.charAt(0)}</span>
                      )}
                    </div>
                    <span style={s.blockedName}>{u.nickname}</span>
                    <button style={s.unblockBtn} onClick={() => handleUnblock(u.id)}>
                      <X size={14} />
                      차단 해제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 고객센터 */}
          <div style={s.section}>
            <div style={s.helpCard}>
              <div style={s.helpTitle}>도움이 필요하세요?</div>
              <div style={s.helpDesc}>안전 관련 문제는 고객센터로 연락해요</div>
              <button style={s.helpBtn}>고객센터 문의</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SafetyCard({ icon, iconBg, title, desc, active, comingSoon }: {
  icon: React.ReactNode
  iconBg: string
  title: string
  desc: string
  active: boolean
  comingSoon?: boolean
}) {
  return (
    <div style={{ ...sc.card, opacity: comingSoon ? 0.7 : 1 }}>
      <div style={{ ...sc.iconWrap, background: iconBg }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={sc.title}>{title}</div>
        <div style={sc.desc}>{desc}</div>
      </div>
      {comingSoon ? (
        <span style={sc.soonBadge}>준비중</span>
      ) : active ? (
        <div style={sc.checkDot}>
          <BadgeCheck size={18} color="#00973A" fill="rgba(0,151,58,.1)" />
        </div>
      ) : null}
    </div>
  )
}

const sc: Record<string, React.CSSProperties> = {
  card: { display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', background: '#fff', borderRadius: 16, border: '1px solid var(--wds-line)' },
  iconWrap: { width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { fontSize: 14, fontWeight: 700, color: 'var(--text-normal)' },
  desc: { marginTop: 2, fontSize: 12, color: 'var(--text-assistive)', lineHeight: 1.45 },
  checkDot: { flexShrink: 0 },
  soonBadge: { fontSize: 11, fontWeight: 700, color: 'var(--text-assistive)', background: 'var(--wds-fill)', borderRadius: 6, padding: '3px 8px', flexShrink: 0 },
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: 'var(--wds-fill)' },
  shell: { minHeight: '100dvh', maxWidth: 430, margin: '0 auto', background: 'var(--wds-fill)', display: 'flex', flexDirection: 'column' },

  header: { height: 54, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', background: '#fff', borderBottom: '1px solid var(--wds-line)', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 },
  backBtn: { border: 'none', background: 'transparent', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  headerTitle: { fontSize: 17, fontWeight: 700, color: 'var(--text-normal)' },

  scroll: { flex: 1, overflowY: 'auto', padding: '20px 16px 40px', display: 'flex', flexDirection: 'column', gap: 24 },
  section: {},
  sectionTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, letterSpacing: '0.02em' },

  safetyCards: { display: 'flex', flexDirection: 'column', gap: 8 },

  menuCard: { borderRadius: 16, background: '#fff', overflow: 'hidden', border: '1px solid var(--wds-line)' },
  menuRow: { width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', border: 'none', background: 'transparent', cursor: 'pointer' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, background: 'rgba(255,66,66,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuLabel: { fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' },
  menuSub: { marginTop: 2, fontSize: 12, color: 'var(--text-assistive)' },

  loadingRow: { display: 'flex', justifyContent: 'center', padding: '24px 0' },
  spinner: { width: 24, height: 24, borderRadius: 999, border: '2.5px solid var(--primary-tint)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' },
  emptyBlock: { padding: '20px 0', textAlign: 'center', fontSize: 14, color: 'var(--text-assistive)', background: '#fff', borderRadius: 16, border: '1px solid var(--wds-line)' },

  blockedList: { display: 'flex', flexDirection: 'column', gap: 1, background: '#fff', borderRadius: 16, border: '1px solid var(--wds-line)', overflow: 'hidden' },
  blockedRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--wds-line)' },
  blockedAvatar: { width: 40, height: 40, borderRadius: 999, background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  blockedInitial: { fontSize: 16, fontWeight: 700, color: 'var(--primary)' },
  blockedName: { flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' },
  unblockBtn: { display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, borderRadius: 8, border: '1px solid var(--wds-line)', background: 'var(--wds-fill)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 10px' },

  helpCard: { padding: '20px', borderRadius: 16, background: '#fff', border: '1px solid var(--wds-line)', textAlign: 'center' },
  helpTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)', marginBottom: 4 },
  helpDesc: { fontSize: 13, color: 'var(--text-assistive)', marginBottom: 16 },
  helpBtn: { height: 40, borderRadius: 10, border: '1.5px solid var(--wds-line)', background: '#fff', color: 'var(--text-secondary)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: '0 20px' },
}
