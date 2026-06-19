import { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'

export default function CandidateDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [candidate, setCandidate] = useState(null)

    useEffect(() => {
        fetchCandidate()
    }, [])

    const fetchCandidate = async () => {
        try {
            const res = await axios.get(`https://recruitment.inceptarc.com/api/api/v1/candidates/${id}`)
            setCandidate(res.data)
        } catch (err) {
            console.error(err)
        }
    }

    const handleApprove = async () => {
        try {
            await axios.post('https://recruitment.inceptarc.com/api/api/v1/webhook/telegram', {
                callback_query: {
                    data: `approve_${id}`,
                    from: { id: 1334029468 }
                }
            })
            alert('✅ Candidate Approved! Interview email sent!')
            navigate('/candidates')
        } catch (err) {
            console.error(err)
        }
    }

    const handleReject = async () => {
        try {
            await axios.post('https://recruitment.inceptarc.com/api/api/v1/webhook/telegram', {
                callback_query: {
                    data: `reject_${id}`,
                    from: { id: 1334029468 }
                }
            })
            alert('❌ Candidate Rejected! Rejection email sent!')
            navigate('/candidates')
        } catch (err) {
            console.error(err)
        }
    }

    if (!candidate) return <div>Loading...</div>

    return (
        <div className="max-w-3xl mx-auto">
            <button
                onClick={() => navigate('/candidates')}
                className="mb-4 text-blue-500 hover:underline"
            >
                ← Back to Candidates
            </button>

            <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold mb-4">
                    👤 {candidate.full_name || 'Unknown Candidate'}
                </h1>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div><span className="font-semibold">📧 Email:</span> {candidate.email}</div>
                    <div><span className="font-semibold">📞 Phone:</span> {candidate.phone || 'N/A'}</div>
                    <div><span className="font-semibold">💼 Experience:</span> {candidate.experience_years} years</div>
                    <div><span className="font-semibold">🎓 Education:</span> {candidate.education || 'N/A'}</div>
                    <div><span className="font-semibold">📊 Match Score:</span> {candidate.match_score}%</div>
                    <div><span className="font-semibold">📌 Status:</span> {candidate.status}</div>
                </div>

                <div className="mb-4">
                    <span className="font-semibold">🛠 Skills:</span>
                    <p className="mt-1 text-gray-600">{candidate.skills}</p>
                </div>

                <div className="mb-6">
                    <span className="font-semibold">📄 Resume Text:</span>
                    <p className="mt-1 text-gray-600 text-sm bg-gray-50 p-3 rounded max-h-48 overflow-y-auto">
                        {candidate.resume_text || 'No resume text available'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleApprove}
                        className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                    >
                        ✅ Approve — Send Interview Invite
                    </button>
                    <button
                        onClick={handleReject}
                        className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
                    >
                        ❌ Reject — Send Rejection Email
                    </button>
                </div>
            </div>
        </div>
    )
}
