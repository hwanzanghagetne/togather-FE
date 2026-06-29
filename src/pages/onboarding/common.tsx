import React from 'react'
import { ChevronLeft } from 'lucide-react'
const logoMark = '/branding/togather-logo-mark.svg'
const logoMarkWhite = '/branding/togather-logo-mark-white.svg'

export const ONBOARDING_STORAGE_KEY = 'togather-onboarding-complete'

export function CtaButton({
  children,
  onClick,
  disabled,
  style,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  style?: React.CSSProperties
}) {
  const [pressed, setPressed] = React.useState(false)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%',
        height: 50,
        borderRadius: 13,
        border: 'none',
        background: pressed ? 'var(--primary-hover)' : 'var(--primary)',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        fontSize: 16,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        cursor: disabled ? 'default' : 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 150ms cubic-bezier(0.4,0,0.2,1), background 150ms cubic-bezier(0.4,0,0.2,1)',
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function ProgressHeader({
  step,
  total,
  onBack,
}: {
  step: number
  total: number
  onBack: () => void
}) {
  const pct = (step / total) * 100

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px 0' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--text-normal)',
          display: 'flex',
        }}
      >
        <ChevronLeft size={22} />
      </button>
      <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'var(--wds-fill)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--primary)',
            borderRadius: 999,
            transition: 'width 200ms ease',
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-assistive)', minWidth: 24, textAlign: 'right' }}>
        {step}/{total}
      </span>
    </div>
  )
}

export const screen: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 430,
  margin: '0 auto',
  background: '#fff',
}

export const gradientBg: React.CSSProperties = {
  background: 'linear-gradient(180deg, #EDF8FB, #FFFFFF)',
}

export const ctaBar: React.CSSProperties = {
  marginTop: 'auto',
  padding: '12px 22px 36px',
  borderTop: '1px solid var(--wds-line)',
}

export function LogoMark({
  size = 50,
  variant = 'white',
  alt = 'ToGather',
}: {
  size?: number
  variant?: 'white' | 'color'
  alt?: string
}) {
  const src = variant === 'white' ? logoMarkWhite : logoMark

  return <img src={src} alt={alt} style={{ width: size, height: size }} />
}

export function LogoTile({
  size = 84,
  radius = 24,
  markSize = 50,
}: {
  size?: number
  radius?: number
  markSize?: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: 'var(--primary)',
        boxShadow: '0 10px 26px rgba(22,169,196,.32)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <LogoMark size={markSize} variant="white" />
    </div>
  )
}

export function BrandLockup() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LogoMark size={21} variant="white" alt="" />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: '-0.02em',
          color: 'var(--text-normal)',
        }}
      >
        ToGather
      </span>
    </div>
  )
}

