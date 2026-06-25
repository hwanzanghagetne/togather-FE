import { BadgeCheck, CheckCircle2, Flag, Lock } from 'lucide-react'
import { CtaButton, ctaBar, screen } from './common'

interface Props {
  onNext: () => void
}

const CARDS = [
  {
    icon: <CheckCircle2 size={22} color="var(--primary)" />,
    title: '소셜 계정으로 가입 완료',
    desc: '실제 계정 기반이라 더 안전해요',
  },
  {
    icon: <Lock size={22} color="var(--positive-dark)" />,
    title: '정확한 위치는 늘 비공개',
    desc: '지도엔 근처 지역만 흐리게 표시돼요',
  },
  {
    icon: <Flag size={22} color="var(--cautionary)" />,
    title: '신고·차단은 언제든',
    desc: '불편하면 바로 알려주세요',
  },
]

export default function Step6Safety({ onNext }: Props) {
  return (
    <div style={{ ...screen, padding: '0 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 46 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 999,
            background: 'rgba(0,191,64,.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <BadgeCheck size={42} color="var(--positive-dark)" fill="rgba(0,191,64,.15)" />
        </div>

        <div
          style={{
            marginTop: 24,
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1.34,
            textAlign: 'center',
            color: 'var(--text-normal)',
            letterSpacing: '-0.02em',
          }}
        >
          안심하고 만나도록
          <br />
          지켜드려요
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {CARDS.map((card) => (
          <div
            key={card.title}
            style={{
              padding: 13,
              borderRadius: 13,
              background: 'var(--wds-fill-alt)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                flexShrink: 0,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-normal)' }}>{card.title}</div>
              <div style={{ marginTop: 2, fontSize: 11.5, color: 'var(--text-assistive)', lineHeight: 1.45 }}>{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-assistive)', marginTop: 14 }}>
        추가 본인 인증은 곧 제공될 예정이에요
      </p>

      <div style={ctaBar}>
        <CtaButton onClick={onNext}>확인했어요</CtaButton>
      </div>
    </div>
  )
}
