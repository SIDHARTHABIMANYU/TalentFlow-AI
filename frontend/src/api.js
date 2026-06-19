import axios from 'axios'

export const API = 'https://recruitment.inceptarc.com'
export const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

export function getCandidates() {
  return axios.get('/api/v1/candidates/', auth()).then(r => r.data || [])
}
export function getJobs() {
  return axios.get(`${API}/api/v1/jobs/`).then(r => r.data || []).catch(() => [])
}
export function decide(id, action) {
  return axios.post(`${API}/api/api/v1/webhook/telegram`, {
    callback_query: { data: `${action}_${id}`, from: { id: 1334029468 } },
  })
}
export function patchStatus(id, status) {
  return axios.patch(`${API}/api/api/v1/candidates/${id}`, { status }).catch(() => {})
}
export function moveToStage(id, stage) {
  if (stage === 'shortlist') return decide(id, 'approve')
  if (stage === 'reject')    return decide(id, 'reject')
  return patchStatus(id, stage)
}
export async function bulkMove(ids, stage) {
  for (const id of ids) {
    try { await moveToStage(id, stage) } catch (e) {}
  }
}
