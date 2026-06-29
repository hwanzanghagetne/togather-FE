import { useEffect } from 'react'
import { LogoTile, gradientBg, screen } from './common'

interface Props {
  onNext: () => void
}

export default function Step1Splash({ onNext }: Props) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(onNext, 1800)
    return () => window.clearTimeout(t)
  }, [onNext])

  return (
    <div
      style={{ ...screen, ...gradientBg, alignItems: 'center', justifyContent: 'center', padding: '0 30px', cursor: 'pointer', gap: 0 }}
      onClick={onNext}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNext() }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <LogoTile size={84} radius={24} markSize={50} />

        <div style={{
          marginTop: 20,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: '-0.03em',
          color: 'var(--text-normal)',
          lineHeight: 1.08,
        }}>
          ToGather
        </div>

        <div style={{
          marginTop: 12,
          fontSize: 15,
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          fontWeight: 400,
        }}>
          지금, 이 근처에서
          <br />
          함께할 사람을 찾는 곳
        </div>
      </div>

      {/* 하단 로딩 인디케이터 */}
      <div style={{ position: 'absolute', bottom: 48, display: 'flex', gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: i === 0 ? 20 : 6,
              height: 6,
              borderRadius: 999,
              background: i === 0 ? 'var(--primary)' : 'var(--wds-line)',
              transition: 'width 300ms ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
