import type { Dispatch, SetStateAction } from 'react'

export interface OnboardingState {
  profile: { photo: string | null; name: string; country: string; language: string }
  interests: string[]
  locationGranted: boolean
}

export interface StepProps {
  onNext: () => void
  onBack?: () => void
  state: OnboardingState
  setState: Dispatch<SetStateAction<OnboardingState>>
}
