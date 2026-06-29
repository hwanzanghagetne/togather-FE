import { Check, Compass } from 'lucide-react'
import { CtaButton, gradientBg, screen } from './common'
import type { OnboardingState } from './types'

interface Props {
  onFinish: () => void
  state: OnboardingState
}

const AVATARS = [
  { initial: 'S', bg: '#FFD9C7', color: '#E0531F' },
  { initial: '현', bg: '#D7E4FF', color: '#16A9C4' },
  { initial: '유', bg: '#D9F2DD', color: '#00973A' },
]

export default function Step7Done({ onFinish, state }: Props) {
  const name = state.profile.name || '민준'

  return (
    <div style={{ ...screen, ...gradientBg, alignItems: 'center', padding: '0 28px' }}>
      <div style={{ marginTop: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 999,
            background: 'rgba(22,169,196,.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 999,
              background: 'var(--primary)',
              boxShadow: '0 8px 20px rgba(22,169,196,.32)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={34} color="#fff" strokeWidth={3} />
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 26,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 25,
          color: 'var(--text-normal)',
          letterSpacing: '-0.02em',
          textAlign: 'center',
        }}
      >
        준비됐어요, {name}님!
      </div>

      <p
        style={{
          marginTop: 11,
          fontSize: 14.5,
          lineHeight: 1.55,
          color: 'var(--text-secondary)',
          textAlign: 'center',
          fontWeight: 400,
        }}
      >
        근처에 <strong style={{ color: 'var(--text-normal)' }}>11개</strong>의 모임이 기다리고 있어요.
        <br />
        지금 바로 둘러볼까요?
      </p>

      <div style={{ marginTop: 30, display: 'flex', alignItems: 'center' }}>
        {AVATARS.map((avatar, index) => (
          <div
            key={avatar.initial}
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              background: avatar.bg,
              border: '3px solid #fff',
              marginLeft: index === 0 ? 0 : -14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              color: avatar.color,
              zIndex: index,
            }}
          >
            {avatar.initial}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto', width: '100%', paddingBottom: 36 }}>
        <CtaButton onClick={onFinish} style={{ height: 52 }}>
          <Compass size={19} />
          모임 둘러보기
        </CtaButton>
      </div>
    </div>
  )
}
