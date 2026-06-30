import type { Dispatch, SetStateAction } from 'react'
import { CtaButton, ProgressHeader, ctaBar, screen } from './common'
import type { OnboardingState } from './types'

interface InterestItem {
  key: string
  label: string
}

interface Props {
  onNext: () => void
  onBack: () => void
  state: OnboardingState
  setState: Dispatch<SetStateAction<OnboardingState>>
}

const INTERESTS: InterestItem[] = [
  { key: 'food', label: '맛집·식사' },
  { key: 'cafe', label: '카페·디저트' },
  { key: 'activity', label: '액티비티' },
  { key: 'tour', label: '관광·투어' },
  { key: 'nightlife', label: '술·나이트라이프' },
  { key: 'study', label: '스터디·언어교환' },
  { key: 'sports', label: '운동·러닝' },
  { key: 'art', label: '전시·공연' },
  { key: 'games', label: '보드게임·취미' },
  { key: 'photo', label: '사진·산책' },
]

export default function Step5Interests({ onNext, onBack, state, setState }: Props) {
  const selected = state.interests

  const toggle = (key: string) => {
    setState((current) => ({
      ...current,
      interests: current.interests.includes(key)
        ? current.interests.filter((item) => item !== key)
        : [...current.interests, key],
    }))
  }

  return (
    <div style={screen}>
      <ProgressHeader step={4} total={5} onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 22px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-normal)', letterSpacing: '-0.02em' }}>
          무엇에 관심 있나요?
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-assistive)', fontWeight: 400 }}>
          관심사에 맞는 모임을 먼저 보여드려요
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 9 }}>
          {INTERESTS.map((item) => {
            const isSelected = selected.includes(item.key)
            return (
              <button
                key={item.key}
                onClick={() => toggle(item.key)}
                style={{
                  padding: '9px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: isSelected ? 'var(--primary)' : 'var(--wds-fill)',
                  color: isSelected ? '#fff' : '#5A5D66',
                  fontSize: 13.5,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background 150ms cubic-bezier(0.4,0,0.2,1), color 150ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </div>


      </div>

      <div style={ctaBar}>
        <CtaButton onClick={onNext}>
          다음 <span style={{ fontWeight: 500, fontSize: 13, opacity: 0.8 }}>· {selected.length}개 선택됨</span>
        </CtaButton>
      </div>
    </div>
  )
}
