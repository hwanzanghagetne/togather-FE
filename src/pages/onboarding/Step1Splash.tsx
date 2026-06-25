import { useEffect } from 'react'
import { LogoTile, gradientBg, screen } from './common'

interface Props {
  onNext: () => void
}

export default function Step1Splash({ onNext }: Props) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const timeout = window.setTimeout(onNext, 1500)
    return () => window.clearTimeout(timeout)
  }, [onNext])

  return (
    <div
      style={{
        ...screen,
        ...gradientBg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 30px',
        cursor: 'pointer',
      }}
      onClick={onNext}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          onNext()
        }
      }}
    >
      <LogoTile />

      <div
        style={{
          marginTop: 22,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: '-0.03em',
          color: 'var(--text-normal)',
        }}
      >
        ToGather
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 14.5,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          fontWeight: 400,
        }}
      >
        지금, 이 근처에서
        <br />
        함께할 사람을 찾는 곳
      </div>

      <div style={{ marginTop: 40, display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: index === 0 ? 'var(--primary)' : 'rgba(0,102,255,.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
