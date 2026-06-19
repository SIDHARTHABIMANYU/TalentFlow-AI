export const C = {
  ink: '#18181B', bg: '#F5F5F3', card: '#FFFFFF',
  border: '#E6E6E2', borderSoft: '#EFEFEC', rowLine: '#F2F2F0',
  field: '#FAFAF8', text: '#1A1A1F', text2: '#45454C',
  muted: '#8C8C92', muted2: '#9A9AA0', muted3: '#A0A0A6',
  accent: '#6D28D9', accentSoft: '#6D28D916', accentBorder: '#6D28D940',
  green: '#15803D', greenBg: '#E7F4EC', greenDot: '#16A34A',
  amber: '#B45309', amberBg: '#FBF1DD', amberDot: '#D97706',
  red: '#B91C1C', redBg: '#FBEBEA', redDot: '#DC2626', redSoft: '#C0322E', redBorder: '#F0CFCE',
  blue: '#1D4ED8', blueBg: '#EAF0FC', blueDot: '#2563EB',
}
export const FONT = "'Hanken Grotesk', system-ui, -apple-system, sans-serif"
export const MONO = "'JetBrains Mono', ui-monospace, monospace"
export function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase().trim()
  if (['shortlist','shortlisted','approved','approve'].includes(s)) return 'shortlist'
  if (['reject','rejected'].includes(s)) return 'reject'
  if (['review','in_review','in review','reviewing','consider','considering'].includes(s)) return 'review'
  return 'new'
}
export function statusMeta(raw) {
  switch (normalizeStatus(raw)) {
    case 'shortlist': return { label: 'Shortlisted', color: C.green, bg: C.greenBg, dot: C.greenDot }
    case 'reject':    return { label: 'Rejected',    color: C.red,   bg: C.redBg,   dot: C.redDot }
    case 'review':    return { label: 'In Review',   color: C.amber, bg: C.amberBg, dot: C.amberDot }
    default:          return { label: 'New',         color: C.blue,  bg: C.blueBg,  dot: C.blueDot }
  }
}
export function scoreTier(sc) {
  const n = Number(sc) || 0
  return n >= 85 ? C.green : n >= 70 ? C.amber : C.redSoft
}
export function initials(name) {
  return String(name || '?').trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase() || '?'
}
export function parseSkills(skills) {
  if (Array.isArray(skills)) return skills.filter(Boolean)
  if (!skills) return []
  return String(skills).split(/[,;\n|]/).map(s => s.trim()).filter(Boolean)
}
export function fmtDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return String(d)
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
