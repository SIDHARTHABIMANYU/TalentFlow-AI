import { useState, useEffect } from 'react'
import axios from 'axios'
import { C, MONO, fmtDate } from '../theme'

const API = 'https://recruitment.inceptarc.com'

function logType(status) {
  const s = String(status || '').toLowerCase()
  if (['shortlist', 'shortlisted', 'approved'].includes(s)) return 'Interview Invite'
  if (['reject', 'rejected'].includes(s)) return 'Rejection'
  return 'Acknowledgement'
}

export default function EmailLogs() {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    axios.get(`${API}/api/v1/candidates/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setCandidates(res.data || []); setLoading(false) })
      .catch(err => { console.error('Error fetching logs:', err); setLoading(false) })
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', overflowY: 'auto', padding: '26px 28px 40px' }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 22px', background: C.field, borderBottom: `1px solid ${C.borderSoft}`, fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: C.muted3 }}>
          <span style={{ flex: 2 }}>RECIPIENT</span>
          <span style={{ flex: 3 }}>SUBJECT</span>
          <span style={{ width: 130 }}>TYPE</span>
          <span style={{ width: 100 }}>STATUS</span>
          <span style={{ width: 110 }}>SENT</span>
        </div>
        {loading && <div style={{ padding: 24, color: C.muted2 }}>Loading…</div>}
        {!loading && candidates.length === 0 && <div style={{ padding: 24, color: C.muted2 }}>No email logs found.</div>}
        {candidates.map(c => {
          const type = logType(c.status)
          const deliv = c.email_status || 'Delivered'
          const subject = c.email_subject || `${type} — ${c.full_name || 'Candidate'}`
          const ls = String(deliv).toLowerCase() === 'bounced'
            ? { color: C.red, bg: C.redBg }
            : String(deliv).toLowerCase() === 'opened'
            ? { color: C.green, bg: C.greenBg }
            : { color: C.blue, bg: C.blueBg }
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 22px', borderBottom: `1px solid ${C.rowLine}` }}>
              <div style={{ flex: 2, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name || 'Unknown'}</div>
                <div style={{ fontSize: 11.5, color: C.muted2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.sender_email || c.email}</div>
              </div>
              <span style={{ flex: 3, fontSize: 13, color: C.text2, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subject}</span>
              <span style={{ width: 130, fontSize: 12, color: '#77777E' }}>{type}</span>
              <span style={{ width: 100 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ls.bg, color: ls.color }}>{deliv}</span>
              </span>
              <span style={{ width: 110, fontFamily: MONO, fontSize: 11, color: C.muted2 }}>{fmtDate(c.created_at)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
