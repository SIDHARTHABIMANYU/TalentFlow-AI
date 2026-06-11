import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import CandidateDetail from './pages/CandidateDetail'
import Jobs from './pages/Jobs'
import EmailLogs from './pages/EmailLogs'
import Login from './pages/Login'

const GOOGLE_CLIENT_ID = "102611444878-lvu392o0uokl221g7g3f222k28qdr707.apps.googleusercontent.com"  

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  const handleLogin = () => {
    setToken(localStorage.getItem('token'))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_name')
    setToken(null)
  }

  if (!token) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Login onLogin={handleLogin} />
      </GoogleOAuthProvider>
    )
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <nav className="bg-blue-800 text-white px-6 py-4 flex gap-6 items-center">
            <span className="font-bold text-lg mr-4">🏢 Inceptarc Technologies</span>
            <Link to="/" className="hover:text-blue-200">Dashboard</Link>
            <Link to="/candidates" className="hover:text-blue-200">Candidates</Link>
            <Link to="/jobs" className="hover:text-blue-200">Jobs</Link>
            <Link to="/logs" className="hover:text-blue-200">Email Logs</Link>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-blue-200">
                {localStorage.getItem('user_name')}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
              >
                Logout
              </button>
            </div>
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
    </GoogleOAuthProvider>
  )
}

export default App
