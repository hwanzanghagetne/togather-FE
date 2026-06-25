import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, OverlayView } from '@react-google-maps/api'
import { Plus, Search, Zap } from 'lucide-react'

interface Meetup {
  id: number
  title: string
  latitude: number
  longitude: number
  category: string
  currentCount: number
  maxParticipants: number
  status: string
}

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

const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [selected, setSelected] = useState<Meetup | null>(null)
  const [center, setCenter] = useState({ lat: 35.15, lng: 129.12 })
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  })

  // 내 위치
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }, [])

  // 근처 모임 조회
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

  return (
    <div style={s.page}>
      {/* 검색 바 */}
      <div style={s.searchBar}>
        <Search size={16} color="#9A9DA6" />
        <span style={s.searchPlaceholder}>장소·모임 검색</span>
        <div style={s.notifDot} />
      </div>

      {/* 모임 수 배너 */}
      {meetups.length > 0 && (
        <div style={s.countBanner}>
          <Zap size={13} color="#FF6B35" fill="#FF6B35" />
          지금 {meetups.length}개 모임 진행 중
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
            onClick={() => setSelected(null)}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: true,
              zoomControl: false,
              gestureHandling: 'greedy',
            }}
          >
            {/* 내 위치 */}
            <OverlayView position={center} mapPaneName="overlayMouseTarget">
              <div style={s.myDot} />
            </OverlayView>

            {/* 모임 마커 */}
            {meetups.map((m) => (
              <OverlayView
                key={m.id}
                position={{ lat: m.latitude, lng: m.longitude }}
                mapPaneName="overlayMouseTarget"
              >
                <div
                  style={{
                    ...s.marker,
                    background: CATEGORY_COLOR[m.category] ?? '#9A9DA6',
                    transform: selected?.id === m.id ? 'scale(1.15)' : 'scale(1)',
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelected(m) }}
                >
                  <span style={{ fontSize: 16 }}>{CATEGORY_EMOJI[m.category] ?? '●'}</span>
                  {m.currentCount > 1 && (
                    <div style={s.markerBadge}>{m.currentCount}</div>
                  )}
                </div>
              </OverlayView>
            ))}
          </GoogleMap>
        ) : (
          <div style={s.mapLoading}>지도 불러오는 중...</div>
        )}
      </div>

      {/* 선택된 모임 카드 */}
      {selected && (
        <div style={s.popupCard} onClick={() => navigate(`/chat/${selected.id}`)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={s.popupTitle}>{selected.title}</div>
              <div style={s.popupMeta}>
                {selected.currentCount} / {selected.maxParticipants}명 참여 중
              </div>
            </div>
            <div style={{ ...s.popupCategoryDot, background: CATEGORY_COLOR[selected.category] ?? '#9A9DA6' }} />
          </div>
          <div style={s.popupAction}>채팅 참가하기 →</div>
        </div>
      )}

      {/* 번개 만들기 FAB */}
      <button style={s.fab} onClick={() => navigate('/meetups/new')}>
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </button>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative',
    width: '100%',
    height: '100dvh',
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
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: '#FF3B30',
  },
  countBanner: {
    position: 'absolute',
    top: 72,
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
  marker: {
    width: 44,
    height: 44,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    transition: 'transform 150ms ease',
    transform: 'translate(-50%, -50%)',
    position: 'relative',
  },
  markerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
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
  },
  popupCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 10,
    background: '#fff',
    borderRadius: 16,
    padding: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
    cursor: 'pointer',
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  popupMeta: {
    fontSize: 12.5,
    color: '#9A9DA6',
  },
  popupCategoryDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 4,
  },
  popupAction: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--primary)',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 10,
    width: 52,
    height: 52,
    borderRadius: 999,
    background: 'var(--primary)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 16px rgba(0,102,255,0.4)',
    cursor: 'pointer',
  },
}
