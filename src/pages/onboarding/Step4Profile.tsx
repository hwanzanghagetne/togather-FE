import { useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import { Camera, ChevronDown, User } from 'lucide-react'
import { CtaButton, ProgressHeader, ctaBar, screen } from './common'
import type { OnboardingState } from './types'

interface Props {
  onNext: () => void
  onBack: () => void
  state: OnboardingState
  setState: Dispatch<SetStateAction<OnboardingState>>
}

const COUNTRY_OPTIONS = [
  { value: '대한민국', language: '한국어, EN' },
  { value: '미국',     language: 'English' },
  { value: '일본',     language: '日本語' },
  { value: '중국',     language: '中文' },
  { value: '영국',     language: 'English' },
  { value: '프랑스',   language: 'Français' },
  { value: '기타',     language: 'English' },
]

function countryToLanguage(country: string): string {
  return COUNTRY_OPTIONS.find((o) => o.value === country)?.language ?? 'English'
}

export default function Step4Profile({ onNext, onBack, state, setState }: Props) {
  const { photo, name, country } = state.profile
  const [nameFocused, setNameFocused] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const update = (key: keyof OnboardingState['profile'], value: string | null) =>
    setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }))

  const handleCountryChange = (value: string) => {
    update('country', value)
    update('language', countryToLanguage(value))
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    update('photo', URL.createObjectURL(file))
  }

  const detectedLanguage = countryToLanguage(country)

  return (
    <div style={screen}>
      <ProgressHeader step={3} total={5} onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 22px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-normal)', letterSpacing: '-0.02em' }}>
          프로필을 만들어요
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-assistive)' }}>
          모임에서 다른 사람에게 보일 정보예요
        </div>

        {/* 아바타 */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ width: 96, height: 96, borderRadius: 999, border: 'none', background: 'var(--wds-fill-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', padding: 0 }}
            >
              {photo ? (
                <img src={photo} alt="프로필 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="var(--text-placeholder)" />
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 999, background: 'var(--primary)', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
            >
              <Camera size={16} color="#fff" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 이름 */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              이름 또는 닉네임
            </label>
            <input
              value={name}
              onChange={(e) => update('name', e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              style={{
                width: '100%', padding: 13, borderRadius: 12,
                border: nameFocused ? '1.5px solid var(--primary)' : '1px solid var(--wds-line)',
                boxShadow: nameFocused ? '0 0 0 4px rgba(22,169,196,.08)' : 'none',
                fontSize: 15, fontWeight: 500, color: 'var(--text-normal)', outline: 'none', background: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 국적 */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              국적
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                style={{ width: '100%', padding: '13px 36px 13px 13px', borderRadius: 12, border: 'none', background: 'var(--wds-fill-alt)', fontSize: 15, fontWeight: 500, color: 'var(--text-normal)', appearance: 'none', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }}
              >
                {COUNTRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.value}</option>
                ))}
              </select>
              <ChevronDown size={16} color="var(--text-assistive)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            {/* 언어 자동 안내 — 스펙 A-4 */}
            <div style={{ marginTop: 9, background: 'var(--primary-tint)', borderRadius: 10, padding: '10px 13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, color: '#0C7A91', fontWeight: 500 }}>
                언어: <strong style={{ fontWeight: 700 }}>{detectedLanguage}</strong>로 자동 설정돼요
              </span>
              <button style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0', flexShrink: 0 }}>
                변경
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={ctaBar}>
        <CtaButton onClick={onNext} disabled={!name.trim()}>
          다음
        </CtaButton>
      </div>
    </div>
  )
}
