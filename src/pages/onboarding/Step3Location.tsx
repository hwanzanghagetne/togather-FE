import { Compass, Lock, MapPin, Users } from 'lucide-react'
import { CtaButton, ctaBar, screen } from './common'

interface Props {
  onNext: () => void
  onGranted: (value: boolean) => void
}

export default function Step3Location({ onNext, onGranted }: Props) {
  const handleAllow = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          onGranted(true)
          onNext()
        },
        () => {
          onGranted(false)
          onNext()
        },
      )
      return
    }

    onGranted(false)
    onNext()
  }

  const items = [
    {
      icon: <Compass size={22} color="var(--primary)" />,
      bg: 'rgba(22,169,196,.1)',
      title: '근처 모임 발견',
      desc: '지금 주변에서 열리는 즉석 모임을 보여줘요',
    },
    {
      icon: <Users size={22} color="var(--primary)" />,
      bg: 'rgba(22,169,196,.1)',
      title: '근처 사람과 연결',
      desc: '같은 동네 여행자·이웃이 나를 발견할 수 있어요',
    },
    {
      icon: <Lock size={22} color="var(--positive-dark)" />,
      bg: 'rgba(0,191,64,.1)',
      title: '정확한 위치는 비공개',
      desc: '다른 사람에겐 근처 지역만 흐리게 보여요',
    },
  ]

  return (
    <div style={{ ...screen, padding: '0 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 46 }}>
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 999,
            background: 'rgba(22,169,196,.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={42} color="var(--primary)" fill="rgba(22,169,196,.16)" />
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
          근처 모임을 보려면
          <br />
          위치가 필요해요
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((item) => (
          <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                flexShrink: 0,
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' }}>{item.title}</div>
              <div style={{ marginTop: 2, fontSize: 12, lineHeight: 1.45, color: 'var(--text-assistive)', fontWeight: 400 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={ctaBar}>
        <CtaButton onClick={handleAllow}>위치 허용하기</CtaButton>
      </div>
    </div>
  )
}
