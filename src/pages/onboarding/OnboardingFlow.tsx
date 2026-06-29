import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../api'
import { ONBOARDING_STORAGE_KEY } from './common'
import type { OnboardingState } from './types'
import Step1Splash from './Step1Splash'
import Step2Login from './Step2Login'
import Step3Location from './Step3Location'
import Step4Profile from './Step4Profile'
import Step5Interests from './Step5Interests'
import Step6Safety from './Step6Safety'
import Step7Done from './Step7Done'

const INITIAL_STATE: OnboardingState = {
  profile: {
    photo: null,
    name: '민준',
    country: '대한민국',
    language: '한국어, EN',
  },
  interests: ['food', 'activity', 'tour'],
  locationGranted: false,
}

export default function OnboardingFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false

    apiFetch('/api/members/me')
      .then((res) => {
        if (cancelled || !res.ok) return
        // 이미 로그인됨
        if (localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true') {
          navigate('/home', { replace: true })
        } else {
          // 로그인은 됐지만 온보딩 미완료 → 위치 권한 단계부터
          setStep(3)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [navigate])

  const next = () => setStep((current) => Math.min(7, current + 1))
  const back = () => setStep((current) => Math.max(1, current - 1))
  const finish = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    navigate('/home')
  }

  switch (step) {
    case 1:
      return <Step1Splash onNext={next} />
    case 2:
      return <Step2Login onNext={next} />
    case 3:
      return (
        <Step3Location
          onNext={next}
          onGranted={(value) => setState((current) => ({ ...current, locationGranted: value }))}
        />
      )
    case 4:
      return <Step4Profile onNext={next} onBack={back} state={state} setState={setState} />
    case 5:
      return <Step5Interests onNext={next} onBack={back} state={state} setState={setState} />
    case 6:
      return <Step6Safety onNext={next} />
    case 7:
      return <Step7Done onFinish={finish} state={state} />
    default:
      return null
  }
}
