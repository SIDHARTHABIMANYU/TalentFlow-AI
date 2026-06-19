import { BrowserRouter as Router, Routes, Route, NavLink, Outlet, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import CandidateDetail from './pages/CandidateDetail'
import Jobs from './pages/Jobs'
import EmailLogs from './pages/EmailLogs'
import Login from './pages/Login'
import { C, FONT, MONO, initials } from './theme'

const GOOGLE_CLIENT_ID = "102611444878-lvu392o0uokl221g7g3f222k28qdr707.apps.googleusercontent.com"

const NAV = [
  { to: '/', index: '01', label: 'Dashboard', end: true },
  { to: '/candidates', index: '02', label: 'Candidates' },
  { to: '/jobs', index: '03', label: 'Open Roles' },
  { to: '/logs', index: '04', label: 'Email Logs' },
]

const META = {
  '/': { marker: '§ OVERVIEW / 01', title: 'Dashboard' },
  '/candidates': { marker: '§ PIPELINE / 02', title: 'Candidate Review' },
  '/jobs': { marker: '§ REQUISITIONS / 03', title: 'Open Roles' },
  '/logs': { marker: '§ COMMS / 04', title: 'Email Logs' },
}

function Layout({ onLogout }) {
  const { pathname } = useLocation()
  const key = pathname.startsWith('/candidates') ? '/candidates'
    : pathname.startsWith('/jobs') ? '/jobs'
    : pathname.startsWith('/logs') ? '/logs' : '/'
  const meta = META[key]
  const userName = localStorage.getItem('user_name') || 'Team Member'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).replace(',', ' ·')

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', minWidth: 1280, overflow: 'hidden', fontFamily: FONT, color: C.text, background: C.bg }}>
      <aside style={{ width: 250, flexShrink: 0, background: C.ink, color: '#fff', display: 'flex', flexDirection: 'column', padding: '22px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px 22px' }}>
          <div style={{ position: 'relative', width: 30, height: 30, flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 19, height: 19, border: '1.4px solid rgba(255,255,255,0.55)', borderRadius: 6 }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: 19, height: 19, background: C.accent, borderRadius: 6 }} />
          </div>
          <div style={{ lineHeight: 1.05 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>Inceptarc</div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.42)', marginTop: 2 }}>RECRUITMENT</div>
          </div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.34)', padding: '6px 10px 8px' }}>NAVIGATION</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 9,
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
              background: isActive ? C.accent : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.78)',
            })}>
              {({ isActive }) => (<>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 500, color: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.34)' }}>{n.index}</span>
                <span>{n.label}</span>
              </>)}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: '14px 12px 6px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)' }}>PIPELINE ONLINE</span>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: 'rgba(255,255,255,0.28)', marginTop: 7, paddingLeft: 15 }}>v2.4 · recruitment.inceptarc.com</div>
        </div>
      </aside>
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ flexShrink: 0, height: 64, background: C.card, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: C.muted3 }}>{meta.marker}</span>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{meta.title}</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: '#B0B0B5' }}>{today}</span>
            <div style={{ width: 1, height: 26, background: C.border }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div>
                <div style={{ fontSize: 11, color: C.muted2 }}>Talent Operations</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.accentSoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{initials(userName)}</div>
              <button onClick={onLogout} title="Sign out" style={{ marginLeft: 4, border: `1px solid ${C.border}`, background: '#fff', color: C.muted, cursor: 'pointer', padding: '7px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: FONT }}>Sign out</button>
            </div>
          </div>
        </header>
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const handleLogin = () => setToken(localStorage.getItem('token'))
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
        <Routes>
          <Route element={<Layout onLogout={handleLogout} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/candidates/:id" element={<CandidateDetail />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/logs" element={<EmailLogs />} />
          </Route>
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  )
}

export default App
