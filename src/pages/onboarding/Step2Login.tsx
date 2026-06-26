import { useState, type ReactNode } from 'react'
import { Globe } from 'lucide-react'
import { BrandLockup, screen } from './common'

interface Props {
  onNext: () => void
}

function KakaoIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#191600" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.477 2 11c0 2.89 1.578 5.435 4 7.04V21l3.196-1.77C10.396 19.72 11.182 20 12 20c5.523 0 10-3.477 10-8s-4.477-9-10-9z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  )
}

function SocialButton({
  icon,
  label,
  background,
  color,
  border = 'none',
  pressedBackground,
  onClick,
}: {
  icon: ReactNode
  label: string
  background: string
  color: string
  border?: string
  pressedBackground?: string
  onClick: () => void
}) {
  const [pressed, setPressed] = useState(false)

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        height: 50,
        borderRadius: 13,
        border,
        background: pressed ? pressedBackground ?? background : background,
        color,
        fontSize: 15,
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: 'pointer',
        width: '100%',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 150ms cubic-bezier(0.4,0,0.2,1), background 150ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export default function Step2Login({ onNext: _onNext }: Props) {
  return (
    <div style={{ ...screen, padding: '0 22px 36px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 40 }}>
        <BrandLockup />

        <div
          style={{
            marginTop: 30,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 23,
            lineHeight: 1.32,
            textAlign: 'center',
            color: 'var(--text-normal)',
            letterSpacing: '-0.02em',
          }}
        >
          함께할 사람을 찾는
          <br />
          가장 따뜻한 방법
        </div>

        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'var(--wds-fill-alt)',
            borderRadius: 999,
            padding: '9px 15px',
          }}
        >
          <Globe size={16} color="var(--positive)" fill="var(--positive)" />
          <span style={{ fontSize: 12.5, color: 'var(--text-neutral)', fontWeight: 500 }}>
            <strong style={{ color: 'var(--text-normal)', fontWeight: 700 }}>1,240명</strong>이 지금 근처에서 활동 중
          </span>
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SocialButton
          icon={<KakaoIcon />}
          label="카카오로 계속하기"
          background="#FEE500"
          color="#191600"
          pressedBackground="#F4DB00"
          onClick={() => { window.location.href = `${API_BASE}/oauth2/authorization/kakao` }}
        />

        <SocialButton
          icon={<GoogleIcon />}
          label="Google로 계속하기"
          background="#FFFFFF"
          color="var(--text-normal)"
          border="1px solid var(--wds-line-strong)"
          pressedBackground="#F8F9FB"
          onClick={() => { window.location.href = `${API_BASE}/oauth2/authorization/google` }}
        />

        <p
          style={{
            textAlign: 'center',
            fontSize: 10.5,
            color: 'var(--text-assistive)',
            margin: '6px 0 0',
            lineHeight: 1.5,
          }}
        >
          계속하면 <span style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>이용약관</span> 및{' '}
          <span style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>개인정보처리방침</span>에 동의하게 돼요
        </p>
      </div>
    </div>
  )
}
