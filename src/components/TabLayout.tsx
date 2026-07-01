import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, User } from 'lucide-react'

const TABS = [
  { label: '홈', icon: Home, path: '/home' },
  { label: '모임', icon: Users, path: '/meetups' },
  { label: '마이', icon: User, path: '/my' },
]

export default function TabLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>{children}</div>

      <nav style={s.tabBar}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = pathname === tab.path
          return (
            <button
              key={tab.path}
              style={{ ...s.tabBtn, color: active ? 'var(--primary)' : '#AEB1BA' }}
              onClick={() => navigate(tab.path)}
            >
              <Icon size={26} strokeWidth={active ? 2.35 : 2.05} />
              <span style={{ ...s.tabLabel, fontWeight: active ? 700 : 600 }}>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    background: '#fff',
    borderTop: '1px solid var(--wds-line)',
    minHeight: 76,
    paddingTop: 8,
    paddingBottom: 'max(12px, calc(8px + env(safe-area-inset-bottom)))',
    boxShadow: '0 -6px 18px rgba(15,20,30,.05)',
    flexShrink: 0,
  },
  tabBtn: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
    padding: '2px 0 0',
    minHeight: 56,
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: '16px',
    letterSpacing: 0,
  },
}
