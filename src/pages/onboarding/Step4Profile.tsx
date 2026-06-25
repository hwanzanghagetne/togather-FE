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

export default function Step4Profile({ onNext, onBack, state, setState }: Props) {
  const { photo, name, country, language } = state.profile
  const [nameFocused, setNameFocused] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const update = (key: keyof OnboardingState['profile'], value: string | null) =>
    setState((current) => ({ ...current, profile: { ...current.profile, [key]: value } }))

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const objectUrl = URL.createObjectURL(file)
    update('photo', objectUrl)
  }

  return (
    <div style={screen}>
      <ProgressHeader step={3} total={5} onBack={onBack} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 22px 0' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--text-normal)', letterSpacing: '-0.02em' }}>
          프로필을 만들어요
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-assistive)', fontWeight: 400 }}>
          모임에서 다른 사람에게 보일 정보예요
        </div>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 96, height: 96 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                border: 'none',
                background: 'var(--wds-fill-alt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {photo ? (
                <img src={photo} alt="프로필 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={40} color="var(--text-placeholder)" />
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 32,
                height: 32,
                borderRadius: 999,
                background: 'var(--primary)',
                border: '3px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <Camera size={16} color="#fff" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              이름 또는 닉네임
            </label>
            <input
              value={name}
              onChange={(event) => update('name', event.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              style={{
                width: '100%',
                padding: 13,
                borderRadius: 12,
                border: nameFocused ? '1.5px solid var(--primary)' : '1px solid var(--wds-line)',
                boxShadow: nameFocused ? '0 0 0 4px rgba(0,102,255,.08)' : 'none',
                fontSize: 15,
                fontWeight: 500,
                color: 'var(--text-normal)',
                outline: 'none',
                background: '#fff',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 9 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <select
                value={country}
                onChange={(event) => update('country', event.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 36px 13px 13px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--wds-fill-alt)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--text-normal)',
                  appearance: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="대한민국">대한민국</option>
                <option value="미국">미국</option>
                <option value="일본">일본</option>
                <option value="중국">중국</option>
                <option value="영국">영국</option>
                <option value="기타">기타</option>
              </select>
              <ChevronDown size={16} color="var(--text-assistive)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
              <select
                value={language}
                onChange={(event) => update('language', event.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 36px 13px 13px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'var(--wds-fill-alt)',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--text-normal)',
                  appearance: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="한국어, EN">한국어, EN</option>
                <option value="한국어">한국어</option>
                <option value="English">English</option>
                <option value="日本語">日本語</option>
                <option value="中文">中文</option>
              </select>
              <ChevronDown size={16} color="var(--text-assistive)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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
