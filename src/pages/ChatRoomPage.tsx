import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Bell, ChevronLeft, ChevronRight, Crown, Flag, Info, Languages, LogOut, MoreHorizontal, Plus, SendHorizonal, Users, X, Zap } from 'lucide-react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { markJoinedMeetup } from '../meetupSession'
import { apiFetch } from '../api'

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
  type: 'announcement' | 'join' | 'incoming' | 'outgoing'
  author?: string
  avatar?: { label: string; background: string; color: string }
  text: string
}

const AVATAR_COLORS = [
  { bg: '#FFD9C7', color: '#E0531F' },
  { bg: '#D7E4FF', color: '#16A9C4' },
  { bg: '#D9F2DD', color: '#00973A' },
  { bg: '#F3D9FF', color: '#9B20D4' },
]

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
    // "⚡ 지금 바로 모임이 시작됐어요" or "OO님이 입장했습니다"
    const isAnnouncement = api.content.includes('시작')
    return { id: api.id, type: isAnnouncement ? 'announcement' : 'join', text: api.content }
  }

  const isMe = api.senderId !== null && api.senderId === myId
  if (isMe) {
    return { id: api.id, type: 'outgoing', text: api.content }
  }

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

export default function ChatRoomPage() {
  const navigate = useNavigate()
  const { meetupId } = useParams<{ meetupId: string }>()
  const mid = meetupId ?? ''

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [myId, setMyId] = useState<number | null>(null)
  const [title, setTitle] = useState('채팅방')
  const [participants, setParticipants] = useState(0)
  const [hostId, setHostId] = useState<number | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [translateOn, setTranslateOn] = useState(false)
  const [muteNotif, setMuteNotif] = useState(false)
  const [category, setCategory] = useState('')
  const [address, setAddress] = useState('')

  const stompRef = useRef<Client | null>(null)
  const avatarMap = useRef(new Map<number, ReturnType<typeof makeAvatar>>())
  const bodyRef = useRef<HTMLElement | null>(null)

  // 내 userId 조회
  useEffect(() => {
    apiFetch('/api/members/me')
      .then((r) => r.json())
      .then((data) => setMyId(data.id ?? null))
      .catch(() => {})
  }, [])

  // 모임 정보 조회 (제목, 인원)
  useEffect(() => {
    if (!mid) return
    apiFetch(`/api/meetups/${mid}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.title) setTitle(data.title)
        if (data.currentCount != null) setParticipants(data.currentCount)
        if (data.hostId != null) setHostId(data.hostId)
        if (data.category) setCategory(data.category)
        if (data.address) setAddress(data.address.replace(/^대한민국\s*/, ''))
      })
      .catch(() => {})
  }, [mid])

  // 이전 메시지 이력 조회
  useEffect(() => {
    if (!mid) return
    apiFetch(`/api/chat/${mid}`)
      .then((r) => r.json())
      .then((list: ApiMessage[]) => {
        const am = avatarMap.current
        setMessages(list.map((m) => toDisplayMessage(m, myId, am)))
        markJoinedMeetup(Number(mid))
      })
      .catch(() => {})
  }, [mid, myId])

  // WebSocket STOMP 연결 — access_token 쿠키가 SockJS 핸드셰이크 시 자동 전송됨
  useEffect(() => {
    if (!mid) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_WS_URL ?? ''}/ws`),
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
      onStompError: (frame) => {
        console.error('STOMP error', frame)
      },
    })
    client.activate()
    stompRef.current = client

    return () => {
      client.deactivate()
    }
  }, [mid, myId])

  // 새 메시지 오면 스크롤 아래로
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const trimmed = draft.trim()
    if (!trimmed || !stompRef.current?.connected) return
    stompRef.current.publish({
      destination: `/app/chat/${mid}`,
      body: JSON.stringify({ content: trimmed }),
    })
    setDraft('')
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <button style={styles.iconButton} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.title}>{title}</div>
            {participants > 0 && (
              <div style={styles.subtitle}>{participants}명 참여</div>
            )}
          </div>
          {participants > 0 && (
            <div style={styles.countPill}>
              <Users size={15} strokeWidth={2.2} />
              <span>{participants}</span>
            </div>
          )}
          <button style={styles.iconButton} onClick={() => setShowMenu(true)}>
            <MoreHorizontal size={22} />
          </button>
        </header>

        {/* 방 메뉴 바텀시트 */}
        {showMenu && (
          <>
            <div style={styles.menuBackdrop} onClick={() => setShowMenu(false)} />
            <div style={styles.menuSheet}>
              <div style={styles.menuHandle} />
              {/* 모임 요약 헤더 */}
              <div style={styles.menuHeader}>
                <div style={styles.menuHeaderTile}>
                  <span style={{ fontSize: 20 }}>
                    {category === 'FOOD' ? '🍽' : category === 'CAFE' ? '☕' : category === 'ACTIVITY' ? '⚡' : category === 'SIGHTSEEING' ? '📍' : '●'}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.menuHeaderTitle}>{title}</div>
                  {address ? <div style={styles.menuHeaderMeta}>{address} · {participants}명 참여</div> : <div style={styles.menuHeaderMeta}>{participants}명 참여</div>}
                </div>
              </div>

              <div style={styles.menuItems}>
                {/* 공통 메뉴 */}
                <button style={styles.menuItem} onClick={() => setShowMenu(false)}>
                  <div style={{ ...styles.menuItemIcon, background: 'rgba(22,169,196,.1)' }}>
                    <Info size={18} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.menuItemLabel}>모임 정보</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-assistive)" />
                </button>

                <button style={styles.menuItem} onClick={() => setShowMenu(false)}>
                  <div style={{ ...styles.menuItemIcon, background: 'rgba(22,169,196,.1)' }}>
                    <Users size={18} color="var(--primary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.menuItemLabel}>멤버 보기</div>
                    <div style={styles.menuItemSub}>{participants}명 참여 중</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-assistive)" />
                </button>

                <div style={styles.menuItem}>
                  <div style={{ ...styles.menuItemIcon, background: 'rgba(154,157,166,.12)' }}>
                    <Bell size={18} color="var(--text-secondary)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={styles.menuItemLabel}>이 채팅 알림 끄기</div>
                  </div>
                  <button
                    style={{ ...styles.toggle, background: muteNotif ? 'var(--primary)' : '#D0D3DC' }}
                    onClick={() => setMuteNotif((v) => !v)}
                  >
                    <div style={{ ...styles.toggleKnob, transform: muteNotif ? 'translateX(18px)' : 'translateX(0)' }} />
                  </button>
                </div>

                <div style={styles.menuDivider} />

                <button style={{ ...styles.menuItem }} onClick={() => { setShowMenu(false); navigate('/report') }}>
                  <div style={{ ...styles.menuItemIcon, background: 'rgba(255,146,0,.1)' }}>
                    <Flag size={18} color="#FF9200" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...styles.menuItemLabel, color: '#FF9200' }}>신고하기</div>
                  </div>
                </button>

                {/* 방장 전용 */}
                {myId === hostId && (
                  <button style={styles.menuItem} onClick={() => { setShowMenu(false); navigate(`/meetups/${mid}/host-transfer`) }}>
                    <div style={{ ...styles.menuItemIcon, background: 'rgba(255,146,0,.1)' }}>
                      <Crown size={18} color="#FF9200" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.menuItemLabel}>방장 양도</div>
                      <div style={styles.menuItemSub}>다른 사람에게 방장을 넘겨요</div>
                    </div>
                  </button>
                )}

                <div style={styles.menuDivider} />

                {/* 나가기 */}
                {myId === hostId ? (
                  <button style={{ ...styles.menuItem }} onClick={() => setShowMenu(false)}>
                    <div style={{ ...styles.menuItemIcon, background: 'rgba(255,66,66,.08)' }}>
                      <LogOut size={18} color="var(--negative)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...styles.menuItemLabel, color: 'var(--negative)' }}>모임 종료</div>
                      <div style={styles.menuItemSub}>모임을 종료하고 채팅방을 닫아요</div>
                    </div>
                  </button>
                ) : (
                  <button style={{ ...styles.menuItem }} onClick={() => setShowMenu(false)}>
                    <div style={{ ...styles.menuItemIcon, background: 'rgba(255,66,66,.08)' }}>
                      <X size={18} color="var(--negative)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...styles.menuItemLabel, color: 'var(--negative)' }}>채팅방 나가기</div>
                      <div style={styles.menuItemSub}>채팅방에서 나가요</div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        <main ref={bodyRef as React.RefObject<HTMLElement>} style={styles.body}>
          {messages.map((message) => {
            if (message.type === 'announcement') {
              return (
                <div key={message.id} style={styles.announcementWrap}>
                  <div style={styles.announcement}>
                    <Zap size={13} fill="currentColor" strokeWidth={1.8} />
                    {message.text}
                  </div>
                </div>
              )
            }

            if (message.type === 'join') {
              return (
                <div key={message.id} style={styles.joinMessage}>
                  {message.text}
                </div>
              )
            }

            if (message.type === 'incoming') {
              return (
                <div key={message.id} style={styles.incomingRow}>
                  <div
                    style={{
                      ...styles.avatar,
                      background: message.avatar?.background,
                      color: message.avatar?.color,
                    }}
                  >
                    {message.avatar?.label}
                  </div>
                  <div style={{ maxWidth: '78%' }}>
                    {message.author ? <div style={styles.author}>{message.author}</div> : null}
                    <div style={styles.incomingBubble}>{message.text}</div>
                  </div>
                </div>
              )
            }

            return (
              <div key={message.id} style={styles.outgoingRow}>
                <div style={styles.outgoingBubble}>{message.text}</div>
              </div>
            )
          })}

          {messages.length === 0 && (
            <div style={styles.empty}>아직 메시지가 없어요. 먼저 인사해보세요 👋</div>
          )}
        </main>

        {translateOn && (
          <div style={styles.translateBanner}>
            <Languages size={14} color="var(--primary)" />
            <span>메시지를 한국어로 번역 중이에요</span>
            <button style={styles.translateClose} onClick={() => setTranslateOn(false)}>끄기</button>
          </div>
        )}
        <footer style={styles.footer}>
          <button style={styles.footerIconButton}>
            <Plus size={22} />
          </button>
          <div style={styles.inputWrap}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleSend() }
              }}
              placeholder="메시지 입력"
              style={styles.input}
            />
            <button
              style={{ ...styles.translateBtn, color: translateOn ? 'var(--primary)' : 'var(--text-placeholder)', background: translateOn ? 'var(--primary-tint)' : 'transparent' }}
              onClick={() => setTranslateOn((v) => !v)}
              title="번역 켜기/끄기"
            >
              <Languages size={17} />
            </button>
          </div>
          <button style={styles.sendButton} onClick={handleSend} disabled={!draft.trim()}>
            <SendHorizonal size={24} fill="currentColor" strokeWidth={2} />
          </button>
        </footer>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: 'var(--wds-fill)' },
  shell: {
    minHeight: '100dvh',
    maxWidth: 430,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--wds-fill)',
  },
  header: {
    height: 58,
    background: '#fff',
    borderBottom: '1px solid var(--wds-line)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,.04)',
  },
  iconButton: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-normal)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-normal)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    marginTop: 1,
    fontSize: 11.5,
    color: 'var(--text-assistive)',
  },
  countPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    borderRadius: 999,
    background: 'var(--primary-tint)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--primary)',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  announcementWrap: { display: 'flex', justifyContent: 'center', margin: '4px 0' },
  announcement: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 14px',
    borderRadius: 999,
    background: 'var(--primary-tint)',
    color: 'var(--primary)',
    fontSize: 12,
    fontWeight: 600,
  },
  joinMessage: {
    alignSelf: 'center',
    fontSize: 11.5,
    color: 'var(--text-assistive)',
    margin: '2px 0',
  },
  incomingRow: {
    alignSelf: 'flex-start',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  outgoingRow: { alignSelf: 'flex-end', maxWidth: '78%' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  author: {
    marginBottom: 4,
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-assistive)',
  },
  incomingBubble: {
    padding: '10px 13px',
    borderRadius: '4px 16px 16px 16px',
    background: '#fff',
    color: 'var(--text-normal)',
    fontSize: 14,
    lineHeight: 1.5,
    boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  },
  outgoingBubble: {
    padding: '10px 13px',
    borderRadius: '16px 4px 16px 16px',
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 14,
    lineHeight: 1.5,
  },
  footer: {
    background: '#fff',
    borderTop: '1px solid var(--wds-line)',
    padding: '10px 14px 10px',
    paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  footerIconButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--text-assistive)',
    width: 22,
    height: 22,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: 'pointer',
    flexShrink: 0,
  },
  inputWrap: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    background: 'var(--wds-fill-alt)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px 0 14px',
    gap: 4,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'var(--text-normal)',
    fontSize: 13.5,
  },
  translateBtn: {
    width: 28, height: 28, borderRadius: 8, border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'all 150ms ease',
  },
  translateBanner: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
    background: 'var(--primary-tint)', fontSize: 12.5, color: 'var(--primary)', fontWeight: 500,
    borderTop: '1px solid rgba(22,169,196,.15)',
  },
  translateClose: {
    marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: 'var(--primary)',
    background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 0',
  },
  sendButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--primary)',
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: 'pointer',
    flexShrink: 0,
    opacity: 1,
  },
  empty: {
    alignSelf: 'center',
    marginTop: 60,
    fontSize: 13,
    color: 'var(--text-assistive)',
  },
  menuBackdrop: { position: 'fixed', inset: 0, background: 'rgba(20,22,28,.4)', zIndex: 40 },
  menuSheet: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: '#fff', borderRadius: '22px 22px 0 0', zIndex: 50, paddingBottom: 'max(16px, env(safe-area-inset-bottom))', maxHeight: '85dvh', overflowY: 'auto' },
  menuHandle: { width: 40, height: 4, borderRadius: 999, background: '#D8DAE0', margin: '12px auto 0' },
  menuHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 14px', borderBottom: '1px solid var(--wds-line)' },
  menuHeaderTile: { width: 44, height: 44, borderRadius: 12, background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 },
  menuHeaderTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text-normal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  menuHeaderMeta: { fontSize: 11.5, color: 'var(--text-assistive)', marginTop: 2 },
  menuItems: { display: 'flex', flexDirection: 'column', padding: '8px 16px 8px', gap: 2 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 13, padding: '13px 14px', borderRadius: 14, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' },
  menuItemDanger: { background: 'rgba(255,66,66,.04)' },
  menuItemIcon: { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  menuItemLabel: { fontSize: 14, fontWeight: 700, color: 'var(--text-normal)' },
  menuItemSub: { fontSize: 12, color: 'var(--text-assistive)', marginTop: 2 },
  menuDivider: { height: 1, background: 'var(--wds-line)', margin: '4px 0' },
  toggle: { width: 42, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 200ms ease', flexShrink: 0, padding: 0 },
  toggleKnob: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: 999, background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,.2)', transition: 'transform 200ms ease' },
}



