import { useState, useEffect } from 'react'
import axios from 'axios'
export default function Dashboard() {
    const [stats, setStats] = useState({
        total: 0, shortlisted: 0, rejected: 0, pending: 0
    })
    const [candidates, setCandidates] = useState([])
    useEffect(() => {
        fetchData()
    }, [])
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get('/api/v1/candidates/', {
                headers: { Authorization: `Bearer ${token}` }
            })
            const all = res.data
            const sorted = all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            setCandidates(sorted.slice(0, 5))
            setStats({
                total: all.length,
                shortlisted: all.filter(c => c.status === 'shortlist').length,
                rejected: all.filter(c => c.status === 'reject').length,
                pending: all.filter(c => c.status === 'pending').length
            })
        } catch (err) {
            console.error(err)
        }
    }
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">📊 Dashboard</h1>
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <div>Total Applications</div>
                </div>
                <div className="bg-green-500 text-white p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold">{stats.shortlisted}</div>
                    <div>Shortlisted</div>
                </div>
                <div className="bg-red-500 text-white p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold">{stats.rejected}</div>
                    <div>Rejected</div>
                </div>
                <div className="bg-yellow-500 text-white p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold">{stats.pending}</div>
                    <div>Pending</div>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-bold mb-4">Recent Candidates</h2>
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 text-left">Name</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">Score</th>
                            <th className="p-2 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map(c => (
                            <tr key={c.id} className="border-b">
                                <td className="p-2">{c.full_name || 'Unknown'}</td>
                                <td className="p-2">{c.email}</td>
                                <td className="p-2">{c.match_score}%</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 rounded text-white text-sm ${c.status === 'shortlist' ? 'bg-green-500' :
                                        c.status === 'reject' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}>
                                        {c.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
