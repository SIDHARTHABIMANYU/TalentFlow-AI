import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
export default function Candidates() {
    const [candidates, setCandidates] = useState([])
    const [search, setSearch] = useState('')
    const navigate = useNavigate()
    useEffect(() => {
        fetchCandidates()
    }, [])
    const fetchCandidates = async () => {
        try {
            const token = localStorage.getItem('token')
            const res = await axios.get('/api/v1/candidates/', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setCandidates(res.data)
        } catch (err) {
            console.error(err)
        }
    }
    const filtered = candidates.filter(c =>
        (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase())
    )
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">👥 All Candidates</h1>
            <input
                type="text"
                placeholder="Search by name or email..."
                className="border p-2 rounded w-full mb-4"
                value={search}
                onChange={e => setSearch(e.target.value)}
            />
            <div className="bg-white rounded-lg shadow">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3 text-left">Name</th>
                            <th className="p-3 text-left">Email</th>
                            <th className="p-3 text-left">Skills</th>
                            <th className="p-3 text-left">Score</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{c.full_name || 'Unknown'}</td>
                                <td className="p-3">{c.email}</td>
                                <td className="p-3 text-sm">{c.skills?.slice(0, 30)}...</td>
                                <td className="p-3">{c.match_score}%</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-white text-sm ${c.status === 'shortlist' ? 'bg-green-500' :
                                            c.status === 'reject' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <button
                                        onClick={() => navigate(`/candidates/${c.id}`)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
