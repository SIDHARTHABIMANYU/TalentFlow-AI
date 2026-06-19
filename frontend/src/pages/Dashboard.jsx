import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { C, MONO, statusMeta, scoreTier, initials } from '../theme'

const API = 'https://recruitment.inceptarc.com'

export default function Dashboard() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get('/api/v1/candidates/', { headers: { Authorization: `Bearer ${token}` } })
      setCandidates(res.data || [])
    } catch (err) { console.error(err) }
    try {
      const jr = await axios.get(`${API}/api/api/v1/jobs/`)
      setJobs(jr.data || [])
    } catch (err) { /* optional */ }
  }

  const norm = (c) => {
    const l = statusMeta(c.status).label
    return l === 'Shortlisted' ? 'shortlist' : l === 'Rejected' ? 'reject' : l === 'In Review' ? 'review' : 'new'
  }

  const counts = useMemo(() => {
    const m = { total: candidates.length, shortlist: 0, review: 0, reject: 0, new: 0 }
    candidates.forEach(c => m[norm(c)]++)
    return m
  }, [candidates])

  const recent = useMemo(() =>
    [...candidates].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 5)
  , [candidates])

  const total = counts.total || 1
  const stats = [
    { label: 'TOTAL APPLICANTS', value: counts.total, sub: `across ${jobs.length || '—'} open roles`, dot: C.ink },
    { label: 'SHORTLISTED', value: counts.shortlist, sub: 'interview invites sent', dot: C.greenDot },
    { label: 'IN REVIEW', value: counts.review, sub: 'awaiting decision', dot: C.amberDot },
    { label: 'REJECTED', value: counts.reject, sub: 'this cycle', dot: C.redDot },
  ]
  const pipeline = [
    { label: 'New', value: counts.new, color: C.blueDot },
    { label: 'In Review', value: counts.review, color: C.amberDot },
    { label: 'Shortlisted', value: counts.shortlist, color: C.greenDot },
    { label: 'Rejected', value: counts.reject, color: C.redDot },
  ]
  const maxApp = Math.max(1, ...jobs.map(j => candidates.filter(c => String(c.job_id) === String(j.id)).length))

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '26px 28px 40px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
        {stats.map(s => (
          <div key={s.label} style={card()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: s.dot }} />
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em', color: C.muted2 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 10, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ ...card('20px 22px'), marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Hiring pipeline</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted2 }}>{counts.total} candidates</span>
        </div>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
          {pipeline.map(p => <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
        </div>
        <div style={{ display: 'flex', gap: 22, marginTop: 14, flexWrap: 'wrap' }}>
          {pipeline.map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color }} />
              <span style={{ fontSize: 12.5, color: '#55555C', fontWeight: 500 }}>{p.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600 }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        <div style={card('20px 22px')}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Recent applicants</span>
            <button onClick={() => navigate('/candidates')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11, color: C.accent, fontWeight: 600 }}>VIEW ALL →</button>
          </div>
          {recent.length === 0 && <div style={{ padding: '24px 0', color: C.muted2, fontSize: 13 }}>No applicants yet.</div>}
          {recent.map(c => {
            const st = statusMeta(c.status)
            const job = jobs.find(j => String(j.id) === String(c.job_id))
            return (
              <div key={c.id} onClick={() => navigate('/candidates')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: `1px solid ${C.rowLine}`, cursor: 'pointer' }}>
                <div style={avatar()}>{initials(c.full_name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.full_name || 'Unknown'}</div>
                  <div style={{ fontSize: 11.5, color: C.muted2 }}>{job?.title || c.email}</div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: scoreTier(c.match_score) }}>{Number(c.match_score) || 0}%</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
              </div>
            )
          })}
        </div>
        <div style={card('20px 22px')}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Open roles</div>
          {jobs.length === 0 && <div style={{ padding: '24px 0', color: C.muted2, fontSize: 13 }}>No open roles configured yet.</div>}
          {jobs.map(j => {
            const count = candidates.filter(c => String(c.job_id) === String(j.id)).length
            return (
              <div key={j.id} style={{ padding: '11px 0', borderBottom: `1px solid ${C.rowLine}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{j.title}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: '#55555C' }}>{count}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: '#A7A7AC', margin: '4px 0 8px' }}>{j.department || 'General'}</div>
                <div style={{ height: 5, borderRadius: 4, background: '#EFEFEC', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxApp) * 100}%`, background: C.accent, borderRadius: 4 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const card = (pad = '18px 18px 16px') => ({ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: pad })
const avatar = () => ({ width: 34, height: 34, borderRadius: '50%', background: C.accentSoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 })
