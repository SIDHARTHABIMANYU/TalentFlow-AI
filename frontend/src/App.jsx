import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import CandidateDetail from './pages/CandidateDetail'
import Jobs from './pages/Jobs'
import EmailLogs from './pages/EmailLogs'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-blue-800 text-white px-6 py-4 flex gap-6">
          <span className="font-bold text-lg mr-4">🏢 Inceptrac HR</span>
          <Link to="/" className="hover:text-blue-200">Dashboard</Link>
          <Link to="/candidates" className="hover:text-blue-200">Candidates</Link>
          <Link to="/jobs" className="hover:text-blue-200">Jobs</Link>
          <Link to="/logs" className="hover:text-blue-200">Email Logs</Link>
        </nav>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/logs" element={<EmailLogs />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App