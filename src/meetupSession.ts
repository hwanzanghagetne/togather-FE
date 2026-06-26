const JOINED_MEETUPS_STORAGE_KEY = 'togather-joined-meetups'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readJoinedMeetupIds() {
  if (!canUseStorage()) return [] as number[]

  try {
    const raw = window.localStorage.getItem(JOINED_MEETUPS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
  } catch {
    return []
  }
}

function writeJoinedMeetupIds(ids: number[]) {
  if (!canUseStorage()) return
  window.localStorage.setItem(JOINED_MEETUPS_STORAGE_KEY, JSON.stringify([...new Set(ids)]))
}

export function markJoinedMeetup(id: number) {
  const ids = readJoinedMeetupIds()
  writeJoinedMeetupIds([...ids, id])
}

export function markLeftMeetup(id: number) {
  writeJoinedMeetupIds(readJoinedMeetupIds().filter((meetupId) => meetupId !== id))
}

export function isJoinedMeetup(id: number) {
  return readJoinedMeetupIds().includes(id)
}

export function clearJoinedMeetups() {
  writeJoinedMeetupIds([])
}
