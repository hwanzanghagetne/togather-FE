import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleMap, useJsApiLoader, OverlayView, Autocomplete } from '@react-google-maps/api'
import { Bell, Crosshair, List, Plus, X, Zap } from 'lucide-react'
import { apiFetch } from '../api'
import { readJoinedMeetupIds, markJoinedMeetup, markLeftMeetup } from '../meetupSession'

const LIBRARIES: ('places')[] = ['places']

interface Meetup {
  id: number
  hostId: number
  title: string
  latitude: number
  longitude: number
  category: string
  currentCount: number
  status: string
  visibility?: 'PUBLIC' | 'PRIVATE'
  address?: string
  expiresAt?: string
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

const CAT_LABEL: Record<string, string> = {
  FOOD: '식사',
  CAFE: '카페·술',
  ACTIVITY: '액티비티',
  SIGHTSEEING: '관광',
  OTHER: '기타',
}

const CHIPS: Array<{ key: CategoryFilter; label: string; emoji?: string }> = [
  { key: 'ALL', label: '전체' },
  { key: 'FOOD', label: '식사', emoji: '🍽' },
  { key: 'CAFE', label: '카페·술', emoji: '☕' },
  { key: 'ACTIVITY', label: '액티비티', emoji: '⚡' },
  { key: 'SIGHTSEEING', label: '관광', emoji: '📍' },
]

const MAP_STYLES = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
]

/* 아바타 색 팔레트 (인원 표시용) */
const AVATAR_COLORS = [
  { bg: '#FFD9C7', fg: '#E0531F' },
  { bg: '#D7E4FF', fg: '#16A9C4' },
  { bg: '#D9F2DD', fg: '#00973A' },
  { bg: '#EDE4FF', fg: '#6541F2' },
]

function PinMarker({ color, emoji, count, selected, onClick }: {
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
        background: color, border: '3px solid #fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: selected ? `0 6px 18px ${color}70` : '0 4px 10px rgba(0,0,0,0.2)',
        transition: 'all 150ms ease', position: 'relative',
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
      <div style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `8px solid ${color}`, marginTop: -1 }} />
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
  const [myId, setMyId] = useState<number | null>(null)
  const [joinedIds, setJoinedIds] = useState<number[]>(() => readJoinedMeetupIds())
  const [pending, setPending] = useState(false)
  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
    libraries: LIBRARIES,
  })

  useEffect(() => {
    apiFetch('/api/members/me').then((r) => r.ok ? r.json() : null).then((d) => setMyId(d?.id ?? null)).catch(() => {})
  }, [])

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }, [])

  const fetchMeetups = useCallback(async (c = center) => {
    const r = await apiFetch(`/api/meetups/nearby?lat=${c.lat}&lng=${c.lng}&radius=10`)
    if (r.ok) setMeetups(await r.json())
  }, [center])

  useEffect(() => { fetchMeetups(center) }, [center, fetchMeetups])

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

  const handleJoin = async () => {
    if (!selected || pending) return
    setPending(true)
    try {
      const r = await apiFetch(`/api/meetups/${selected.id}/join`, { method: 'POST' })
      if (!r.ok) return
      markJoinedMeetup(selected.id)
      setJoinedIds((prev) => [...new Set([...prev, selected.id])])
      await fetchMeetups()
      navigate(`/chat/${selected.id}`)
    } finally { setPending(false) }
  }

  const handleLeave = async () => {
    if (!selected || pending) return
    setPending(true)
    try {
      const r = await apiFetch(`/api/meetups/${selected.id}/join`, { method: 'DELETE' })
      if (!r.ok) return
      markLeftMeetup(selected.id)
      setJoinedIds((prev) => prev.filter((id) => id !== selected.id))
      setSelected(null)
      await fetchMeetups()
    } finally { setPending(false) }
  }

  const filtered = activeCategory === 'ALL' ? meetups : meetups.filter((m) => m.category === activeCategory)

  const isJoined = (m: Meetup) => joinedIds.includes(m.id) || m.hostId === myId
  const isHost = (m: Meetup) => m.hostId === myId

  return (
    <div style={s.page}>
      {/* 검색바 + 알림 */}
      <div style={s.topBar}>
        <div style={s.searchBar}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-placeholder)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          {isLoaded ? (
            <Autocomplete
              onLoad={(ac) => { autocompleteRef.current = ac }}
              onPlaceChanged={onPlaceChanged}
              options={{ fields: ['geometry', 'name'] }}
            >
              <input style={s.searchInput} placeholder="지역 · 지금 근처" />
            </Autocomplete>
          ) : (
            <span style={s.searchPlaceholder}>지역 · 지금 근처</span>
          )}
        </div>
        <button style={s.bellBtn} onClick={() => navigate('/notifications')}>
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
              style={{ ...s.chip, background: active ? 'var(--primary)' : '#fff', color: active ? '#fff' : 'var(--text-normal)', fontWeight: active ? 700 : 500, border: active ? 'none' : '1px solid var(--wds-line)' }}
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
            center={center} zoom={15} onLoad={onMapLoad}
            onClick={() => { setSelected(null); setShowList(false) }}
            options={{ styles: MAP_STYLES, disableDefaultUI: true, gestureHandling: 'greedy' }}
          >
            <OverlayView position={center} mapPaneName="overlayMouseTarget">
              <div style={s.myDot} />
            </OverlayView>
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

      {/* 진행 중 배지 */}
      {filtered.length > 0 && !showList && !selected && (
        <div style={s.countBadge}>
          <Zap size={12} color="#FF6B35" fill="#FF6B35" />
          지금 {filtered.length}개 진행 중
        </div>
      )}

      {/* 팝업 카드 (B-3 / B-4) */}
      {selected && (() => {
        const joined = isJoined(selected)
        const host = isHost(selected)
        const color = CAT_COLOR[selected.category] ?? '#9A9DA6'
        return (
          <div style={s.popupCard}>
            {/* 닫기 */}
            <button style={s.closeBtn} onClick={() => setSelected(null)}>
              <X size={18} color="var(--text-secondary)" />
            </button>

            <div style={{ display: 'flex', gap: 12 }}>
              {/* 카테고리 아이콘 타일 52×52 radius14 */}
              <div style={{ width: 52, height: 52, borderRadius: 14, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {CAT_EMOJI[selected.category] ?? '●'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* 뱃지 row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={s.nowBadge}>지금 바로</span>
                  {joined && <span style={{ ...s.nowBadge, background: 'var(--primary-tint)', color: 'var(--primary)' }}>{host ? '주최중' : '참여중'}</span>}
                  {selected.address && (
                    <span style={{ fontSize: 11, color: 'var(--text-assistive)', marginLeft: 'auto' }}>
                      {selected.address.replace(/^대한민국\s*/, '').split(' ').slice(-2).join(' ')}
                    </span>
                  )}
                </div>
                {/* 제목 */}
                <div style={s.popupTitle}>{selected.title}</div>
                {/* 카테고리 라벨 */}
                <div style={{ marginTop: 2, fontSize: 12, color: 'var(--text-assistive)' }}>{CAT_LABEL[selected.category]}</div>
              </div>
            </div>

            {/* 아바타 스택 + N명 가는 중 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <div style={{ display: 'flex' }}>
                {Array.from({ length: Math.min(selected.currentCount, 4) }).map((_, i) => {
                  const c = AVATAR_COLORS[i % AVATAR_COLORS.length]
                  return (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: 999, background: c.bg, border: '2px solid #fff', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: c.fg, zIndex: i }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  )
                })}
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>
                {selected.currentCount}명 가는 중
              </span>
            </div>

            {/* CTA 버튼 */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              {joined ? (
                <>
                  <button style={{ flex: 1, height: 50, borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                    onClick={() => navigate(`/chat/${selected.id}`)}>
                    채팅 열기
                  </button>
                  <button style={{ height: 50, padding: '0 18px', borderRadius: 12, border: 'none', background: 'rgba(255,66,66,.08)', color: 'var(--negative)', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: pending ? 0.6 : 1 }}
                    onClick={handleLeave} disabled={pending}>
                    나가기
                  </button>
                </>
              ) : selected.visibility === 'PRIVATE' ? (
                <button
                  style={{ flex: 1, height: 50, borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={() => navigate(`/meetups/${selected.id}/join-request`)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  참가 요청하기
                </button>
              ) : (
                <button
                  style={{ flex: 1, height: 50, borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: pending ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={handleJoin} disabled={pending || selected.status !== 'OPEN'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                  {selected.status === 'OPEN' ? '채팅 참여하기' : '마감됨'}
                </button>
              )}
            </div>
          </div>
        )
      })()}

      {/* 리스트 버튼 — 하단 중앙 bottom:18 */}
      {!showList && !selected && (
        <button style={s.listBtn} onClick={() => setShowList(true)}>
          <List size={15} strokeWidth={2} />
          리스트
        </button>
      )}

      {/* 현위치 버튼 — 우하단 right:16 bottom:154 */}
      <button style={s.recenterBtn} onClick={recenter}>
        <Crosshair size={18} color="var(--text-secondary)" strokeWidth={2} />
      </button>

      {/* + FAB — 우하단 right:16 bottom:90 */}
      <button style={s.fab} onClick={() => navigate('/meetups/new')}>
        <Plus size={22} color="#fff" strokeWidth={2.5} />
      </button>

      {/* 리스트 바텀시트 */}
      {showList && (
        <>
          <div style={s.backdrop} onClick={() => setShowList(false)} />
          <div style={s.sheet}>
            <div style={s.sheetHandle} />
            <div style={s.sheetHeader}>
              <span style={s.sheetTitle}>이 지역 모임 {filtered.length}개</span>
            </div>
            <div style={s.sheetList}>
              {filtered.length === 0 ? (
                <div style={s.emptyText}>근처 모임이 없어요</div>
              ) : (
                filtered.map((m) => (
                  <div key={m.id} style={s.sheetCard} onClick={() => { setSelected(m); setShowList(false) }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: (CAT_COLOR[m.category] ?? '#9A9DA6') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                      {CAT_EMOJI[m.category] ?? '●'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <span style={s.nowBadge}>지금 바로</span>
                        {isJoined(m) && <span style={{ ...s.nowBadge, background: 'var(--primary-tint)', color: 'var(--primary)' }}>참여중</span>}
                      </div>
                      <div style={s.sheetCardTitle}>{m.title}</div>
                      {m.address && <div style={s.sheetCardMeta}>{m.address.replace(/^대한민국\s*/, '')}</div>}
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
  page: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden' },

  topBar: { position: 'absolute', top: 14, left: 16, right: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10 },
  searchBar: { flex: 1, height: 42, borderRadius: 12, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,.09)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 13px' },
  searchInput: { flex: 1, width: '100%', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-normal)', background: 'transparent' },
  searchPlaceholder: { flex: 1, fontSize: 14, color: 'var(--text-placeholder)' },
  bellBtn: { position: 'relative', width: 42, height: 42, borderRadius: 12, background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.09)', cursor: 'pointer', flexShrink: 0 },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 999, background: 'var(--negative)', border: '1.5px solid #fff' },

  chips: { position: 'absolute', top: 68, left: 16, zIndex: 10, display: 'flex', gap: 7 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.08)', whiteSpace: 'nowrap', transition: 'all 150ms ease' },

  mapWrap: { position: 'absolute', inset: 0 },
  mapLoading: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-assistive)', fontSize: 14 },
  myDot: { width: 16, height: 16, borderRadius: 999, background: 'var(--primary)', border: '3px solid #fff', boxShadow: '0 0 0 4px rgba(22,169,196,0.25)', transform: 'translate(-50%,-50%)' },

  countBadge: { position: 'absolute', top: 116, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 999, background: 'rgba(22,22,26,0.82)', color: '#fff', fontSize: 12, fontWeight: 600, backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' },

  /* 팝업 카드 — bottom:90으로 FAB 위에 표시 */
  popupCard: { position: 'absolute', bottom: 90, left: 16, right: 16, zIndex: 15, background: '#fff', borderRadius: 20, padding: '16px', boxShadow: '0 8px 28px rgba(0,0,0,.15)', display: 'flex', flexDirection: 'column' },
  closeBtn: { position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: 999, border: 'none', background: 'var(--wds-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  nowBadge: { fontSize: 10.5, fontWeight: 700, color: '#FF6B35', background: 'rgba(255,107,53,.12)', borderRadius: 5, padding: '2px 6px', display: 'inline-flex', alignItems: 'center' },
  popupTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },

  /* 하단 컨트롤 — 스펙 좌표 */
  listBtn: { position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 20px', borderRadius: 999, background: '#fff', border: 'none', fontSize: 13.5, fontWeight: 600, color: 'var(--text-normal)', boxShadow: '0 4px 16px rgba(0,0,0,.12)', cursor: 'pointer', whiteSpace: 'nowrap' },
  recenterBtn: { position: 'absolute', right: 16, bottom: 154, zIndex: 10, width: 46, height: 46, borderRadius: 999, background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.12)', cursor: 'pointer' },
  fab: { position: 'absolute', right: 16, bottom: 90, zIndex: 10, width: 56, height: 56, borderRadius: 999, background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-float)', cursor: 'pointer' },

  /* 바텀시트 */
  backdrop: { position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(20,22,28,.35)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, background: '#fff', borderRadius: '22px 22px 0 0', maxHeight: '62%', display: 'flex', flexDirection: 'column', boxShadow: '0 -6px 20px rgba(0,0,0,.12)' },
  sheetHandle: { width: 40, height: 4, borderRadius: 999, background: '#D8DAE0', margin: '12px auto 0', flexShrink: 0 },
  sheetHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px', flexShrink: 0 },
  sheetTitle: { fontSize: 16, fontWeight: 700, color: 'var(--text-normal)' },
  sheetList: { overflowY: 'auto', padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 9 },
  emptyText: { textAlign: 'center', padding: '32px 0', fontSize: 14, color: 'var(--text-assistive)' },
  sheetCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--wds-fill-alt)', cursor: 'pointer' },
  sheetCardTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sheetCardMeta: { fontSize: 11.5, color: 'var(--text-assistive)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sheetCardCount: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-assistive)', flexShrink: 0 },
}
