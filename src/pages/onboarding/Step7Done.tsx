import { useEffect, useState } from 'react'
import { Check, Zap } from 'lucide-react'
import { CtaButton, gradientBg, screen } from './common'
import { apiFetch } from '../../api'
import type { OnboardingState } from './types'

interface Props {
  onFinish: () => void
  state: OnboardingState
}

const AVATAR_PALETTE = [
  { bg: '#FFD9C7', color: '#E0531F' },
  { bg: '#D7E4FF', color: '#16A9C4' },
  { bg: '#D9F2DD', color: '#00973A' },
]

export default function Step7Done({ onFinish, state }: Props) {
  const name = state.profile.name || ''
  const [visible, setVisible] = useState(false)
  const [nearbyCount, setNearbyCount] = useState<number | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 80)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        apiFetch(`/api/meetups/nearby?lat=${lat}&lng=${lng}&radius=10`)
          .then((r) => r.ok ? r.json() : [])
          .then((data: unknown[]) => setNearbyCount(data.length))
          .catch(() => setNearbyCount(null))
      },
      () => {
        apiFetch('/api/meetups/nearby?lat=35.15&lng=129.12&radius=10')
          .then((r) => r.ok ? r.json() : [])
          .then((data: unknown[]) => setNearbyCount(data.length))
          .catch(() => setNearbyCount(null))
      }
    )
  }, [])

  return (
    <div style={{ ...screen, ...gradientBg, alignItems: 'center', padding: '0 28px' }}>
      {/* 체크 애니메이션 */}
      <div style={{ marginTop: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 999,
          background: 'rgba(22,169,196,.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: visible ? 'scale(1)' : 'scale(0.6)',
          opacity: visible ? 1 : 0,
          transition: 'transform 400ms cubic-bezier(0.16,1,0.3,1), opacity 300ms ease',
        }}>
          <div style={{
            width: 70, height: 70, borderRadius: 999,
            background: 'var(--primary)', boxShadow: 'var(--shadow-float)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: visible ? 'scale(1)' : 'scale(0.5)',
            transition: 'transform 450ms cubic-bezier(0.16,1,0.3,1) 100ms',
          }}>
            <Check size={34} color="#fff" strokeWidth={3} style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1)' : 'scale(0.3)',
              transition: 'opacity 200ms ease 300ms, transform 300ms cubic-bezier(0.16,1,0.3,1) 300ms',
            }} />
          </div>
        </div>
      </div>

      {/* 텍스트 */}
      <div style={{
        marginTop: 28, fontFamily: 'var(--font-display)', fontWeight: 700,
        fontSize: 25, color: 'var(--text-normal)', letterSpacing: '-0.02em', textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease 250ms, transform 400ms cubic-bezier(0.16,1,0.3,1) 250ms',
      }}>
        준비됐어요{name ? `, ${name}님` : '!'}
      </div>

      <p style={{
        marginTop: 10, fontSize: 14.5, lineHeight: 1.6,
        color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 400,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease 350ms, transform 400ms cubic-bezier(0.16,1,0.3,1) 350ms',
      }}>
        {nearbyCount !== null ? (
          <>근처에 <strong style={{ color: 'var(--text-normal)' }}>{nearbyCount}개</strong>의 모임이 기다리고 있어요.</>
        ) : (
          <>근처 모임을 지금 확인해보세요.</>
        )}
        <br />지금 바로 둘러볼까요?
      </p>

      {/* 아바타 스택 — 실제 참여자 느낌의 장식용 팔레트 */}
      <div style={{
        marginTop: 28, display: 'flex', alignItems: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease 450ms, transform 400ms cubic-bezier(0.16,1,0.3,1) 450ms',
      }}>
        {AVATAR_PALETTE.map((av, index) => (
          <div key={index} style={{
            width: 52, height: 52, borderRadius: 999,
            background: av.bg, border: '3px solid #fff',
            marginLeft: index === 0 ? 0 : -14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: av.color, zIndex: index,
          }}>
            {['S', '현', '유'][index]}
          </div>
        ))}
        {(nearbyCount ?? 0) > 3 && (
          <div style={{
            width: 52, height: 52, borderRadius: 999,
            background: 'var(--wds-fill)', border: '3px solid #fff',
            marginLeft: -14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', zIndex: 3,
          }}>
            +{Math.max(0, (nearbyCount ?? 11) - 3)}
          </div>
        )}
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
