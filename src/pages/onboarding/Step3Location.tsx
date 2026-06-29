import { Compass, Lock, MapPin, Users } from 'lucide-react'
import { CtaButton, ctaBar, screen } from './common'

interface Props {
  onNext: () => void
  onGranted: (value: boolean) => void
}

const BENEFITS = [
  {
    icon: <Compass size={20} color="var(--primary)" />,
    bg: 'rgba(22,169,196,.1)',
    title: '근처 모임 발견',
    desc: '지금 주변에서 열리는 즉석 모임을 보여줘요',
  },
  {
    icon: <Users size={20} color="var(--primary)" />,
    bg: 'rgba(22,169,196,.1)',
    title: '근처 사람과 연결',
    desc: '같은 동네 여행자·이웃이 나를 발견할 수 있어요',
  },
  {
    icon: <Lock size={20} color="var(--positive-dark)" />,
    bg: 'rgba(0,191,64,.1)',
    title: '정확한 위치는 비공개',
    desc: '다른 사람에겐 근처 지역만 흐리게 보여요',
  },
]

export default function Step3Location({ onNext, onGranted }: Props) {
  const handleAllow = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => { onGranted(true); onNext() },
        () => { onGranted(false); onNext() },
      )
      return
    }
    onGranted(false)
    onNext()
  }

  return (
    <div style={{ ...screen, padding: '0 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 52 }}>
        <div style={{
          width: 88, height: 88, borderRadius: 999,
          background: 'rgba(22,169,196,.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MapPin size={42} color="var(--primary)" fill="rgba(22,169,196,.18)" />
        </div>

        <div style={{
          marginTop: 22,
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 23,
          lineHeight: 1.34,
          textAlign: 'center',
          color: 'var(--text-normal)',
          letterSpacing: '-0.02em',
        }}>
          근처 모임을 보려면
          <br />
          위치가 필요해요
        </div>

        <p style={{ marginTop: 10, fontSize: 13.5, color: 'var(--text-assistive)', textAlign: 'center', lineHeight: 1.5 }}>
          정확한 위치는 저장되지 않아요
        </p>
      </div>

      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {BENEFITS.map((item) => (
          <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              flexShrink: 0, background: item.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.icon}
            </div>
            <div style={{ paddingTop: 2 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' }}>{item.title}</div>
              <div style={{ marginTop: 3, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-assistive)' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={ctaBar}>
        <CtaButton onClick={handleAllow}>위치 허용하기</CtaButton>
        <button
          onClick={() => { onGranted(false); onNext() }}
          style={{ marginTop: 10, width: '100%', border: 'none', background: 'transparent', fontSize: 13.5, color: 'var(--text-assistive)', cursor: 'pointer', padding: '8px 0' }}
        >
          나중에 설정할게요
        </button>
      </div>
    </div>
  )
}
