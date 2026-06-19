import { useState, useEffect } from 'react'
import { C, FONT, MONO, parseSkills } from '../theme'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ title: '', department: '', required_skills: '', min_experience_years: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => { fetchJobs() }, [])

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/jobs/', { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`${res.status}`)
      setJobs(await res.json())
      setError(null)
    } catch (e) { setError('Failed to load jobs: ' + e.message) }
    setLoading(false)
  }

  const handleCreate = async () => {
    if (!form.title || !form.required_skills) return alert('Title and skills are required')
    setBusy(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/v1/jobs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, min_experience_years: Number(form.min_experience_years) || 0 })
      })
      if (!res.ok) throw new Error(`${res.status}`)
      setForm({ title: '', department: '', required_skills: '', min_experience_years: '' })
      fetchJobs()
    } catch (e) { alert('Failed to create job: ' + e.message) }
    setBusy(false)
  }

  const handleClose = async (id) => {
    if (!confirm('Close this role?')) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/v1/jobs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      fetchJobs()
    } catch (e) { alert('Failed to close role') }
  }

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '26px 28px 40px' }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '22px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Open a new role</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <input placeholder="Job title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            style={inp()} />
          <input placeholder="Department" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            style={inp()} />
        </div>
        <input placeholder="Required skills * (comma separated)" value={form.required_skills} onChange={e => setForm(p => ({ ...p, required_skills: e.target.value }))}
          style={{ ...inp(), width: '100%', marginBottom: 10, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input placeholder="Min experience (years)" value={form.min_experience_years} onChange={e => setForm(p => ({ ...p, min_experience_years: e.target.value }))}
            style={{ ...inp(), width: 220 }} />
          <button onClick={handleCreate} disabled={busy}
            style={{ border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', padding: '10px 20px', borderRadius: 9, fontSize: 13.5, fontWeight: 700, fontFamily: FONT }}>
            + Create role
          </button>
        </div>
      </div>

      {loading && <div style={{ color: C.muted2 }}>Loading…</div>}
      {error && <div style={{ color: C.red, fontSize: 13 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {jobs.map(j => {
          const skills = parseSkills(j.required_skills)
          return (
            <div key={j.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{j.title}</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: C.muted3, letterSpacing: '0.1em', marginTop: 3 }}>
                    {j.department || 'General'}
                  </div>
                </div>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, background: C.accentSoft, color: C.accent, padding: '3px 10px', borderRadius: 20 }}>
                  {j.applicant_count || 0} applied
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '14px 0' }}>
                {skills.map((s, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 6, background: C.field, border: `1px solid ${C.borderSoft}`, color: C.text2 }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 12.5, color: C.muted2 }}>Min experience: <strong>{j.min_experience_years || 0} yrs</strong></span>
                <button onClick={() => handleClose(j.id)}
                  style={{ border: `1px solid ${C.border}`, background: '#fff', color: C.muted, cursor: 'pointer', padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: FONT }}>
                  Close role
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const inp = () => ({ padding: '10px 13px', border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13.5, fontFamily: FONT, background: C.field, outline: 'none', width: '100%' })
