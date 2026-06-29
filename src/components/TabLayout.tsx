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
              <Icon size={23} strokeWidth={active ? 2.4 : 1.8} />
              <span style={{ ...s.tabLabel, fontWeight: active ? 600 : 500 }}>{tab.label}</span>
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
    height: 60,
    paddingBottom: 'max(4px, env(safe-area-inset-bottom))',
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
    gap: 3,
    cursor: 'pointer',
    padding: 0,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: '0.01em',
  },
}
