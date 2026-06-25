import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus, SendHorizonal, Users, Zap } from 'lucide-react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

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
  { bg: '#D7E4FF', color: '#0066FF' },
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

  const stompRef = useRef<Client | null>(null)
  const avatarMap = useRef(new Map<number, ReturnType<typeof makeAvatar>>())
  const bodyRef = useRef<HTMLElement | null>(null)

  // 내 userId 조회
  useEffect(() => {
    fetch('/api/members/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setMyId(data.id ?? null))
      .catch(() => {})
  }, [])

  // 모임 정보 조회 (제목, 인원)
  useEffect(() => {
    if (!mid) return
    fetch(`/api/meetups/${mid}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.title) setTitle(data.title)
        if (data.currentCount != null) setParticipants(data.currentCount)
      })
      .catch(() => {})
  }, [mid])

  // 이전 메시지 이력 조회
  useEffect(() => {
    if (!mid) return
    fetch(`/api/chat/${mid}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((list: ApiMessage[]) => {
        const am = avatarMap.current
        setMessages(list.map((m) => toDisplayMessage(m, myId, am)))
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
        </header>

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
  page: { minHeight: '100dvh', background: '#EFF2F6' },
  shell: {
    minHeight: '100dvh',
    maxWidth: 430,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    background: '#F3F5F8',
  },
  header: {
    height: 56,
    background: '#FFFFFF',
    borderBottom: '1px solid var(--wds-line)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 14px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
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
    fontWeight: 600,
    color: 'var(--text-normal)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11.5,
    color: 'var(--text-assistive)',
  },
  countPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    padding: '5px 9px',
    borderRadius: 999,
    background: 'var(--wds-fill-alt)',
    fontSize: 12,
    fontWeight: 600,
    color: '#3A3D46',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 11,
  },
  announcementWrap: { display: 'flex', justifyContent: 'center' },
  announcement: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 999,
    background: 'rgba(0,102,255,.08)',
    color: 'var(--primary)',
    fontSize: 11.5,
    fontWeight: 500,
  },
  joinMessage: {
    alignSelf: 'center',
    fontSize: 11.5,
    color: 'var(--text-assistive)',
  },
  incomingRow: {
    alignSelf: 'flex-start',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
  },
  outgoingRow: { alignSelf: 'flex-end', maxWidth: '78%' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  author: {
    marginBottom: 3,
    fontSize: 10.5,
    fontWeight: 500,
    color: 'var(--text-assistive)',
  },
  incomingBubble: {
    padding: '10px 13px',
    borderRadius: '4px 14px 14px 14px',
    background: '#FFFFFF',
    color: 'var(--text-normal)',
    fontSize: 13.5,
    lineHeight: 1.45,
    boxShadow: '0 1px 2px rgba(0,0,0,.05)',
  },
  outgoingBubble: {
    padding: '10px 13px',
    borderRadius: '14px 4px 14px 14px',
    background: 'var(--primary)',
    color: '#FFFFFF',
    fontSize: 13.5,
    lineHeight: 1.45,
  },
  footer: {
    background: '#FFFFFF',
    borderTop: '1px solid var(--wds-line)',
    padding: '10px 14px',
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
    padding: '0 14px',
  },
  input: {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'var(--text-normal)',
    fontSize: 13.5,
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
}
