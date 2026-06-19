import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, FONT, MONO, statusMeta, scoreTier, initials, parseSkills, fmtDate } from '../theme'
import { getCandidates, getJobs, moveToStage, bulkMove } from '../api'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'review', label: 'In Review' },
  { key: 'shortlist', label: 'Shortlisted' },
  { key: 'reject', label: 'Rejected' },
]

const STAGES = [
  { key: 'new', label: 'New', color: C.blueDot, bg: C.blueBg },
  { key: 'review', label: 'In Review', color: C.amberDot, bg: C.amberBg },
  { key: 'shortlist', label: 'Shortlisted', color: C.greenDot, bg: C.greenBg },
  { key: 'reject', label: 'Rejected', color: C.redDot, bg: C.redBg },
]

const normOf = (status) => {
  const l = statusMeta(status).label
  return l === 'Shortlisted' ? 'shortlist' : l === 'Rejected' ? 'reject' : l === 'In Review' ? 'review' : 'new'
}

export default function Candidates() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')          // 'list' | 'board'
  const [selectedId, setSelectedId] = useState(null)
  const [checked, setChecked] = useState({})
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('score')
  const [busy, setBusy] = useState(false)
  const [dragId, setDragId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const data = await getCandidates()
      setCandidates(data)
      if (!selectedId && data.length) setSelectedId(data[0].id)
    } catch (err) { console.error(err) }
    try { setJobs(await getJobs()) } catch (err) { /* skills-vs-requirements is optional */ }
    setLoading(false)
  }

  const matchOf = (c) => {
    const job = jobs.find(j => String(j.id) === String(c.job_id))
    const req = parseSkills(job?.required_skills)
    const cs = parseSkills(c.skills)
    const csLower = cs.map(x => x.toLowerCase())
    const matched = req.filter(r => csLower.includes(r.toLowerCase()))
    const pct = req.length ? Math.round((matched.length / req.length) * 100) : null
    return { job, req, cs, matched, pct }
  }

  // search + sort (status filter applied later, list view only)
  const base = useMemo(() => {
    let list = candidates.map(c => ({ c, m: matchOf(c), st: statusMeta(c.status), norm: normOf(c.status), score: Number(c.match_score) || 0 }))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => (r.c.full_name || '').toLowerCase().includes(q) || (r.c.email || '').toLowerCase().includes(q) || (r.m.job?.title || '').toLowerCase().includes(q))
    }
    list.sort((a, b) => sortBy === 'name' ? (a.c.full_name || '').localeCompare(b.c.full_name || '')
      : sortBy === 'date' ? new Date(b.c.created_at || 0) - new Date(a.c.created_at || 0)
      : b.score - a.score)
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, jobs, search, sortBy])

  const listRows = useMemo(() => filter === 'all' ? base : base.filter(r => r.norm === filter), [base, filter])

  const tabCounts = useMemo(() => {
    const m = { all: candidates.length, new: 0, review: 0, shortlist: 0, reject: 0 }
    candidates.forEach(c => m[normOf(c.status)]++)
    return m
  }, [candidates])

  const visibleIds = listRows.map(r => r.c.id)
  const allChecked = visibleIds.length > 0 && visibleIds.every(id => checked[id])
  const checkedIds = Object.keys(checked).filter(id => checked[id])

  const toggleCheck = (id) => setChecked(p => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = true; return n })
  const toggleAll = () => setChecked(p => {
    const all = visibleIds.length && visibleIds.every(id => p[id])
    const n = { ...p }
    if (all) visibleIds.forEach(id => delete n[id]); else visibleIds.forEach(id => n[id] = true)
    return n
  })

  // optimistic stage move (single)
  const move = async (id, stage) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: stage } : c))
    try { await moveToStage(id, stage) } catch (err) { console.error(err) }
  }

  const bulk = async (stage) => {
    if (!checkedIds.length) return
    setBusy(true)
    setCandidates(prev => prev.map(c => checked[c.id] ? { ...c, status: stage } : c))
    const ids = [...checkedIds]
    setChecked({})
    await bulkMove(ids, stage)
    setBusy(false)
  }

  const onDrop = (stage) => {
    setOverCol(null)
    if (dragId == null) return
    const cur = candidates.find(c => c.id === dragId)
    if (cur && normOf(cur.status) !== stage) move(dragId, stage)
    setDragId(null)
  }

  const selected = candidates.find(c => c.id === selectedId)

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

      {/* control bar */}
      <div style={{ flexShrink: 0, background: C.card, borderBottom: `1px solid ${C.borderSoft}`, padding: '14px 22px 12px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 180, maxWidth: 420, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: MONO, fontSize: 12, color: '#B0B0B5' }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, role..."
              style={{ width: '100%', padding: '9px 12px 9px 30px', border: '1px solid #E2E2DE', borderRadius: 9, fontSize: 13.5, fontFamily: FONT, background: C.field, outline: 'none' }} />
          </div>
          {view === 'list' && (
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '9px 10px', border: '1px solid #E2E2DE', borderRadius: 9, fontSize: 13, fontFamily: FONT, background: C.field, color: C.text2, cursor: 'pointer', outline: 'none' }}>
              <option value="score">Sort: Match score</option>
              <option value="name">Sort: Name (A–Z)</option>
              <option value="date">Sort: Newest</option>
            </select>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 0, background: C.field, border: '1px solid #E2E2DE', borderRadius: 9, padding: 3 }}>
            {[['list', 'List'], ['board', 'Board']].map(([k, lbl]) => (
              <button key={k} onClick={() => setView(k)}
                style={{ border: 'none', cursor: 'pointer', padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, background: view === k ? C.ink : 'transparent', color: view === k ? '#fff' : C.muted }}>{lbl}</button>
            ))}
          </div>
        </div>
        {view === 'list' && (
          <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const active = filter === t.key
              return (
                <button key={t.key} onClick={() => setFilter(t.key)}
                  style={{ border: `1px solid ${active ? C.ink : '#E2E2DE'}`, background: active ? C.ink : '#fff', color: active ? '#fff' : C.text2, cursor: 'pointer', padding: '6px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{t.label}</span><span style={{ fontFamily: MONO, fontSize: 11, opacity: 0.75 }}>{tabCounts[t.key]}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* body */}
      {view === 'list' ? (
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          {/* list */}
          <section style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: C.card, borderRight: `1px solid ${C.border}` }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px', background: C.field, borderBottom: `1px solid ${C.borderSoft}` }}>
              <Check on={allChecked} onClick={toggleAll} />
              <span style={hdr(1)}>CANDIDATE</span>
              <span style={{ ...hdr(), width: 150 }}>SKILLS MATCH</span>
              <span style={{ ...hdr(), width: 52, textAlign: 'center' }}>SCORE</span>
              <span style={{ ...hdr(), width: 92 }}>STATUS</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {loading && <Empty>Loading candidates…</Empty>}
              {!loading && listRows.length === 0 && <Empty>No candidates match these filters.</Empty>}
              {listRows.map(({ c, m, st, score }) => {
                const isSel = c.id === selectedId
                const tier = scoreTier(score)
                const pct = m.pct !== null ? m.pct : score
                const matchLabel = m.req.length ? `${m.matched.length}/${m.req.length}` : `${m.cs.length} sk`
                return (
                  <div key={c.id} onClick={() => setSelectedId(c.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px 14px 16px', borderBottom: `1px solid ${C.rowLine}`, cursor: 'pointer', borderLeft: `3px solid ${isSel ? C.accent : 'transparent'}`, background: isSel ? C.accentSoft : '#fff' }}>
                    <Check on={!!checked[c.id]} onClick={(e) => { e.stopPropagation(); toggleCheck(c.id) }} />
                    <Avatar name={c.full_name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name || 'Unknown'}</span>
                        <span style={{ fontFamily: MONO, fontSize: 9.5, color: '#BDBDC2', flexShrink: 0 }}>#{String(c.id).padStart(4, '0')}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.muted2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(m.job?.title || c.email || '—')}{c.experience_years != null ? ` · ${c.experience_years}y exp` : ''}</div>
                    </div>
                    <div style={{ width: 150 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontFamily: MONO, fontSize: 10.5, color: '#77777E' }}>{matchLabel}</span>
                        <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 600, color: tier }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 4, background: '#EFEFEC', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: tier, borderRadius: 4 }} />
                      </div>
                    </div>
                    <div style={{ width: 52, display: 'flex', justifyContent: 'center' }}>
                      <Ring score={score} tier={tier} bg={isSel ? '#FBF8FF' : '#fff'} />
                    </div>
                    <div style={{ width: 92 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            {checkedIds.length > 0 && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: C.ink, color: '#fff' }}>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600 }}>{checkedIds.length} selected</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button disabled={busy} onClick={() => setChecked({})} style={darkBtn('rgba(255,255,255,0.25)', 'transparent', 'rgba(255,255,255,0.8)')}>Clear</button>
                  <button disabled={busy} onClick={() => bulk('reject')} style={darkBtn('none', '#EF4444', '#fff')}>Reject</button>
                  <button disabled={busy} onClick={() => bulk('shortlist')} style={darkBtn('none', C.accent, '#fff')}>Shortlist</button>
                </div>
              </div>
            )}
          </section>

          {/* review panel */}
          <aside style={{ width: 430, flexShrink: 0, height: '100%', overflowY: 'auto', background: C.field }}>
            {selected ? <ReviewPanel c={selected} m={matchOf(selected)} onDecision={(id, action) => move(id, action === 'approve' ? 'shortlist' : 'reject')} onOpen={() => navigate(`/candidates/${selected.id}`)} />
              : <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: '#A7A7AC' }}>
                  <div style={{ width: 46, height: 46, border: '1.5px dashed #CFCFC9', borderRadius: 12, marginBottom: 14 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.muted }}>Select a candidate</div>
                  <div style={{ fontSize: 12.5, marginTop: 4 }}>Pick someone from the list to review.</div>
                </div>}
          </aside>
        </div>
      ) : (
        /* ---------- BOARD ---------- */
        <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden', padding: '18px 22px', display: 'flex', gap: 16 }}>
          {STAGES.map(stage => {
            const cards = base.filter(r => r.norm === stage.key)
            const over = overCol === stage.key
            return (
              <div key={stage.key}
                onDragOver={(e) => { e.preventDefault(); setOverCol(stage.key) }}
                onDragLeave={() => setOverCol(o => o === stage.key ? null : o)}
                onDrop={() => onDrop(stage.key)}
                style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: over ? '#FFFFFF' : C.card, border: `1px solid ${over ? C.accentBorder : C.border}`, borderRadius: 14, boxShadow: over ? `0 0 0 3px ${C.accentSoft}` : 'none', transition: 'box-shadow .12s, border-color .12s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 12px', borderBottom: `1px solid ${C.borderSoft}` }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: stage.color }} />
                  <span style={{ fontSize: 13.5, fontWeight: 700 }}>{stage.label}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.muted2, background: stage.bg, padding: '2px 8px', borderRadius: 20 }}>{cards.length}</span>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cards.length === 0 && (
                    <div style={{ border: `1.5px dashed ${over ? C.accentBorder : '#E4E4E0'}`, borderRadius: 10, padding: '22px 12px', textAlign: 'center', fontSize: 12, color: '#B0B0B5' }}>
                      Drop here
                    </div>
                  )}
                  {cards.map(({ c, m, score }) => {
                    const tier = scoreTier(score)
                    const pct = m.pct !== null ? m.pct : score
                    const matchLabel = m.req.length ? `${m.matched.length}/${m.req.length} skills` : `${m.cs.length} skills`
                    return (
                      <div key={c.id} draggable
                        onDragStart={() => setDragId(c.id)}
                        onDragEnd={() => { setDragId(null); setOverCol(null) }}
                        onClick={() => navigate(`/candidates/${c.id}`)}
                        style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 11, padding: 13, cursor: 'grab', opacity: dragId === c.id ? 0.5 : 1, boxShadow: '0 1px 2px rgba(24,24,27,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={c.full_name} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name || 'Unknown'}</div>
                            <div style={{ fontSize: 11.5, color: C.muted2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.job?.title || c.email}</div>
                          </div>
                          <Ring score={score} tier={tier} bg="#fff" small />
                        </div>
                        <div style={{ marginTop: 11 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontFamily: MONO, fontSize: 10, color: '#77777E', whiteSpace: 'nowrap' }}>{matchLabel}</span>
                            <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, color: tier }}>{pct}%</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 4, background: '#EFEFEC', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: tier, borderRadius: 4 }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------- review panel ---------- */
function ReviewPanel({ c, m, onDecision, onOpen }) {
  const st = statusMeta(c.status)
  const tier = scoreTier(c.match_score)
  const csLower = m.cs.map(x => x.toLowerCase())
  let chips
  if (m.req.length) {
    chips = m.req.map(r => ({ name: r, ok: csLower.includes(r.toLowerCase()), kind: 'req' }))
    m.cs.filter(s => !m.req.some(r => r.toLowerCase() === s.toLowerCase())).forEach(e => chips.push({ name: e, kind: 'extra' }))
  } else {
    chips = m.cs.map(s => ({ name: s, kind: 'extra' }))
  }
  const profile = [
    ['Email', c.email || '—'], ['Phone', c.phone || '—'],
    ['Experience', c.experience_years != null ? `${c.experience_years} years` : '—'], ['Education', c.education || '—'],
  ]
  return (
    <div>
      <div style={{ background: C.card, padding: '24px 26px 20px', borderBottom: `1px solid ${C.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar name={c.full_name} big />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' }}>{c.full_name || 'Unknown Candidate'}</div>
            <div style={{ fontSize: 13, color: C.muted }}>{m.job?.title || c.email || '—'}</div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Stat label="AI MATCH" value={`${Number(c.match_score) || 0}%`} color={tier} />
          <Stat label="SKILLS" value={m.req.length ? `${m.matched.length}/${m.req.length}` : m.cs.length} />
          <Stat label="EXP" value={<>{c.experience_years ?? '—'}<span style={{ fontSize: 13, color: C.muted2, fontWeight: 600 }}>yr</span></>} />
        </div>
      </div>
      <div style={{ padding: '22px 26px' }}>
        <SectionLabel>{m.req.length ? 'SKILLS VS REQUIREMENTS' : 'SKILLS'}</SectionLabel>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 8 }}>
          {chips.length === 0 && <span style={{ fontSize: 13, color: C.muted2 }}>No skills listed.</span>}
          {chips.map((sk, i) => {
            const matched = sk.kind === 'req' && sk.ok
            const missing = sk.kind === 'req' && !sk.ok
            return (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 500, padding: '5px 11px', borderRadius: 7, whiteSpace: 'nowrap',
                background: matched ? C.accentSoft : missing ? '#fff' : '#F4F4F2', color: matched ? C.accent : missing ? C.red : '#77777E',
                border: `1px ${missing ? 'dashed' : 'solid'} ${matched ? C.accentBorder : missing ? C.redBorder : '#E8E8E4'}` }}>
                <span style={{ fontFamily: MONO, fontSize: 11 }}>{matched ? '✓' : missing ? '○' : '+'}</span>{sk.name}
              </span>
            )
          })}
        </div>
        {m.req.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
            <Legend color={C.accent} mark="●">Matched</Legend>
            <Legend color={C.redDot} mark="○">Missing</Legend>
            <Legend color="#A7A7AC" mark="+">Additional</Legend>
          </div>
        )}
        <SectionLabel>PROFILE</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.borderSoft, border: `1px solid ${C.borderSoft}`, borderRadius: 10, overflow: 'hidden', marginBottom: 22 }}>
          {profile.map(([k, v]) => (
            <div key={k} style={{ background: '#fff', padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: C.muted3, marginBottom: 3 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#2A2A30', wordBreak: 'break-word' }}>{v}</div>
            </div>
          ))}
        </div>
        <SectionLabel>RESUME EXCERPT</SectionLabel>
        <div style={{ background: '#fff', border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: '14px 16px', fontSize: 13, lineHeight: 1.6, color: C.text2, marginBottom: 24, maxHeight: 180, overflowY: 'auto' }}>
          {c.resume_text || 'No resume text available.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onDecision(c.id, 'reject')} style={{ flex: 1, border: `1px solid ${C.redBorder}`, background: '#fff', color: C.redSoft, cursor: 'pointer', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: FONT }}>Reject</button>
          <button onClick={() => onDecision(c.id, 'approve')} style={{ flex: 2, border: 'none', background: C.accent, color: '#fff', cursor: 'pointer', padding: 12, borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: FONT }}>Shortlist → Send interview invite</button>
        </div>
        <button onClick={onOpen} style={{ width: '100%', marginTop: 10, border: 'none', background: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 10.5, color: '#A0A0A6', letterSpacing: '0.06em' }}>
          #{String(c.id).padStart(4, '0')} · applied {fmtDate(c.created_at)} · OPEN FULL PROFILE →
        </button>
      </div>
    </div>
  )
}

/* ---------- building blocks ---------- */
const hdr = (flex) => ({ fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: C.muted3, ...(flex ? { flex } : {}) })

function Ring({ score, tier, bg, small }) {
  const o = small ? 34 : 40, i = small ? 26 : 31, fs = small ? 11 : 12
  return (
    <div style={{ width: o, height: o, borderRadius: '50%', background: `conic-gradient(${tier} ${score * 3.6}deg, #ECECE8 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{ width: i, height: i, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: fs, fontWeight: 600, color: tier }}>{score}</div>
    </div>
  )
}

function Check({ on, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${on ? C.accent : '#CFCFC9'}`, background: on ? C.accent : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}>
      {on && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
    </button>
  )
}

function Avatar({ name, big }) {
  const s = big ? 54 : 38
  return <div style={{ width: s, height: s, borderRadius: '50%', background: C.accentSoft, color: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: big ? 800 : 700, fontSize: big ? 19 : 13, flexShrink: 0 }}>{initials(name)}</div>
}

function Stat({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: C.field, border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: '11px 13px' }}>
      <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.12em', color: C.muted3 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || C.text, marginTop: 3 }}>{value}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', color: C.muted2, marginBottom: 11 }}>{children}</div>
}
function Legend({ color, mark, children }) {
  return <span style={{ fontSize: 11, color: C.muted2 }}><span style={{ color, fontWeight: 700 }}>{mark}</span> {children}</span>
}
function Empty({ children }) {
  return <div style={{ padding: '60px 20px', textAlign: 'center', color: '#A7A7AC', fontSize: 13.5 }}>{children}</div>
}
const darkBtn = (border, bg, color) => ({ border: border === 'none' ? 'none' : `1px solid ${border}`, background: bg, color, cursor: 'pointer', padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, fontFamily: FONT })
