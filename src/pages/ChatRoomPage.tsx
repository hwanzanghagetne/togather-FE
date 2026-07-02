import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Bell, Calendar, Check, ChevronLeft, ChevronRight, Crown, Flag,
  Flame, Globe, Info, Languages, Lock, LogOut, MapPin, MoreHorizontal,
  Plus, SendHorizonal, Share2, UserPlus, Users, X, Zap,
} from 'lucide-react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { markJoinedMeetup, markLeftMeetup } from '../meetupSession'
import { apiFetch } from '../api'

// ─── interfaces ───────────────────────────────────────────────────────────────

interface ApiMessage {
  id: number
  chatRoomId: number
  senderId: number | null
  senderNickname: string | null
  content: string
  type: 'TEXT' | 'SYSTEM'
  createdAt: string
}

interface ChatMessage {
  id: number
  type: 'announcement' | 'approved' | 'join' | 'incoming' | 'outgoing'
  author?: string
  avatar?: { label: string; background: string; color: string }
  text: string
}

interface MeetupDetail {
  title?: string
  category?: string
  address?: string
  latitude?: number
  longitude?: number
  meetingDate?: string
  meetingTime?: string
  timeMode?: 'FLEXIBLE' | 'EXACT'
  minAge?: number
  maxAge?: number
  ageMin?: number
  ageMax?: number
  currentCount?: number
  hostId?: number
  hostNickname?: string
  visibility?: 'PUBLIC' | 'PRIVATE'
}

interface Member {
  id: number
  nickname: string
  profileImageUrl?: string
  country?: string
  language?: string
  mannerTemperature?: number
  interests?: string[]
  verified?: boolean
  isHost?: boolean
}

type View = 'chat' | 'info' | 'members'

// ─── constants & helpers ──────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: '#FFD9C7', color: '#E0531F' },
  { bg: '#D7E4FF', color: '#16A9C4' },
  { bg: '#D9F2DD', color: '#00973A' },
  { bg: '#F3D9FF', color: '#9B20D4' },
]

const CAT: Record<string, { emoji: string; label: string; color: string; tint: string }> = {
  FOOD:        { emoji: '🍽', label: '맛집·식사', color: '#FF6B35', tint: 'rgba(255,107,53,.12)' },
  CAFE:        { emoji: '☕', label: '카페',      color: '#6541F2', tint: 'rgba(101,65,242,.12)' },
  ACTIVITY:    { emoji: '⚡', label: '액티비티',  color: '#16A9C4', tint: 'rgba(22,169,196,.12)' },
  SIGHTSEEING: { emoji: '📍', label: '관광·문화', color: '#00973A', tint: 'rgba(0,151,58,.12)'  },
}

function catInfo(c?: string) {
  return CAT[c ?? ''] ?? { emoji: '●', label: '기타', color: '#9A9DA6', tint: 'rgba(154,157,166,.12)' }
}

function makeAvatar(nickname: string, index: number) {
  const c = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return { label: nickname.charAt(0), background: c.bg, color: c.color }
}

function toDisplayMessage(
  api: ApiMessage,
  myId: number | null,
  avatarMap: Map<number, ReturnType<typeof makeAvatar>>,
): ChatMessage {
  if (api.type === 'SYSTEM') {
    const isAnnouncement = api.content.includes('시작')
    const isApproved = api.content.includes('승인')
    return {
      id: api.id,
      type: isApproved ? 'approved' : isAnnouncement ? 'announcement' : 'join',
      text: api.content,
    }
  }
  const isMe = api.senderId !== null && api.senderId === myId
  if (isMe) return { id: api.id, type: 'outgoing', text: api.content }
  const senderId = api.senderId!
  if (!avatarMap.has(senderId)) {
    avatarMap.set(senderId, makeAvatar(api.senderNickname ?? '?', avatarMap.size))
  }
  return {
    id: api.id,
    type: 'incoming',
    author: api.senderNickname ?? undefined,
    avatar: avatarMap.get(senderId),
    text: api.content,
  }
}

function formatDateTime(dateStr?: string, timeMode?: 'FLEXIBLE' | 'EXACT', timeStr?: string) {
  if (!dateStr) return ''
  if (timeMode === 'FLEXIBLE' || !timeStr) {
    const d = new Date(`${dateStr}T00:00:00`)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    const dayLabel = isToday ? '오늘' : `${d.getMonth() + 1}월 ${d.getDate()}일`
    return timeMode === 'FLEXIBLE' ? `${dayLabel} · 하루 중 언제든` : dayLabel
  }
  const d = new Date(`${dateStr}T${timeStr}`)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const dayLabel = isToday ? '오늘' : `${d.getMonth() + 1}월 ${d.getDate()}일`
  const h24 = d.getHours()
  const m = d.getMinutes()
  const ampm = h24 < 12 ? '오전' : '오후'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${dayLabel} ${ampm} ${h12}:${String(m).padStart(2, '0')}`
}

function formatAgeRange(detail: MeetupDetail) {
  const minAge = detail.minAge ?? detail.ageMin
  const maxAge = detail.maxAge ?? detail.ageMax
  if (minAge == null || maxAge == null) return '—'
  return `${minAge} – ${maxAge}세`
}

// ─── MemberRow (stable, defined outside component) ────────────────────────────

function MemberRow({
  member, isMe, isHost, onTap,
}: {
  member: Member
  isMe: boolean
  isHost: boolean
  onTap: () => void
}) {
  const temp = (member.mannerTemperature ?? 36.5).toFixed(1)
  const isForeign = member.country && member.country !== '대한민국'
  const avatarIdx = member.id % 4

  return (
    <button
      disabled={isMe}
      style={{
        display: 'flex', alignItems: 'center', gap: 13,
        padding: '12px 20px', width: '100%', background: 'transparent',
        border: 'none', cursor: isMe ? 'default' : 'pointer', textAlign: 'left',
      }}
      onClick={isMe ? undefined : onTap}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 999,
          background: AVATAR_COLORS[avatarIdx].bg,
          color: AVATAR_COLORS[avatarIdx].color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700,
        }}>
          {member.nickname.charAt(0)}
        </div>
        {isHost && (
          <div style={{
            position: 'absolute', top: -3, right: -3,
            width: 18, height: 18, borderRadius: 999,
            background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,.18)',
          }}>
            <Crown size={11} fill="#FFB020" color="#FFB020" />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-normal)' }}>
            {member.nickname}
          </span>
          {/* 인증 체크 */}
          <div style={{
            width: 15, height: 15, borderRadius: 999, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={9} color="#fff" strokeWidth={3} />
          </div>
          {isMe && (
            <div style={{
              padding: '1px 7px', borderRadius: 999,
              background: 'var(--primary-tint)', fontSize: 10.5, fontWeight: 700, color: 'var(--primary)',
            }}>나</div>
          )}
          {isForeign && <span style={{ fontSize: 13 }}>🌐</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
          <Flame size={12} fill="#FFB020" color="#FFB020" />
          <span style={{ fontSize: 12, color: 'var(--text-assistive)', fontWeight: 600 }}>{temp}°</span>
        </div>
      </div>

      {!isMe && <ChevronRight size={16} color="var(--text-assistive)" />}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChatRoomPage() {
  const navigate = useNavigate()
  const { meetupId } = useParams<{ meetupId: string }>()
  const mid = meetupId ?? ''

  // chat
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<number | null>(null)
  const [translateOn, setTranslateOn] = useState(false)

  // meetup
  const [title, setTitle] = useState('채팅방')
  const [participants, setParticipants] = useState(0)
  const [hostId, setHostId] = useState<number | null>(null)
  const [category, setCategory] = useState('')
  const [address, setAddress] = useState('')
  const [detail, setDetail] = useState<MeetupDetail>({})
  const [isPublic, setIsPublic] = useState(true)

  // nav & menu
  const [showMenu, setShowMenu] = useState(false)
  const [muteNotif, setMuteNotif] = useState(false)
  const [view, setView] = useState<View>('chat')

  // members
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const stompRef = useRef<Client | null>(null)
  const avatarMap = useRef(new Map<number, ReturnType<typeof makeAvatar>>())
  const bodyRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    apiFetch('/api/members/me')
      .then((r) => r.json())
      .then((d) => setMyId(d.id ?? null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!mid) return
    apiFetch(`/api/meetups/${mid}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title ?? '채팅방')
        setParticipants(data.currentCount ?? 0)
        setHostId(data.hostId ?? null)
        setCategory(data.category ?? '')
        setAddress((data.address ?? '').replace(/^대한민국\s*/, ''))
        setIsPublic(data.visibility !== 'PRIVATE')
        setDetail({
          ...data,
          ageMin: data.ageMin ?? data.minAge,
          ageMax: data.ageMax ?? data.maxAge,
        })
      })
      .catch(() => {})
  }, [mid])

  useEffect(() => {
    if (!mid) return
    apiFetch(`/api/chat/${mid}`)
      .then((r) => r.ok ? r.json() : [])
      .then((list: ApiMessage[]) => {
        const am = avatarMap.current
        setMessages(list.map((m) => toDisplayMessage(m, myId, am)))
        markJoinedMeetup(Number(mid))
      })
      .catch(() => {})
  }, [mid, myId])

  useEffect(() => {
    if (!mid) return
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/chat/${mid}`, (frame) => {
          const api: ApiMessage = JSON.parse(frame.body)
          const msg = toDisplayMessage(api, myId, avatarMap.current)
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        })
      },
      onStompError: (frame) => console.error('STOMP error', frame),
    })
    client.activate()
    stompRef.current = client
    return () => { client.deactivate() }
  }, [mid, myId])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages])

  const fetchMembers = useCallback(async () => {
    if (!mid) return
    const r = await apiFetch(`/api/meetups/${mid}/participants`)
    if (!r.ok) return
    const list = await r.json()
    setMembers(list.map((member: { userId: number; nickname: string }, index: number) => ({
      id: member.userId,
      nickname: member.nickname,
      isHost: index === 0 || member.userId === hostId,
    })))
  }, [hostId, mid])

  const handleSend = () => {
    const trimmed = draft.trim()
    if (!trimmed || !stompRef.current?.connected) return
    stompRef.current.publish({
      destination: `/app/chat/${mid}`,
      body: JSON.stringify({ content: trimmed }),
    })
    setDraft('')
  }

  const cat = catInfo(category)

  // ── ① 모임 정보 ──────────────────────────────────────────────────────────────
  if (view === 'info') {
    const rows = [
      { icon: <Calendar size={19} color="var(--primary)" />, label: '일시', value: formatDateTime(detail.meetingDate, detail.timeMode, detail.meetingTime) || '—' },
      { icon: <MapPin size={19} color="var(--primary)" />,   label: '위치', value: address || '—' },
      { icon: <Users size={19} color="var(--primary)" />,    label: '나이대', value: formatAgeRange(detail) },
      { icon: <Crown size={19} color="var(--primary)" />,    label: '호스트', value: detail.hostNickname || '—', isHost: true },
    ]

    return (
      <div style={st.page}>
        <div style={st.shell}>
          <header style={st.header}>
            <button style={st.iconButton} onClick={() => setView('chat')}>
              <ChevronLeft size={22} />
            </button>
            <span style={st.headerCenter}>모임 정보</span>
            <button style={st.iconButton}>
              <Share2 size={20} />
            </button>
          </header>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* 지도 썸네일 */}
            <div style={{ height: 128, position: 'relative', overflow: 'hidden', background: '#dceef5' }}>
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(180,210,225,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(180,210,225,.55) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                backgroundColor: '#dceef5',
              }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={38} fill={cat.color} color={cat.color} />
              </div>
              <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,191,64,.14)', borderRadius: 999, padding: '4px 10px' }}>
                <Check size={10} color="#00BF40" strokeWidth={3} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#00BF40' }}>참여중</span>
              </div>
            </div>

            {/* 모임 타이틀 */}
            <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--wds-line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: cat.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {cat.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-normal)', lineHeight: 1.3 }}>{title}</div>
                  <div style={{ fontSize: 12.5, color: '#9a9da6', marginTop: 3 }}>
                    {cat.label} · {detail.visibility === 'PRIVATE' ? '비공개 모임' : '공개 모임'}
                  </div>
                </div>
              </div>
            </div>

            {/* 정보 행 */}
            <div style={{ padding: '0 20px' }}>
              {rows.map((row, i) => (
                <div key={row.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
                    <div style={{ width: 19, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {row.icon}
                    </div>
                    <span style={{ fontSize: 13, color: '#6a6d76', width: 44, flexShrink: 0 }}>{row.label}</span>
                    {row.isHost ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: 999,
                          background: 'var(--primary-tint)', color: 'var(--primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {row.value.charAt(0)}
                        </div>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-normal)' }}>{row.value}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-normal)' }}>{row.value}</span>
                    )}
                  </div>
                  {i < rows.length - 1 && <div style={{ height: 1, background: 'var(--wds-line)' }} />}
                </div>
              ))}
            </div>

            {/* 참여자 아바타 스택 */}
            <div style={{ padding: '16px 20px 36px', borderTop: '1px solid var(--wds-line)', marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {members.slice(0, 5).map((m, i) => (
                  <div key={m.id} style={{
                    width: 30, height: 30, borderRadius: 999,
                    background: AVATAR_COLORS[i % 4].bg, color: AVATAR_COLORS[i % 4].color,
                    border: '2px solid #fff', marginLeft: i === 0 ? 0 : -9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0, zIndex: 5 - i,
                  }}>
                    {m.nickname.charAt(0)}
                  </div>
                ))}
                <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 600, color: 'var(--text-normal)' }}>
                  {participants}명이 함께해요
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── ② 멤버 보기 ──────────────────────────────────────────────────────────────
  if (view === 'members') {
    const hostMember = members.find((m) => m.id === hostId || m.isHost)
    const otherMembers = members.filter((m) => m.id !== hostId && !m.isHost)

    return (
      <div style={st.page}>
        <div style={st.shell}>
          <header style={st.header}>
            <button style={st.iconButton} onClick={() => setView('chat')}>
              <ChevronLeft size={22} />
            </button>
            <span style={st.headerCenter}>멤버 {members.length}</span>
            <div style={{ width: 22 }} />
          </header>

          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
            {hostMember && (
              <>
                <div style={st.groupHeader}>호스트</div>
                <MemberRow
                  member={hostMember}
                  isMe={hostMember.id === myId}
                  isHost
                  onTap={() => setSelectedMember(hostMember)}
                />
              </>
            )}
            {otherMembers.length > 0 && (
              <>
                <div style={{ height: 1, background: 'var(--wds-line)', margin: '4px 0' }} />
                <div style={st.groupHeader}>참여자 {otherMembers.length}</div>
                {otherMembers.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isMe={m.id === myId}
                    isHost={false}
                    onTap={() => setSelectedMember(m)}
                  />
                ))}
              </>
            )}
          </div>

          {/* 하단 친구 초대 */}
          <div style={{ padding: '10px 20px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', borderTop: '1px solid var(--wds-line)', background: '#fff' }}>
            <button style={{ width: '100%', height: 48, borderRadius: 13, border: 'none', background: 'var(--wds-fill-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Share2 size={17} />
              친구 초대하기
            </button>
          </div>
        </div>

        {/* ③ 멤버 프로필 바텀시트 */}
        {selectedMember && (
          <>
            <div style={st.menuBackdrop} onClick={() => setSelectedMember(null)} />
            <div style={{ ...st.menuSheet, paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}>
              <div style={st.menuHandle} />

              {/* 아바타 + 이름 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 20px 0', gap: 0 }}>
                <div style={{
                  width: 74, height: 74, borderRadius: 999,
                  background: AVATAR_COLORS[selectedMember.id % 4].bg,
                  color: AVATAR_COLORS[selectedMember.id % 4].color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 700,
                }}>
                  {selectedMember.nickname.charAt(0)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-normal)' }}>
                    {selectedMember.nickname}
                  </span>
                  <div style={{ width: 17, height: 17, borderRadius: 999, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={10} color="#fff" strokeWidth={3} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                  <Globe size={13} color="var(--text-assistive)" />
                  <span style={{ fontSize: 13, color: 'var(--text-assistive)' }}>
                    {selectedMember.country ?? '대한민국'} · {selectedMember.language ?? '한국어'}
                  </span>
                </div>
              </div>

              {/* 매너온도 카드 */}
              <div style={{ margin: '16px 20px 0', padding: '14px 16px', borderRadius: 14, background: 'var(--wds-fill-alt)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Flame size={16} fill="#FFB020" color="#FFB020" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-normal)' }}>
                    매너온도 {(selectedMember.mannerTemperature ?? 36.5).toFixed(1)}°
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--wds-line)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 999,
                    background: 'linear-gradient(90deg, #FFB020 0%, #FF6B35 100%)',
                    width: `${Math.min(100, Math.max(4, ((selectedMember.mannerTemperature ?? 36.5) - 30) / 70 * 100))}%`,
                    transition: 'width 500ms ease',
                  }} />
                </div>
              </div>

              {/* 관심사 칩 */}
              {selectedMember.interests && selectedMember.interests.length > 0 && (
                <div style={{ padding: '14px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {selectedMember.interests.map((tag) => (
                    <span key={tag} style={{ padding: '5px 12px', borderRadius: 999, background: 'var(--primary-tint)', fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 하단 액션 2분할 */}
              <div style={{ display: 'flex', gap: 10, margin: '20px 20px 0' }}>
                <button
                  style={{ flex: 1, height: 48, borderRadius: 13, border: 'none', background: 'var(--wds-fill-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#FF9200', cursor: 'pointer' }}
                  onClick={() => {
                    const id = selectedMember.id
                    setSelectedMember(null)
                    navigate(`/report?type=USER&id=${id}`)
                  }}
                >
                  <Flag size={16} color="#FF9200" />
                  신고
                </button>
                <button
                  style={{ flex: 1, height: 48, borderRadius: 13, border: 'none', background: 'rgba(255,66,66,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 14, fontWeight: 700, color: '#FF4242', cursor: 'pointer' }}
                  onClick={async () => {
                    const id = selectedMember.id
                    await apiFetch(`/api/members/${id}/block`, { method: 'POST' }).catch(() => {})
                    setSelectedMember(null)
                    setMembers((prev) => prev.filter((m) => m.id !== id))
                  }}
                >
                  <X size={16} color="#FF4242" />
                  차단하기
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── 채팅 (기존) ───────────────────────────────────────────────────────────────
  return (
    <div style={st.page}>
      <div style={st.shell}>
        <header style={st.header}>
          <button style={st.iconButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {!isPublic && <Lock size={14} color="#6541F2" />}
              <div style={st.title}>{title}</div>
            </div>
            {participants > 0 && <div style={st.subtitle}>{participants}명 참여</div>}
          </div>
          {participants > 0 && (
            <div style={st.countPill}>
              <Users size={15} strokeWidth={2.2} />
              <span>{participants}</span>
            </div>
          )}
          <button style={st.iconButton} onClick={() => setShowMenu(true)}>
            <MoreHorizontal size={22} />
          </button>
        </header>

        {/* 메뉴 바텀시트 */}
        {showMenu && (
          <>
            <div style={st.menuBackdrop} onClick={() => setShowMenu(false)} />
            <div style={st.menuSheet}>
              <div style={st.menuHandle} />
              <div style={st.menuHeader}>
                <div style={st.menuHeaderTile}>
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={st.menuHeaderTitle}>{title}</div>
                  <div style={st.menuHeaderMeta}>{address ? `${address} · ` : ''}{participants}명 참여</div>
                </div>
              </div>

              <div style={st.menuItems}>
                <button style={st.menuItem} onClick={() => { setShowMenu(false); setView('info') }}>
                  <div style={{ ...st.menuItemIcon, background: 'rgba(22,169,196,.1)' }}>
                    <Info size={18} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={st.menuItemLabel}>모임 정보</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-assistive)" />
                </button>

                <button style={st.menuItem} onClick={async () => { setShowMenu(false); await fetchMembers(); setView('members') }}>
                  <div style={{ ...st.menuItemIcon, background: 'rgba(22,169,196,.1)' }}>
                    <Users size={18} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={st.menuItemLabel}>멤버 보기</div>
                    <div style={st.menuItemSub}>{participants}명 참여 중</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-assistive)" />
                </button>

                <div style={st.menuItem}>
                  <div style={{ ...st.menuItemIcon, background: 'rgba(154,157,166,.12)' }}>
                    <Bell size={18} color="var(--text-secondary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={st.menuItemLabel}>이 채팅 알림 끄기</div>
                  </div>
                  <button
                    style={{ ...st.toggle, background: muteNotif ? 'var(--primary)' : '#D0D3DC' }}
                    onClick={() => setMuteNotif((v) => !v)}
                  >
                    <div style={{ ...st.toggleKnob, transform: muteNotif ? 'translateX(18px)' : 'translateX(0)' }} />
                  </button>
                </div>

                <div style={st.menuDivider} />

                <button style={st.menuItem} onClick={() => { setShowMenu(false); navigate('/report') }}>
                  <div style={{ ...st.menuItemIcon, background: 'rgba(255,146,0,.1)' }}>
                    <Flag size={18} color="#FF9200" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...st.menuItemLabel, color: '#FF9200' }}>신고하기</div>
                  </div>
                </button>

                {myId === hostId && !isPublic && (
                  <button style={st.menuItem} onClick={() => { setShowMenu(false); navigate(`/meetups/${mid}/join-requests`) }}>
                    <div style={{ ...st.menuItemIcon, background: 'rgba(101,65,242,.1)' }}>
                      <UserPlus size={18} color="#6541F2" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={st.menuItemLabel}>참여 요청 관리</div>
                      <div style={st.menuItemSub}>새로운 참여 요청을 확인해요</div>
                    </div>
                  </button>
                )}

                {myId === hostId && (
                  <button style={st.menuItem} onClick={() => { setShowMenu(false); navigate(`/meetups/${mid}/host-transfer`) }}>
                    <div style={{ ...st.menuItemIcon, background: 'rgba(255,146,0,.1)' }}>
                      <Crown size={18} color="#FF9200" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={st.menuItemLabel}>방장 양도</div>
                      <div style={st.menuItemSub}>다른 사람에게 방장을 넘겨요</div>
                    </div>
                  </button>
                )}

                <div style={st.menuDivider} />

                {myId === hostId ? (
                  <button style={st.menuItem} onClick={async () => {
                    if (!window.confirm('모임을 종료할까요? 채팅방이 닫혀요.')) return
                    setShowMenu(false)
                    await apiFetch(`/api/meetups/${mid}`, { method: 'DELETE' }).catch(() => {})
                    markLeftMeetup(Number(mid))
                    navigate('/home', { replace: true })
                  }}>
                    <div style={{ ...st.menuItemIcon, background: 'rgba(255,66,66,.08)' }}>
                      <LogOut size={18} color="var(--negative)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...st.menuItemLabel, color: 'var(--negative)' }}>모임 종료</div>
                      <div style={st.menuItemSub}>모임을 종료하고 채팅방을 닫아요</div>
                    </div>
                  </button>
                ) : (
                  <button style={st.menuItem} onClick={async () => {
                    if (!window.confirm('채팅방에서 나갈까요?')) return
                    setShowMenu(false)
                    await apiFetch(`/api/meetups/${mid}/join`, { method: 'DELETE' }).catch(() => {})
                    markLeftMeetup(Number(mid))
                    navigate('/home', { replace: true })
                  }}>
                    <div style={{ ...st.menuItemIcon, background: 'rgba(255,66,66,.08)' }}>
                      <X size={18} color="var(--negative)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...st.menuItemLabel, color: 'var(--negative)' }}>채팅방 나가기</div>
                      <div style={st.menuItemSub}>채팅방에서 나가요</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        <main ref={bodyRef as React.RefObject<HTMLElement>} style={st.body}>
          {messages.map((message) => {
            if (message.type === 'announcement') {
              return (
                <div key={message.id} style={st.announcementWrap}>
                  <div style={st.announcement}>
                    <Zap size={13} fill="currentColor" strokeWidth={1.8} />
                    {message.text}
                  </div>
                </div>
              )
            }
            if (message.type === 'approved') {
              return (
                <div key={message.id} style={st.announcementWrap}>
                  <div style={{ ...st.announcement, background: 'rgba(0,191,64,.12)', color: '#00BF40' }}>
                    <Check size={13} fill="currentColor" strokeWidth={1.8} />
                    {message.text}
                  </div>
                </div>
              )
            }
            if (message.type === 'join') {
              return <div key={message.id} style={st.joinMessage}>{message.text}</div>
            }
            if (message.type === 'incoming') {
              return (
                <div key={message.id} style={st.incomingRow}>
                  <div style={{ ...st.avatar, background: message.avatar?.background, color: message.avatar?.color }}>
                    {message.avatar?.label}
                  </div>
                  <div style={{ maxWidth: '78%' }}>
                    {message.author && <div style={st.author}>{message.author}</div>}
                    <div style={st.incomingBubble}>{message.text}</div>
                  </div>
                </div>
              )
            }
            return (
              <div key={message.id} style={st.outgoingRow}>
                <div style={st.outgoingBubble}>{message.text}</div>
              </div>
            )
          })}
          {messages.length === 0 && (
            <div style={st.empty}>아직 메시지가 없어요. 먼저 인사해보세요 👋</div>
          )}
        </main>

        {translateOn && (
          <div style={st.translateBanner}>
            <Languages size={14} color="var(--primary)" />
            <span>메시지를 한국어로 번역 중이에요</span>
            <button style={st.translateClose} onClick={() => setTranslateOn(false)}>끄기</button>
          </div>
        )}

        <footer style={st.footer}>
          <button style={st.footerIconButton}>
            <Plus size={22} />
          </button>
          <div style={st.inputWrap}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
              placeholder="메시지 입력"
              maxLength={500}
              style={st.input}
            />
            <button
              style={{ ...st.translateBtn, color: translateOn ? 'var(--primary)' : 'var(--text-placeholder)', background: translateOn ? 'var(--primary-tint)' : 'transparent' }}
              onClick={() => setTranslateOn((v) => !v)}
            >
              <Languages size={17} />
            </button>
          </div>
          <button style={{ ...st.sendButton, background: draft.trim() ? 'var(--primary)' : '#DCE8EC', color: '#fff' }} onClick={handleSend} disabled={!draft.trim()}>
            <SendHorizonal size={24} fill="currentColor" strokeWidth={2} />
          </button>
        </footer>
      </div>
    </div>
  )
}

// ─── styles ───────────────────────────────────────────────────────────────────

const st: Record<string, React.CSSProperties> = {
  page:  { height: '100dvh', background: 'var(--wds-fill)', overflow: 'hidden' },
  shell: { height: '100dvh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--wds-fill)' },

  header: { height: 58, background: '#fff', borderBottom: '1px solid var(--wds-line)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,.04)' },
  headerCenter: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 700, color: 'var(--text-normal)' },
  iconButton: { border: 'none', background: 'transparent', padding: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', flexShrink: 0 },
  title:   { fontSize: 15, fontWeight: 700, color: 'var(--text-normal)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  subtitle: { marginTop: 1, fontSize: 11.5, color: 'var(--text-assistive)' },
  countPill: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 999, background: 'var(--primary-tint)', fontSize: 12, fontWeight: 600, color: 'var(--primary)', flexShrink: 0 },

  groupHeader: { padding: '14px 20px 4px', fontSize: 12, fontWeight: 700, color: '#9a9da6', letterSpacing: '0.04em' },

  body: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 },
  announcementWrap: { display: 'flex', justifyContent: 'center', margin: '4px 0' },
  announcement: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, background: 'var(--primary-tint)', color: 'var(--primary)', fontSize: 12, fontWeight: 600 },
  joinMessage: { alignSelf: 'center', fontSize: 11.5, color: 'var(--text-assistive)', margin: '2px 0' },
  incomingRow: { alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'flex-end', maxWidth: '80%' },
  outgoingRow: { alignSelf: 'flex-end', maxWidth: '78%' },
  avatar: { width: 32, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  author: { marginBottom: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-assistive)' },
  incomingBubble: { padding: '10px 13px', borderRadius: '4px 16px 16px 16px', background: '#fff', color: 'var(--text-normal)', fontSize: 14, lineHeight: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,.06)' },
  outgoingBubble: { padding: '10px 13px', borderRadius: '16px 4px 16px 16px', background: 'var(--primary)', color: '#fff', fontSize: 14, lineHeight: 1.5 },
  empty: { alignSelf: 'center', marginTop: 60, fontSize: 13, color: 'var(--text-assistive)' },

  footer: { background: '#fff', borderTop: '1px solid var(--wds-line)', paddingTop: 10, paddingLeft: 14, paddingRight: 14, paddingBottom: 'max(10px, env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: 8 },
  footerIconButton: { border: 'none', background: 'transparent', color: 'var(--text-assistive)', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer', flexShrink: 0 },
  inputWrap: { flex: 1, minWidth: 0, height: 44, borderRadius: 999, background: 'var(--wds-fill-alt)', display: 'flex', alignItems: 'center', padding: '0 10px 0 16px', gap: 6 },
  input: { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-normal)', fontSize: 16, lineHeight: '1.4', WebkitAppearance: 'none' },
  translateBtn: { width: 28, height: 28, borderRadius: 8, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 150ms ease' },
  translateBanner: { display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', background: 'var(--primary-tint)', fontSize: 12.5, color: 'var(--primary)', fontWeight: 500, borderTop: '1px solid rgba(22,169,196,.15)' },
  translateClose: { marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0' },
  sendButton: { border: 'none', width: 44, height: 44, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(22,169,196,.18)' },

  menuBackdrop: { position: 'fixed', inset: 0, background: 'rgba(20,22,28,.4)', zIndex: 40 },
  menuSheet: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '22px 22px 0 0', zIndex: 50, paddingBottom: 'max(16px, env(safe-area-inset-bottom))', maxHeight: '85dvh', overflowY: 'auto' },
  menuHandle: { width: 40, height: 4, borderRadius: 999, background: '#D8DAE0', margin: '12px auto 0' },
  menuHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderBottom: '1px solid var(--wds-line)' },
  menuHeaderTile: { width: 44, height: 44, borderRadius: 12, background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  menuHeaderTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  menuHeaderMeta: { fontSize: 11.5, color: 'var(--text-assistive)', marginTop: 2 },
  menuItems: { display: 'flex', flexDirection: 'column', padding: '8px 16px 8px', gap: 2 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px', borderRadius: 14, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' },
  menuItemIcon: { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuItemLabel: { fontSize: 14, fontWeight: 700, color: 'var(--text-normal)' },
  menuItemSub: { fontSize: 12, color: 'var(--text-assistive)', marginTop: 2 },
  menuDivider: { height: 1, background: 'var(--wds-line)', margin: '4px 0' },
  toggle: { width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 200ms ease', flexShrink: 0, padding: 0 },
  toggleKnob: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: 999, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'transform 200ms ease' },
}





