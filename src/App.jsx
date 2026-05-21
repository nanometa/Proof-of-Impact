import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import TaskPage from './pages/TaskPage'
import CreateTaskPage from './pages/CreateTaskPage'
import SubmitWorkPage from './pages/SubmitWorkPage'
import SubmissionPage from './pages/SubmissionPage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<HomePage />} />
        <Route path="/task/:taskId" element={<TaskPage />} />
        <Route path="/create" element={<CreateTaskPage />} />
        <Route path="/task/:taskId/submit" element={<SubmitWorkPage />} />
        <Route path="/submission/:subId" element={<SubmissionPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
      </Route>
    </Routes>
  )
}
