import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, OverlayView, Autocomplete } from '@react-google-maps/api'
import { Bell, Crosshair, List, Plus, Search, Zap } from 'lucide-react'
import { apiFetch } from '../api'

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

const CAT_COLOR: Record<string, string> = {
  FOOD: '#FF6B35',
  CAFE: '#6541F2',
  ACTIVITY: '#16A9C4',
  SIGHTSEEING: '#00973A',
  OTHER: '#9A9DA6',
}

const CAT_EMOJI: Record<string, string> = {
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
  color, emoji, count, selected, onClick,
}: {
  color: string; emoji: string; count: number; selected: boolean; onClick: () => void
}) {
  const size = selected ? 48 : 40
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', transform: 'translate(-50%,-100%)', cursor: 'pointer' }}
    >
      <div style={{
        width: size, height: size, borderRadius: 999,
        background: color,
        border: `3px solid #fff`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? `0 6px 18px ${color}70` : '0 4px 10px rgba(0,0,0,0.2)',
        transition: 'all 150ms ease',
        position: 'relative',
      }}>
        <span style={{ fontSize: selected ? 18 : 16 }}>{emoji}</span>
        {count > 1 && (
          <div style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 18, height: 18, borderRadius: 999,
            background: '#fff', color: '#16161A',
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid rgba(0,0,0,0.08)', padding: '0 3px',
          }}>{count}</div>
        )}
      </div>
      {/* 핀 꼬리 */}
      <div style={{
        width: 0, height: 0,
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `8px solid ${color}`,
        marginTop: -1,
      }} />
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
    apiFetch(`/api/meetups/nearby?lat=${center.lat}&lng=${center.lng}&radius=10`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Meetup[]) => setMeetups(data))
      .catch(() => {})
  }, [center])

  const onMapLoad = useCallback((map: google.maps.Map) => { mapRef.current = map }, [])

  const onPlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.geometry?.location) return
    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    setCenter({ lat, lng })
    mapRef.current?.panTo({ lat, lng })
    mapRef.current?.setZoom(15)
  }, [])

  const recenter = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setCenter(loc)
      mapRef.current?.panTo(loc)
    })
  }

  const filtered = activeCategory === 'ALL' ? meetups : meetups.filter((m) => m.category === activeCategory)

  return (
    <div style={s.page}>
      {/* 검색바 */}
      <div style={s.searchBar}>
        <Search size={15} color="var(--text-placeholder)" strokeWidth={2} style={{ flexShrink: 0 }} />
        {isLoaded ? (
          <Autocomplete
            onLoad={(ac) => { autocompleteRef.current = ac }}
            onPlaceChanged={onPlaceChanged}
            options={{ fields: ['geometry', 'name'] }}
          >
            <input style={s.searchInput} placeholder="장소·모임 검색" />
          </Autocomplete>
        ) : (
          <span style={s.searchPlaceholder}>장소·모임 검색</span>
        )}
        <button style={s.bellBtn} onClick={() => {}}>
          <Bell size={19} color="var(--text-normal)" strokeWidth={1.8} />
          <span style={s.bellDot} />
        </button>
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
                color: active ? '#fff' : 'var(--text-normal)',
                fontWeight: active ? 600 : 500,
                border: active ? 'none' : '1px solid var(--wds-line)',
              }}
              onClick={() => setActiveCategory(chip.key)}
            >
              {chip.emoji && <span style={{ fontSize: 12 }}>{chip.emoji}</span>}
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* 지도 */}
      <div style={s.mapWrap}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={15}
            onLoad={onMapLoad}
            onClick={() => { setSelected(null); setShowList(false) }}
            options={{ styles: MAP_STYLES, disableDefaultUI: true, gestureHandling: 'greedy' }}
          >
            {/* 내 위치 */}
            <OverlayView position={center} mapPaneName="overlayMouseTarget">
              <div style={s.myDot} />
            </OverlayView>

            {/* 모임 핀 */}
            {filtered.map((m) => (
              <OverlayView key={m.id} position={{ lat: m.latitude, lng: m.longitude }} mapPaneName="overlayMouseTarget">
                <PinMarker
                  color={CAT_COLOR[m.category] ?? '#9A9DA6'}
                  emoji={CAT_EMOJI[m.category] ?? '●'}
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

      {/* 진행 중 모임 수 배지 */}
      {filtered.length > 0 && !showList && !selected && (
        <div style={s.countBadge}>
          <Zap size={12} color="#FF6B35" fill="#FF6B35" />
          지금 {filtered.length}개 모임 진행 중
        </div>
      )}

      {/* 선택된 모임 팝업 카드 */}
      {selected && (
        <div style={s.popupCard} onClick={() => navigate(`/chat/${selected.id}`)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12,
              background: (CAT_COLOR[selected.category] ?? '#9A9DA6') + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {CAT_EMOJI[selected.category] ?? '●'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={s.nowBadge}>지금 바로</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-assistive)' }}>
                  {selected.currentCount}명 참여 중
                </span>
              </div>
              <div style={s.popupTitle}>{selected.title}</div>
              {selected.address && (
                <div style={s.popupMeta}>{selected.address}</div>
              )}
            </div>
          </div>
          <button
            style={s.joinBtn}
            onClick={(e) => { e.stopPropagation(); navigate(`/chat/${selected.id}`) }}
          >
            채팅 참여하기
          </button>
        </div>
      )}

      {/* 하단 컨트롤 */}
      <div style={s.bottomControls}>
        {/* 리스트 버튼 */}
        <button style={s.listBtn} onClick={() => { setShowList(true); setSelected(null) }}>
          <List size={15} strokeWidth={2} />
          리스트
        </button>

        {/* 위치 재조정 버튼 */}
        <button style={s.recenterBtn} onClick={recenter}>
          <Crosshair size={18} color="var(--text-secondary)" strokeWidth={2} />
        </button>

        {/* FAB */}
        <button style={s.fab} onClick={() => navigate('/meetups/new')}>
          <Plus size={22} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      {/* 리스트 바텀 시트 */}
      {showList && (
        <>
          <div style={s.backdrop} onClick={() => setShowList(false)} />
          <div style={s.sheet}>
            <div style={s.sheetHandle} />
            <div style={s.sheetHeader}>
              <span style={s.sheetTitle}>이 지역 모임 {filtered.length}개</span>
              <button style={s.filterBtn}>필터</button>
            </div>
            <div style={s.sheetList}>
              {filtered.length === 0 ? (
                <div style={s.emptyText}>근처 모임이 없어요</div>
              ) : (
                filtered.map((m) => (
                  <div key={m.id} style={s.sheetCard} onClick={() => navigate(`/chat/${m.id}`)}>
                    <div style={{
                      ...s.sheetThumb,
                      background: (CAT_COLOR[m.category] ?? '#9A9DA6') + '18',
                    }}>
                      <span style={{ fontSize: 22 }}>{CAT_EMOJI[m.category] ?? '●'}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <span style={s.nowBadge}>지금 바로</span>
                      </div>
                      <div style={s.sheetCardTitle}>{m.title}</div>
                      {m.address && <div style={s.sheetCardMeta}>{m.address}</div>}
                    </div>
                    <span style={s.sheetCardCount}>{m.currentCount}명</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#EFF2F6' },

  // 검색바
  searchBar: {
    position: 'absolute', top: 14, left: 16, right: 16, zIndex: 10,
    height: 46, borderRadius: 13, background: '#fff',
    boxShadow: '0 2px 12px rgba(0,0,0,.1)',
    display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
  },
  searchInput: { flex: 1, width: '100%', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-normal)', background: 'transparent' },
  searchPlaceholder: { flex: 1, fontSize: 14, color: 'var(--text-placeholder)' },
  bellBtn: { position: 'relative', flexShrink: 0, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  bellDot: { position: 'absolute', top: -1, right: -1, width: 7, height: 7, borderRadius: 999, background: 'var(--negative)', border: '1.5px solid #fff' },

  // 칩
  chips: { position: 'absolute', top: 72, left: 16, zIndex: 10, display: 'flex', gap: 7 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 13px', borderRadius: 999, fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.08)', whiteSpace: 'nowrap', transition: 'all 150ms ease' },

  // 지도
  mapWrap: { position: 'absolute', inset: 0 },
  mapLoading: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-assistive)', fontSize: 14 },

  // 내 위치 점
  myDot: { width: 16, height: 16, borderRadius: 999, background: '#16A9C4', border: '3px solid #fff', boxShadow: '0 0 0 4px rgba(22,169,196,0.25)', transform: 'translate(-50%,-50%)' },

  // 배지
  countBadge: {
    position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
    zIndex: 10, display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '7px 14px', borderRadius: 999,
    background: 'rgba(22,22,26,0.82)', color: '#fff',
    fontSize: 12.5, fontWeight: 600, backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
  },

  // 팝업 카드
  popupCard: {
    position: 'absolute', bottom: 92, left: 16, right: 16, zIndex: 15,
    background: '#fff', borderRadius: 18, padding: '16px 16px 14px',
    boxShadow: '0 8px 28px rgba(0,0,0,.14)',
    display: 'flex', flexDirection: 'column', gap: 12,
    cursor: 'pointer',
  },
  nowBadge: { fontSize: 10.5, fontWeight: 700, color: '#FF6B35', background: 'rgba(255,107,53,.12)', borderRadius: 5, padding: '2px 6px' },
  popupTitle: { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  popupMeta: { marginTop: 2, fontSize: 12, color: 'var(--text-assistive)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  joinBtn: { width: '100%', height: 44, border: 'none', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  // 하단 버튼 그룹
  bottomControls: {
    position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  listBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '11px 22px', borderRadius: 999,
    background: '#fff', border: 'none',
    fontSize: 14, fontWeight: 600, color: 'var(--text-normal)',
    boxShadow: '0 4px 16px rgba(0,0,0,.12)', cursor: 'pointer',
  },
  recenterBtn: {
    width: 44, height: 44, borderRadius: 999,
    background: '#fff', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,.10)', cursor: 'pointer',
  },
  fab: {
    width: 56, height: 56, borderRadius: 999,
    background: 'var(--primary)', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'var(--shadow-float)', cursor: 'pointer',
  },

  // 바텀 시트
  backdrop: { position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,.2)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
    background: '#fff', borderRadius: '22px 22px 0 0',
    maxHeight: '62%', display: 'flex', flexDirection: 'column',
    boxShadow: 'var(--shadow-sheet)',
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 999, background: '#D8DAE0', margin: '12px auto 0', flexShrink: 0 },
  sheetHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px', flexShrink: 0 },
  sheetTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-normal)' },
  filterBtn: { border: '1px solid var(--wds-line)', background: '#fff', borderRadius: 8, padding: '5px 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' },
  sheetList: { overflowY: 'auto', padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 9 },
  emptyText: { textAlign: 'center', padding: '32px 0', fontSize: 14, color: 'var(--text-assistive)' },
  sheetCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--wds-fill-alt)', cursor: 'pointer' },
  sheetThumb: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sheetCardTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sheetCardMeta: { fontSize: 11.5, color: 'var(--text-assistive)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sheetCardCount: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-assistive)', flexShrink: 0 },
}
