import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

const LIBRARIES: ('places')[] = ['places']
import {
  ChevronLeft,
  Clock3,
  Coffee,
  Dumbbell,
  Lock,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  UtensilsCrossed,
  User,
  Users,
} from 'lucide-react'
import { markJoinedMeetup } from '../meetupSession'
import { apiFetch } from '../api'

type CategoryKey = 'FOOD' | 'CAFE' | 'ACTIVITY' | 'SIGHTSEEING'
type TimeMode = 'FLEXIBLE' | 'EXACT'
type VisibilityMode = 'PUBLIC' | 'PRIVATE'

interface CategoryOption {
  key: CategoryKey
  label: string
  accent: string
  tint: string
  icon: typeof UtensilsCrossed
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { key: 'FOOD', label: '식사', accent: '#FF6B35', tint: 'rgba(255,107,53,0.12)', icon: UtensilsCrossed },
  { key: 'CAFE', label: '카페·술', accent: '#8B5CF6', tint: 'rgba(139,92,246,0.12)', icon: Coffee },
  { key: 'ACTIVITY', label: '액티비티', accent: '#00973A', tint: 'rgba(0,151,58,0.12)', icon: Dumbbell },
  { key: 'SIGHTSEEING', label: '관광·투어', accent: '#00A3A3', tint: 'rgba(0,163,163,0.12)', icon: MapPin },
]

const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function prettifyAddress(address: string) {
  if (!address) return '근처 위치를 사용해요'
  return address.replace(/^대한민국\s*/, '')
}

export default function CreateMeetupPage() {
  const navigate = useNavigate()
  const mapRef = useRef<google.maps.Map | null>(null)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 35.1796, lng: 129.0756 })
  const [pickedLocation, setPickedLocation] = useState({ lat: 35.1796, lng: 129.0756 })
  const [address, setAddress] = useState('')
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryKey>('FOOD')
  const [meetingDate, setMeetingDate] = useState(() => toDateInputValue(new Date()))
  const [timeMode, setTimeMode] = useState<TimeMode>('FLEXIBLE')
  const [meetingTime, setMeetingTime] = useState('19:00')
  const [visibility, setVisibility] = useState<VisibilityMode>('PUBLIC')
  const [ageMax, setAgeMax] = useState(80)

  const mapApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: mapApiKey, libraries: LIBRARIES })

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude }
        setMapCenter(next)
        setPickedLocation(next)
      },
      () => {},
      { enableHighAccuracy: true },
    )
  }, [])

  useEffect(() => {
    if (!isLoaded || typeof google === 'undefined') return

    const timer = window.setTimeout(() => {
      const geocoder = new google.maps.Geocoder()
      setLoadingAddress(true)
      geocoder.geocode({ location: mapCenter }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          setAddress(results[0].formatted_address)
        }
        setLoadingAddress(false)
      })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [isLoaded, mapCenter])

  const calendarOptions = useMemo(() => {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const start = new Date()

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)

      return {
        value: toDateInputValue(date),
        topLabel: index === 0 ? '오늘' : weekdays[date.getDay()],
        dayNumber: `${date.getDate()}`,
      }
    })
  }, [])

  const canContinue =
    step === 0 ||
    (step === 1 && title.trim().length > 0) ||
    (step === 2 && meetingDate.length > 0 && (timeMode === 'FLEXIBLE' || meetingTime.length > 0)) ||
    step === 3

  const handleBack = () => {
    if (step === 0) {
      navigate(-1)
      return
    }

    setStep((prev) => prev - 1)
  }

  const handleContinue = () => {
    if (!canContinue || step >= 3) return
    if (step === 0) {
      setPickedLocation(mapCenter)
    }
    setStep((prev) => prev + 1)
  }

  const moveToCurrentLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const next = { lat: position.coords.latitude, lng: position.coords.longitude }
        setMapCenter(next)
        setPickedLocation(next)
        mapRef.current?.panTo(next)
        mapRef.current?.setZoom(16)
      },
      () => {},
      { enableHighAccuracy: true },
    )
  }

  const handleSubmit = async () => {
    if (submitting) return

    setSubmitting(true)
    try {
      const descriptionBits = [
        `meetingDate=${meetingDate}`,
        `timeMode=${timeMode}`,
        timeMode === 'EXACT' ? `meetingTime=${meetingTime}` : 'meetingTime=flexible',
        `ageRange=20-${ageMax}`,
        `visibility=${visibility}`,
      ]

      const response = await apiFetch('/api/meetups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: descriptionBits.join(' | '),
          latitude: pickedLocation.lat,
          longitude: pickedLocation.lng,
          address: address || '선택한 위치',
          category,
          maxParticipants: 99,
          expiresAt: `${meetingDate}T23:59:59`,
        }),
      })

      if (!response.ok) {
        alert('모임 생성에 실패했어요.')
        return
      }

      const data = await response.json()
      markJoinedMeetup(data.id)
      navigate(`/meetups/${data.id}/posted`, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const locationTitle = prettifyAddress(address)

  const renderMapCanvas = () => (
    <div style={s.mapCanvas}>
      {mapApiKey && isLoaded && !loadError ? (
        <>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={15}
            onLoad={(map) => {
              mapRef.current = map
              window.setTimeout(() => {
                google.maps.event.trigger(map, 'resize')
                map.panTo(mapCenter)
              }, 80)
            }}
            onIdle={() => {
              const nextCenter = mapRef.current?.getCenter()
              if (!nextCenter) return
              setMapCenter({ lat: nextCenter.lat(), lng: nextCenter.lng() })
            }}
            onTilesLoaded={() => setMapTilesLoaded(true)}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: true,
              zoomControl: false,
              gestureHandling: 'greedy',
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          />
          {!mapTilesLoaded && <div style={s.mapLoadingOverlay}>지도를 불러오는 중이에요...</div>}
        </>
      ) : (
        <div style={s.mapFallback}>
          <div style={s.mapFallbackTitle}>지도를 표시하려면 Google Maps 설정이 필요해요</div>
          <div style={s.mapFallbackDesc}>환경변수의 API 키와 도메인 허용 설정을 확인해 주세요</div>
        </div>
      )}
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.shell}>
        {step === 0 ? (
          <div style={s.mapStagePage}>
            {renderMapCanvas()}

            <div style={s.topOverlay}>
              <button style={s.floatingBackButton} onClick={handleBack}>
                <ChevronLeft size={22} />
              </button>
              <button style={s.searchButton}>
                <Search size={17} color="#9A9DA6" />
                <span>장소 검색</span>
              </button>
            </div>

            <div style={s.centerPinWrap}>
              <div style={s.pinBubble}>여기서 만나요</div>
              <div style={s.centerPin}>
                <div style={s.centerPinInner} />
              </div>
              <div style={s.centerPinStem} />
              <div style={s.centerPinBase} />
            </div>

            <button style={s.currentLocationButton} onClick={moveToCurrentLocation}>
              <Navigation size={20} color="var(--primary)" fill="rgba(22,169,196,0.14)" />
            </button>

            <div style={s.bottomSheet}>
              <div style={s.bottomSheetHandle} />
              <div style={s.bottomSheetInfo}>
                <div style={s.bottomSheetIconWrap}>
                  <MapPin size={15} color="var(--primary)" fill="var(--primary)" />
                </div>
                <div>
                  <div style={s.bottomSheetTitle}>{loadingAddress ? '위치를 찾는 중이에요...' : locationTitle}</div>
                  <div style={s.bottomSheetDesc}>지도를 움직여 위치를 맞춰요</div>
                </div>
              </div>
              <button style={s.primaryButton} onClick={handleContinue}>
                이 위치로 정하기
              </button>
            </div>
          </div>
        ) : (
          <div style={s.sheetStagePage}>
            {renderMapCanvas()}
            <div style={s.sheetBackdrop} />

            <div style={{ ...s.formSheet, ...(step === 1 ? s.formSheetCompact : {}) }}>
              <div style={s.bottomSheetHandle} />
              <div style={s.sheetHeaderRow}>
                <button style={s.sheetBackButton} onClick={handleBack}>
                  <ChevronLeft size={20} />
                  <span>뒤로</span>
                </button>
                <span style={s.sheetStepText}>{step}/4</span>
              </div>

              {step === 1 && (
                <div style={s.sheetContent}>
                  <div>
                    <div style={s.sheetTitle}>어떤 모임인가요?</div>
                    <div style={s.sheetDesc}>지도에 보일 이름이에요. 자세한 건 채팅에서 정해요.</div>
                  </div>

                  <section>
                    <div style={s.sectionLabel}>모임 이름</div>
                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="오늘 저녁 곱창 같이 먹어요"
                      style={s.input}
                    />
                  </section>

                  <section>
                    <div style={s.sectionLabel}>카테고리</div>
                    <div style={s.categoryChipWrap}>
                      {CATEGORY_OPTIONS.map((option) => {
                        const Icon = option.icon
                        const active = category === option.key
                        return (
                          <button
                            key={option.key}
                            style={{
                              ...s.categoryChip,
                              ...(active
                                ? { background: 'var(--primary)', color: '#fff' }
                                : { background: '#F3F5F8', color: '#5A5D66' }),
                            }}
                            onClick={() => setCategory(option.key)}
                          >
                            <Icon size={14} color={active ? '#fff' : '#5A5D66'} />
                            <span>{option.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>
                </div>
              )}

              {step === 2 && (
                <div style={s.sheetContent}>
                  <div>
                    <div style={s.sheetTitle}>언제 만나요?</div>
                    <div style={s.sheetDesc}>날짜와 시간 방식을 먼저 고르면 다음 단계로 자연스럽게 이어져요.</div>
                  </div>

                  <section>
                    <div style={s.sectionLabel}>날짜</div>
                    <div style={s.calendarRow}>
                      {calendarOptions.map((option) => {
                        const active = meetingDate === option.value
                        return (
                          <button
                            key={option.value}
                            style={{ ...s.calendarCard, ...(active ? s.calendarCardActive : {}) }}
                            onClick={() => setMeetingDate(option.value)}
                          >
                            <span style={{ ...s.calendarTopLabel, color: active ? '#FFFFFFCC' : '#8A8E97' }}>{option.topLabel}</span>
                            <span style={{ ...s.calendarDayNumber, color: active ? '#fff' : '#16161A' }}>{option.dayNumber}</span>
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section>
                    <div style={s.sectionLabel}>시간</div>
                    <div style={s.modeGrid}>
                      <button
                        style={{ ...s.modeCard, ...(timeMode === 'FLEXIBLE' ? s.modeCardActive : {}) }}
                        onClick={() => setTimeMode('FLEXIBLE')}
                      >
                        <Sparkles size={22} color={timeMode === 'FLEXIBLE' ? 'var(--primary)' : '#9A9DA6'} />
                        <div style={s.modeTitle}>유연한 시간</div>
                        <div style={s.modeDesc}>하루 중 언제든</div>
                      </button>
                      <button
                        style={{ ...s.modeCard, ...(timeMode === 'EXACT' ? s.modeCardActive : {}) }}
                        onClick={() => setTimeMode('EXACT')}
                      >
                        <Clock3 size={22} color={timeMode === 'EXACT' ? 'var(--primary)' : '#9A9DA6'} />
                        <div style={s.modeTitle}>시간 지정</div>
                        <div style={s.modeDesc}>정확한 시간 선택</div>
                      </button>
                    </div>
                    {timeMode === 'EXACT' && (
                      <div style={s.timeFieldWrap}>
                        <Clock3 size={17} color="#6A6D76" />
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(event) => setMeetingTime(event.target.value)}
                          style={s.timeInput}
                        />
                      </div>
                    )}
                  </section>
                </div>
              )}

              {step === 3 && (
                <div style={s.sheetContent}>
                  <div>
                    <div style={s.sheetTitle}>누가 참여할 수 있나요?</div>
                    <div style={s.sheetDesc}>참여 연령대와 공개 여부를 먼저 정해둘게요.</div>
                  </div>

                  <section>
                    <div style={s.ageCard}>
                      <div style={s.ageHeader}>
                        <div style={s.ageHeaderLeft}>
                          <User size={15} color="#16161A" />
                          <span>나이 범위</span>
                        </div>
                      </div>
                      <div style={s.ageSliderWrap}>
                        <div style={s.ageTrack} />
                        <div style={{ ...s.ageRangeFill, width: `${((ageMax - 20) / 60) * 100}%` }} />
                        <div style={s.ageThumbLeft} />
                        <div style={{ ...s.ageThumbRight, left: `calc(${((ageMax - 20) / 60) * 100}% - 8px)` }} />
                        <input
                          type="range"
                          min={20}
                          max={80}
                          value={ageMax}
                          onChange={(event) => setAgeMax(Number(event.target.value))}
                          style={s.ageRangeInput}
                        />
                      </div>
                      <div style={s.ageLabels}>
                        <span>20</span>
                        <span>{ageMax >= 80 ? '80+' : ageMax}</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <div style={s.visibilityGrid}>
                      <button
                        style={{ ...s.visibilityCard, ...(visibility === 'PUBLIC' ? s.visibilityCardActive : {}) }}
                        onClick={() => setVisibility('PUBLIC')}
                      >
                        <Users size={24} color={visibility === 'PUBLIC' ? 'var(--primary)' : '#9A9DA6'} />
                        <div style={s.visibilityTitle}>공개</div>
                        <div style={s.visibilityDesc}>누구나 바로 참여</div>
                      </button>
                      <button
                        style={{ ...s.visibilityCard, ...(visibility === 'PRIVATE' ? s.visibilityCardActive : {}) }}
                        onClick={() => setVisibility('PRIVATE')}
                      >
                        <Lock size={24} color={visibility === 'PRIVATE' ? 'var(--primary)' : '#9A9DA6'} />
                        <div style={s.visibilityTitle}>비공개</div>
                        <div style={s.visibilityDesc}>승인 필요</div>
                      </button>
                    </div>
                  </section>
                </div>
              )}

              <div style={s.sheetFooter}>
                {step < 3 ? (
                  <button style={{ ...s.primaryButton, opacity: canContinue ? 1 : 0.5 }} onClick={handleContinue} disabled={!canContinue}>
                    다음
                  </button>
                ) : (
                  <button style={{ ...s.primaryButton, opacity: submitting ? 0.6 : 1 }} onClick={handleSubmit} disabled={submitting}>
                    <MapPin size={18} />
                    {submitting ? '지도에 올리는 중...' : '지도에 올리기'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: '#EEF2F7',
  },
  shell: {
    minHeight: '100dvh',
    maxWidth: 430,
    margin: '0 auto',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mapStagePage: {
    position: 'relative',
    flex: 1,
    minHeight: '100dvh',
    background: '#E5EAF1',
    overflow: 'hidden',
  },
  sheetStagePage: {
    position: 'relative',
    flex: 1,
    minHeight: '100dvh',
    background: '#E5EAF1',
    overflow: 'hidden',
  },
  mapCanvas: {
    position: 'absolute',
    inset: 0,
    background: '#E5EAF1',
  },
  sheetBackdrop: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.16) 100%)',
    pointerEvents: 'none',
  },
  topOverlay: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    zIndex: 3,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  floatingBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: 'none',
    background: '#fff',
    color: '#16161A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  searchButton: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    border: 'none',
    background: '#fff',
    color: '#9A9DA6',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 14px',
    boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'left',
    cursor: 'pointer',
  },
  centerPinWrap: {
    position: 'absolute',
    left: '50%',
    top: '42%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 3,
  },
  pinBubble: {
    marginBottom: 10,
    padding: '7px 12px',
    borderRadius: 999,
    background: '#16161A',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    boxShadow: '0 5px 14px rgba(0,0,0,0.18)',
    whiteSpace: 'nowrap',
  },
  centerPin: {
    width: 34,
    height: 34,
    borderRadius: 999,
    background: 'var(--primary)',
    border: '4px solid #fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 22px rgba(22,169,196,0.28)',
  },
  centerPinInner: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: '#fff',
  },
  centerPinStem: {
    width: 2,
    height: 24,
    background: 'rgba(22,169,196,0.55)',
    borderRadius: 999,
  },
  centerPinBase: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: '#D6D8DE',
    marginTop: -1,
    boxShadow: '0 2px 3px rgba(0,0,0,0.08)',
  },
  currentLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 188,
    width: 46,
    height: 46,
    borderRadius: 999,
    border: 'none',
    background: '#fff',
    boxShadow: '0 5px 16px rgba(0,0,0,0.16)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    cursor: 'pointer',
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    background: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: '10px 16px 28px',
    boxShadow: '0 -10px 28px rgba(15,20,30,0.12)',
  },
  formSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
    background: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: '10px 0 0',
    boxShadow: '0 -10px 28px rgba(15,20,30,0.14)',
    maxHeight: '80dvh',
    display: 'flex',
    flexDirection: 'column',
  },
  formSheetCompact: {
    maxHeight: '52dvh',
  },
  bottomSheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    background: '#B5B9C3',
    margin: '0 auto 14px',
  },
  bottomSheetInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  bottomSheetIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: 'rgba(22,169,196,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bottomSheetTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#16161A',
    lineHeight: 1.35,
  },
  bottomSheetDesc: {
    marginTop: 3,
    fontSize: 12.5,
    color: '#8A8E97',
  },
  sheetHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 18px',
    marginBottom: 10,
  },
  sheetBackButton: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 14,
    fontWeight: 600,
    color: '#16161A',
    cursor: 'pointer',
  },
  sheetStepText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#6F7480',
  },
  sheetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    padding: '0 18px',
    overflowY: 'auto',
  },
  sheetFooter: {
    padding: '18px 18px 28px',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#16161A',
    letterSpacing: '-0.02em',
  },
  sheetDesc: {
    marginTop: 8,
    fontSize: 13.5,
    lineHeight: 1.5,
    color: '#8A8E97',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(243,245,248,0.68)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    color: '#6A6D76',
    zIndex: 1,
  },
  mapFallback: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 28px',
    textAlign: 'center',
    color: '#6A6D76',
  },
  mapFallbackTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#16161A',
  },
  mapFallbackDesc: {
    marginTop: 8,
    fontSize: 12.5,
    lineHeight: 1.5,
  },
  sectionLabel: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: 700,
    color: '#16161A',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 13,
    border: '1.5px solid var(--primary)',
    boxShadow: '0 0 0 4px rgba(22,169,196,.08)',
    padding: '0 15px',
    fontSize: 15,
    color: '#16161A',
    outline: 'none',
    boxSizing: 'border-box',
  },
  categoryChipWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    height: 34,
    borderRadius: 999,
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  dateInput: {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  calendarRow: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto',
    paddingBottom: 4,
    paddingRight: 18,
    scrollbarWidth: 'none',
  },
  calendarCard: {
    width: 64,
    height: 82,
    flexShrink: 0,
    borderRadius: 18,
    border: 'none',
    background: '#F5F6F8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  calendarCardActive: {
    background: 'var(--primary)',
    boxShadow: '0 10px 20px rgba(22,169,196,0.16)',
  },
  calendarTopLabel: {
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1,
  },
  calendarDayNumber: {
    marginTop: 8,
    fontSize: 34,
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  modeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  modeCard: {
    borderRadius: 18,
    border: '1.5px solid var(--wds-line)',
    background: '#F7F8FA',
    padding: '18px 16px',
    textAlign: 'left',
    cursor: 'pointer',
    minHeight: 100,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  modeCardActive: {
    borderColor: 'var(--primary)',
    background: 'rgba(22,169,196,0.08)',
  },
  modeTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: 700,
    color: '#16161A',
    letterSpacing: '-0.02em',
  },
  modeDesc: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 1.45,
    color: '#8A8E97',
  },
  timeFieldWrap: {
    marginTop: 12,
    height: 52,
    borderRadius: 14,
    background: 'var(--wds-fill-alt)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 14px',
  },
  timeInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 14,
    fontWeight: 600,
    color: '#16161A',
  },
  ageCard: {
    borderRadius: 20,
    background: '#F7F8FA',
    padding: '18px 18px 16px',
  },
  ageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ageHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: '#16161A',
  },
  ageSliderWrap: {
    position: 'relative',
    marginTop: 18,
    height: 22,
  },
  ageTrack: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    height: 4,
    borderRadius: 999,
    background: '#D7DCE6',
  },
  ageRangeFill: {
    position: 'absolute',
    top: 8,
    left: 10,
    height: 4,
    borderRadius: 999,
    background: 'var(--primary)',
  },
  ageThumbLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderRadius: 999,
    background: '#fff',
    border: '3px solid var(--primary)',
  },
  ageThumbRight: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 999,
    background: '#fff',
    border: '3px solid var(--primary)',
  },
  ageRangeInput: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    opacity: 0,
    cursor: 'pointer',
  },
  ageLabels: {
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    fontWeight: 700,
    color: '#16161A',
  },
  visibilityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  visibilityCard: {
    borderRadius: 18,
    border: '1.5px solid transparent',
    background: '#F7F8FA',
    padding: '22px 14px',
    textAlign: 'center',
    cursor: 'pointer',
  },
  visibilityCardActive: {
    borderColor: 'var(--primary)',
    background: 'rgba(22,169,196,0.06)',
  },
  visibilityTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 700,
    color: '#16161A',
  },
  visibilityDesc: {
    marginTop: 4,
    fontSize: 12,
    color: '#8A8E97',
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 13,
    border: 'none',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
  },
}



