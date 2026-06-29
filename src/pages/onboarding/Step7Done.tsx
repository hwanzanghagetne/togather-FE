import { useEffect, useState } from 'react'
import { Check, Zap } from 'lucide-react'
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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 80)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div style={{ ...screen, ...gradientBg, alignItems: 'center', padding: '0 28px' }}>
      {/* 체크 애니메이션 */}
      <div style={{ marginTop: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* 외부 링 */}
        <div style={{
          width: 100,
          height: 100,
          borderRadius: 999,
          background: 'rgba(22,169,196,.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: visible ? 'scale(1)' : 'scale(0.6)',
          opacity: visible ? 1 : 0,
          transition: 'transform 400ms cubic-bezier(0.16,1,0.3,1), opacity 300ms ease',
        }}>
          {/* 내부 원 */}
          <div style={{
            width: 70,
            height: 70,
            borderRadius: 999,
            background: 'var(--primary)',
            boxShadow: 'var(--shadow-float)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: visible ? 'scale(1)' : 'scale(0.5)',
            transition: 'transform 450ms cubic-bezier(0.16,1,0.3,1) 100ms',
          }}>
            <Check
              size={34}
              color="#fff"
              strokeWidth={3}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'scale(1)' : 'scale(0.3)',
                transition: 'opacity 200ms ease 300ms, transform 300ms cubic-bezier(0.16,1,0.3,1) 300ms',
              }}
            />
          </div>
        </div>
      </div>

      {/* 텍스트 */}
      <div style={{
        marginTop: 28,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 25,
        color: 'var(--text-normal)',
        letterSpacing: '-0.02em',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease 250ms, transform 400ms cubic-bezier(0.16,1,0.3,1) 250ms',
      }}>
        준비됐어요, {name}님!
      </div>

      <p style={{
        marginTop: 10,
        fontSize: 14.5,
        lineHeight: 1.6,
        color: 'var(--text-secondary)',
        textAlign: 'center',
        fontWeight: 400,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease 350ms, transform 400ms cubic-bezier(0.16,1,0.3,1) 350ms',
      }}>
        근처에 <strong style={{ color: 'var(--text-normal)' }}>11개</strong>의 모임이 기다리고 있어요.
        <br />
        지금 바로 둘러볼까요?
      </p>

      {/* 아바타 스택 */}
      <div style={{
        marginTop: 28,
        display: 'flex',
        alignItems: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease 450ms, transform 400ms cubic-bezier(0.16,1,0.3,1) 450ms',
      }}>
        {AVATARS.map((avatar, index) => (
          <div
            key={avatar.initial}
            style={{
              width: 52, height: 52, borderRadius: 999,
              background: avatar.bg,
              border: '3px solid #fff',
              marginLeft: index === 0 ? 0 : -14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: avatar.color,
              zIndex: index,
            }}
          >
            {avatar.initial}
          </div>
        ))}
        <div style={{
          width: 52, height: 52, borderRadius: 999,
          background: 'var(--wds-fill)',
          border: '3px solid #fff',
          marginLeft: -14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
          zIndex: 3,
        }}>
          +8
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 'auto', width: '100%', paddingBottom: 40 }}>
        <CtaButton onClick={onFinish}>
          <Zap size={18} fill="rgba(255,255,255,.3)" strokeWidth={2} />
          모임 둘러보기
        </CtaButton>
      </div>
    </div>
  )
}
