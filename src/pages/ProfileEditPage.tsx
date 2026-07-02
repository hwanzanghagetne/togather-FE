import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, ChevronLeft } from 'lucide-react'
import { apiFetch } from '../api'

interface Me {
  id: number
  nickname: string
  email?: string
  country?: string
  language?: string
  bio?: string
  profileImageUrl?: string
}

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [me, setMe] = useState<Me | null>(null)
  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [nickFocused, setNickFocused] = useState(false)
  const [bioFocused, setBioFocused] = useState(false)

  useEffect(() => {
    apiFetch('/api/members/me')
      .then((r) => r.ok ? r.json() : null)
      .then((d: Me | null) => {
        if (!d) return
        setMe(d)
        setNickname(d.nickname ?? '')
        setBio(d.bio ?? '')
        setPhoto(d.profileImageUrl ?? null)
      })
      .catch(() => {})
  }, [])

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPhoto(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (saving || !nickname.trim()) return
    setSaving(true)
    try {
      await apiFetch('/api/members/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), bio: bio.trim() }),
      })
      navigate(-1)
    } finally {
      setSaving(false)
    }
  }

  const initial = nickname.charAt(0) || me?.email?.charAt(0) || '?'

  return (
    <div style={s.page}>
      <div style={s.shell}>
        {/* 헤더 */}
        <header style={s.header}>
          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </button>
          <span style={s.headerTitle}>프로필 편집</span>
          <button
            style={{ ...s.saveBtn, opacity: saving || !nickname.trim() ? 0.5 : 1 }}
            onClick={handleSave}
            disabled={saving || !nickname.trim()}
          >
            {saving ? '저장 중' : '저장'}
          </button>
        </header>

        <div style={s.scroll}>
          {/* 아바타 */}
          <div style={s.avatarSection}>
            <div style={{ position: 'relative', width: 96, height: 96 }}>
              <button style={s.avatarBtn} onClick={() => fileInputRef.current?.click()}>
                {photo ? (
                  <img src={photo} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: 'var(--primary)' }}>
                    {initial}
                  </div>
                )}
              </button>
              <button style={s.cameraBadge} onClick={() => fileInputRef.current?.click()}>
                <Camera size={16} color="#fff" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>
            <button style={s.changePhotoBtn} onClick={() => fileInputRef.current?.click()}>
              사진 변경
            </button>
          </div>

          {/* 폼 */}
          <div style={s.form}>
            {/* 이름 */}
            <div style={s.fieldGroup}>
              <label style={s.label}>이름 또는 닉네임</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onFocus={() => setNickFocused(true)}
                onBlur={() => setNickFocused(false)}
                placeholder="닉네임을 입력해요"
                style={{
                  ...s.input,
                  border: nickFocused ? '1.5px solid var(--primary)' : '1px solid var(--wds-line)',
                  boxShadow: nickFocused ? '0 0 0 4px rgba(22,169,196,.08)' : 'none',
                }}
              />
            </div>

            {/* 한 줄 소개 */}
            <div style={s.fieldGroup}>
              <label style={s.label}>한 줄 소개 <span style={s.optional}>(선택)</span></label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onFocus={() => setBioFocused(true)}
                onBlur={() => setBioFocused(false)}
                placeholder="어떤 여행자인지 소개해요"
                rows={3}
                style={{
                  ...s.textarea,
                  border: bioFocused ? '1.5px solid var(--primary)' : '1px solid var(--wds-line)',
                  boxShadow: bioFocused ? '0 0 0 4px rgba(22,169,196,.08)' : 'none',
                }}
              />
              <div style={s.charCount}>{bio.length}/60</div>
            </div>

            {/* 국적 (읽기 전용) */}
            {me?.country && (
              <div style={s.fieldGroup}>
                <label style={s.label}>국적</label>
                <div style={s.readonlyField}>
                  <span>{me.country}</span>
                  <span style={s.readonlyNote}>변경하려면 고객센터 문의</span>
                </div>
              </div>
            )}

            {/* 언어 (읽기 전용) */}
            {me?.language && (
              <div style={s.fieldGroup}>
                <label style={s.label}>주요 언어</label>
                <div style={s.readonlyField}>
                  <span>{me.language}</span>
                </div>
              </div>
            )}

            {/* 이메일 (읽기 전용) */}
            {me?.email && (
              <div style={s.fieldGroup}>
                <label style={s.label}>이메일</label>
                <div style={s.readonlyField}>
                  <span>{me.email}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 하단 저장 버튼 */}
        <div style={s.footer}>
          <button
            style={{ ...s.primaryBtn, opacity: saving || !nickname.trim() ? 0.5 : 1 }}
            onClick={handleSave}
            disabled={saving || !nickname.trim()}
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100dvh', background: 'var(--wds-fill)' },
  shell: { minHeight: '100dvh', maxWidth: 430, margin: '0 auto', background: '#fff', display: 'flex', flexDirection: 'column' },

  header: { height: 54, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid var(--wds-line)', position: 'sticky', top: 0, background: '#fff', zIndex: 10, flexShrink: 0 },
  backBtn: { border: 'none', background: 'transparent', padding: 0, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-normal)', cursor: 'pointer', marginRight: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--text-normal)', textAlign: 'center' },
  saveBtn: { fontSize: 14, fontWeight: 700, color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 4px' },

  scroll: { flex: 1, overflowY: 'auto', paddingBottom: 32 },

  avatarSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0 24px', borderBottom: '1px solid var(--wds-line)' },
  avatarBtn: { width: 96, height: 96, borderRadius: 999, border: 'none', overflow: 'hidden', cursor: 'pointer', padding: 0, background: 'var(--primary-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 32, height: 32, borderRadius: 999, background: 'var(--primary)', border: '3px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  changePhotoBtn: { marginTop: 12, fontSize: 13.5, fontWeight: 600, color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 0' },

  form: { padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 22 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' },
  optional: { fontWeight: 400, color: 'var(--text-assistive)' },
  input: { width: '100%', height: 50, borderRadius: 12, padding: '0 14px', fontSize: 16, color: 'var(--text-normal)', outline: 'none', background: '#fff', boxSizing: 'border-box', transition: 'border 150ms ease, box-shadow 150ms ease' },
  textarea: { width: '100%', borderRadius: 12, padding: '12px 14px', fontSize: 16, color: 'var(--text-normal)', outline: 'none', background: '#fff', boxSizing: 'border-box', resize: 'none', lineHeight: 1.6, transition: 'border 150ms ease, box-shadow 150ms ease' },
  charCount: { fontSize: 11, color: 'var(--text-assistive)', textAlign: 'right', marginTop: -4 },
  readonlyField: { height: 50, borderRadius: 12, border: '1px solid var(--wds-line)', background: 'var(--wds-fill)', padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15, color: 'var(--text-secondary)' },
  readonlyNote: { fontSize: 11.5, color: 'var(--text-assistive)' },

  footer: { padding: '12px 20px 36px', borderTop: '1px solid var(--wds-line)', background: '#fff', flexShrink: 0 },
  primaryBtn: { width: '100%', height: 50, borderRadius: 13, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'opacity 150ms ease' },
}
