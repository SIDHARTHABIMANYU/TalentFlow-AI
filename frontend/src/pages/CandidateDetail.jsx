import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { C, FONT, MONO, statusMeta, scoreTier, initials, parseSkills } from '../theme'

const API = 'https://recruitment.inceptarc.com'

export default function CandidateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)

  useEffect(() => { fetchCandidate() }, [])

  const fetchCandidate = async () => {
    try {
      const res = await axios.get(`${API}/api/api/v1/candidates/${id}`)
      setCandidate(res.data)
    } catch (err) { console.error(err) }
  }

  const decide = async (action, message) => {
    try {
      await axios.post(`${API}/api/api/v1/webhook/telegram`, { callback_query: { data: `${action}_${id}`, from: { id: 1334029468 } } })
      alert(message)
      navigate('/candidates')
    } catch (err) { console.error(err) }
  }

  if (!candidate) {
    return <div style={{ width: '100%', padding: 40, color: C.muted2, fontFamily: FONT }}>Loading…</div>
  }

  const st = statusMeta(candidate.status)
  const tier = scoreTier(candidate.match_score)
  const skills = parseSkills(candidate.skills)
  const profile = [
    ['Email', candidate.email || '—'],
    ['Phone', candidate.phone || '—'],
    ['Experience', candidate.experience_years != null ? `${candidate.experience_years} years` : '—'],
    ['Education', candidate.education || '—'],
  ]

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '26px 28px 40px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <button onClick={() => navigate('/candidates')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11, color: C.accent, fontWeight: 600, marginBottom: 14, padding: 0 }}>← BACK TO CANDIDATES</button>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
          {/* header */}
          <div style={{ padding: '26px 28px', borderBottom: `1px solid ${C.borderSoft}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: C.accentSoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 21, flexShrink: 0 }}>{initials(candidate.full_name)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.01em' }}>{candidate.full_name || 'Unknown Candidate'}</div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted3, marginTop: 3 }}>#{String(candidate.id).padStart(4, '0')}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <Stat label="AI MATCH" value={`${Number(candidate.match_score) || 0}%`} color={tier} />
              <Stat label="EXPERIENCE" value={<>{candidate.experience_years ?? '—'}<span style={{ fontSize: 14, color: C.muted2, fontWeight: 600 }}> yr</span></>} />
              <Stat label="SKILLS" value={skills.length} />
            </div>
          </div>

          <div style={{ padding: '24px 28px' }}>
            <Label>SKILLS</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
              {skills.length === 0 && <span style={{ fontSize: 13, color: C.muted2 }}>No skills listed.</span>}
              {skills.map((s, i) => (
                <span key={i} style={{ fontSize: 12.5, fontWeight: 500, padding: '5px 11px', borderRadius: 7, background: C.accentSoft, color: C.accent, border: `1px solid ${C.accentBorder}`, whiteSpace: 'nowrap' }}>{s}</span>
              ))}
            </div>

            <Label>PROFILE</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.borderSoft, border: `1px solid ${C.borderSoft}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24 }}>
              {profile.map(([k, v]) => (
                <div key={k} style={{ background: '#fff', padding: '13px 16px' }}>
                  <div style={{ fontSize: 11, color: C.muted3, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#2A2A30', wordBreak: 'break-word' }}>{v}</div>
                </div>
              ))}
            </div>

            <Label>RESUME TEXT</Label>
            <div style={{ background: C.field, border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: '16px 18px', fontSize: 13.5, lineHeight: 1.65, color: C.text2, marginBottom: 26, maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {candidate.resume_text || 'No resume text available.'}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => decide('reject', 'Candidate rejected. Rejection email sent.')} style={{ flex: 1, border: `1px solid ${C.redBorder}`, background: '#fff', color: C.redSoft, cursor: 'pointer', padding: 13, borderRadius: 10, fontSize: 14.5, fontWeight: 700, fontFamily: FONT }}>Reject — Send rejection email</button>
              <button onClick={() => decide('approve', 'Candidate approved. Interview invite sent.')} style={{ flex: 1.4, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', padding: 13, borderRadius: 10, fontSize: 14.5, fontWeight: 700, fontFamily: FONT }}>Shortlist — Send interview invite</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: C.field, border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: '13px 15px' }}>
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.12em', color: C.muted3 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || C.text, marginTop: 4 }}>{value}</div>
    </div>
  )
}

function Label({ children }) {
  return <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: C.muted2, marginBottom: 11 }}>{children}</div>
}
