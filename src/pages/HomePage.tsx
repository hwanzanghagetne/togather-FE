import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, OverlayView, Autocomplete } from '@react-google-maps/api'
import { AlignJustify, Bell, ChevronRight, Plus, Search, Zap } from 'lucide-react'

const LIBRARIES: ('places')[] = ['places']

interface Meetup {
  id: number
  title: string
  latitude: number
  longitude: number
  category: string
  currentCount: number
  maxParticipants: number
  status: string
  address?: string
}

type CategoryFilter = 'ALL' | 'FOOD' | 'CAFE' | 'ACTIVITY' | 'SIGHTSEEING'

const CATEGORY_COLOR: Record<string, string> = {
  FOOD: '#FF6B35',
  CAFE: '#8B5CF6',
  ACTIVITY: '#0066FF',
  SIGHTSEEING: '#00973A',
  OTHER: '#9A9DA6',
}

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: '🍽',
  CAFE: '☕',
  ACTIVITY: '⚡',
  SIGHTSEEING: '📍',
  OTHER: '●',
}

const CHIPS: Array<{ key: CategoryFilter; label: string; emoji?: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'FOOD', label: '식사', emoji: '🍽' },
  { key: 'CAFE', label: '카페·술', emoji: '☕' },
  { key: 'ACTIVITY', label: '액티비티', emoji: '⚡' },
]

const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]

function PinMarker({
  color,
  emoji,
  count,
  selected,
  onClick,
}: {
  color: string
  emoji: string
  count: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: 'translate(-50%, -100%)',
        cursor: 'pointer',
        position: 'relative',
      }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
    >
      <div
        style={{
          width: selected ? 50 : 44,
          height: selected ? 50 : 44,
          borderRadius: 999,
          background: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: selected ? `0 6px 20px ${color}60` : '0 4px 12px rgba(0,0,0,0.2)',
          transition: 'all 150ms ease',
          position: 'relative',
        }}
      >
        <span style={{ fontSize: selected ? 18 : 16 }}>{emoji}</span>
        {count > 1 && (
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: 999,
              background: '#fff',
              color: '#1a1a1a',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(0,0,0,0.1)',
              padding: '0 3px',
            }}
          >
            {count}
          </div>
        )}
      </div>
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '7px solid transparent',
          borderRight: '7px solid transparent',
          borderTop: `9px solid ${color}`,
          marginTop: -1,
        }}
      />
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [selected, setSelected] = useState<Meetup | null>(null)
  const [center, setCenter] = useState({ lat: 35.15, lng: 129.12 })
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL')
  const [showList, setShowList] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  })

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }, [])

  useEffect(() => {
    fetch(`/api/meetups/nearby?lat=${center.lat}&lng=${center.lng}&radius=10`, {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Meetup[]) => setMeetups(data))
      .catch(() => {})
  }, [center])

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) return
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    setCenter({ lat, lng })
    mapRef.current?.panTo({ lat, lng })
    mapRef.current?.setZoom(15)
  }, [])

  const filtered = activeCategory === 'ALL'
    ? meetups
    : meetups.filter((m) => m.category === activeCategory)

  return (
    <div style={s.page}>
      {/* 검색 바 */}
      <div style={s.searchBar}>
        <Search size={16} color="#9A9DA6" style={{ flexShrink: 0 }} />
        {isLoaded ? (
          <Autocomplete
            onLoad={(ac) => { autocompleteRef.current = ac }}
            onPlaceChanged={onPlaceChanged}
            options={{ fields: ['geometry', 'name'] }}
          >
            <input
              style={s.searchInput}
              placeholder="장소·모임 검색"
            />
          </Autocomplete>
        ) : (
          <span style={s.searchPlaceholder}>장소·모임 검색</span>
        )}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Bell size={18} color="#1a1a1a" strokeWidth={1.8} />
          <div style={s.notifDot} />
        </div>
      </div>

      {/* 카테고리 칩 */}
      <div style={s.chips}>
        {CHIPS.map((chip) => {
          const active = activeCategory === chip.key
          return (
            <button
              key={chip.key}
              style={{
                ...s.chip,
                background: active ? 'var(--primary)' : '#fff',
                color: active ? '#fff' : '#1a1a1a',
                fontWeight: active ? 700 : 500,
              }}
              onClick={() => setActiveCategory(chip.key)}
            >
              {chip.emoji && <span style={{ fontSize: 13 }}>{chip.emoji}</span>}
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* 모임 수 배너 */}
      {filtered.length > 0 && (
        <div style={s.countBanner}>
          <Zap size={13} color="#FF6B35" fill="#FF6B35" />
          지금 {filtered.length}개 모임 진행 중
        </div>
      )}

      {/* 지도 */}
      <div style={s.mapWrap}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={15}
            onLoad={onMapLoad}
            onClick={() => { setSelected(null); setShowList(false) }}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: true,
              zoomControl: false,
              gestureHandling: 'greedy',
            }}
          >
            <OverlayView position={center} mapPaneName="overlayMouseTarget">
              <div style={s.myDot} />
            </OverlayView>

            {filtered.map((m) => (
              <OverlayView
                key={m.id}
                position={{ lat: m.latitude, lng: m.longitude }}
                mapPaneName="overlayMouseTarget"
              >
                <PinMarker
                  color={CATEGORY_COLOR[m.category] ?? '#9A9DA6'}
                  emoji={CATEGORY_EMOJI[m.category] ?? '●'}
                  count={m.currentCount}
                  selected={selected?.id === m.id}
                  onClick={() => { setSelected(m); setShowList(false) }}
                />
              </OverlayView>
            ))}
          </GoogleMap>
        ) : (
          <div style={s.mapLoading}>지도 불러오는 중...</div>
        )}
      </div>

      {/* 선택된 모임 팝업 */}
      {selected && (
        <div style={s.popupCard} onClick={() => navigate(`/chat/${selected.id}`)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: (CATEGORY_COLOR[selected.category] ?? '#9A9DA6') + '22',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {CATEGORY_EMOJI[selected.category] ?? '●'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={s.popupBadge}>지금 바로</span>
                <span style={{ fontSize: 11.5, color: '#9A9DA6' }}>
                  {selected.currentCount}/{selected.maxParticipants}명
                </span>
              </div>
              <div style={s.popupTitle}>{selected.title}</div>
              {selected.address && (
                <div style={s.popupMeta}>{selected.address}</div>
              )}
            </div>
            <ChevronRight size={18} color="#9A9DA6" />
          </div>
        </div>
      )}

      {/* 리스트 버튼 */}
      {!showList && !selected && (
        <button style={s.listBtn} onClick={() => setShowList(true)}>
          <AlignJustify size={15} />
          리스트
        </button>
      )}

      {/* FAB */}
      <button style={s.fab} onClick={() => navigate('/meetups/new')}>
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </button>

      {/* 리스트 바텀시트 */}
      {showList && (
        <>
          <div style={s.sheetBackdrop} onClick={() => setShowList(false)} />
          <div style={s.sheet}>
            <div style={s.sheetHandle} />
            <div style={s.sheetHeader}>
              <span style={s.sheetTitle}>이 지역 모임 {filtered.length}개</span>
              <button style={s.filterBtn}>필터</button>
            </div>
            <div style={s.sheetList}>
              {filtered.length === 0 && (
                <div style={s.sheetEmpty}>근처 모임이 없어요</div>
              )}
              {filtered.map((m) => (
                <div
                  key={m.id}
                  style={s.sheetCard}
                  onClick={() => navigate(`/chat/${m.id}`)}
                >
                  <div
                    style={{
                      ...s.sheetCardThumb,
                      background: (CATEGORY_COLOR[m.category] ?? '#9A9DA6') + '22',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{CATEGORY_EMOJI[m.category] ?? '●'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: 'var(--primary)',
                          background: 'rgba(0,102,255,0.1)',
                          borderRadius: 4,
                          padding: '1px 5px',
                        }}
                      >
                        지금 바로
                      </span>
                    </div>
                    <div style={s.sheetCardTitle}>{m.title}</div>
                    {m.address && (
                      <div style={s.sheetCardMeta}>{m.address}</div>
                    )}
                  </div>
                  <span style={s.sheetCardCount}>{m.currentCount}명</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#EFF2F6',
  },
  searchBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    height: 44,
    borderRadius: 12,
    background: '#fff',
    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 14px',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: '#B0B3BC',
  },
  searchInput: {
    flex: 1,
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 14,
    color: '#1a1a1a',
    background: 'transparent',
  },
  notifDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 7,
    height: 7,
    borderRadius: 999,
    background: '#FF3B30',
    border: '1px solid #fff',
  },
  chips: {
    position: 'absolute',
    top: 72,
    left: 16,
    zIndex: 10,
    display: 'flex',
    gap: 8,
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 13px',
    borderRadius: 999,
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 1px 6px rgba(0,0,0,0.10)',
    whiteSpace: 'nowrap',
  },
  countBanner: {
    position: 'absolute',
    top: 124,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 999,
    background: 'rgba(20,20,20,0.82)',
    color: '#fff',
    fontSize: 12.5,
    fontWeight: 600,
    backdropFilter: 'blur(6px)',
    whiteSpace: 'nowrap',
  },
  mapWrap: {
    position: 'absolute',
    inset: 0,
  },
  mapLoading: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9A9DA6',
    fontSize: 14,
  },
  myDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    background: '#0066FF',
    border: '3px solid #fff',
    boxShadow: '0 0 0 4px rgba(0,102,255,0.25)',
    transform: 'translate(-50%, -50%)',
  },
  popupCard: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    zIndex: 10,
    background: '#fff',
    borderRadius: 16,
    padding: '14px 16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
    cursor: 'pointer',
  },
  popupBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    background: '#FF6B35',
    borderRadius: 4,
    padding: '2px 6px',
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  popupMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#9A9DA6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listBtn: {
    position: 'absolute',
    bottom: 90,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 22px',
    borderRadius: 999,
    background: '#fff',
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a1a',
    boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  fab: {
    position: 'absolute',
    bottom: 84,
    right: 16,
    zIndex: 10,
    width: 56,
    height: 56,
    borderRadius: 999,
    background: 'var(--primary)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0,102,255,0.4)',
    cursor: 'pointer',
  },
  sheetBackdrop: {
    position: 'absolute',
    inset: 0,
    zIndex: 20,
    background: 'rgba(0,0,0,0.15)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    maxHeight: '60%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    background: '#E0E2E8',
    margin: '12px auto 0',
    flexShrink: 0,
  },
  sheetHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 20px 10px',
    flexShrink: 0,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1a1a1a',
  },
  filterBtn: {
    border: '1px solid #E0E2E8',
    background: '#fff',
    borderRadius: 8,
    padding: '5px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: '#3A3D46',
    cursor: 'pointer',
  },
  sheetList: {
    overflowY: 'auto',
    padding: '0 16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sheetEmpty: {
    textAlign: 'center',
    padding: '32px 0',
    fontSize: 14,
    color: '#9A9DA6',
  },
  sheetCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 14,
    background: '#F7F8FA',
    cursor: 'pointer',
  },
  sheetCardThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sheetCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a1a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sheetCardMeta: {
    fontSize: 11.5,
    color: '#9A9DA6',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sheetCardRight: {
    flexShrink: 0,
  },
  sheetCardCount: {
    fontSize: 12,
    fontWeight: 600,
    color: '#9A9DA6',
  },
}
