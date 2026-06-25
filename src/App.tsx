import { Routes, Route, useLocation } from 'react-router-dom'
import OnboardingFlow from './pages/onboarding/OnboardingFlow'
import HomePage from './pages/HomePage'
import MeetupListPage from './pages/MeetupListPage'
import CreateMeetupPage from './pages/CreateMeetupPage'
import MeetupPostedPage from './pages/MeetupPostedPage'
import ChatRoomPage from './pages/ChatRoomPage'
import ArrivePage from './pages/ArrivePage'
import ReviewPage from './pages/ReviewPage'
import TabLayout from './components/TabLayout'

// 하단 탭이 표시되는 경로
const TAB_PATHS = ['/home', '/meetups', '/chats', '/my']

export default function App() {
  const location = useLocation()
  const showTabs = TAB_PATHS.some((p) => location.pathname === p)

  return showTabs ? (
    <TabLayout>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/meetups" element={<MeetupListPage />} />
        <Route path="/chats" element={<div style={{ padding: 24, color: '#9A9DA6' }}>채팅 목록 (준비 중)</div>} />
        <Route path="/my" element={<div style={{ padding: 24, color: '#9A9DA6' }}>MY 페이지 (준비 중)</div>} />
      </Routes>
    </TabLayout>
  ) : (
    <Routes>
      <Route path="/" element={<OnboardingFlow />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />
      <Route path="/meetups/new" element={<CreateMeetupPage />} />
      <Route path="/meetups/:id/posted" element={<MeetupPostedPage />} />
      <Route path="/chat/:meetupId" element={<ChatRoomPage />} />
      <Route path="/meetups/:id/arrive" element={<ArrivePage />} />
      <Route path="/meetups/:id/review" element={<ReviewPage />} />
    </Routes>
  )
}
