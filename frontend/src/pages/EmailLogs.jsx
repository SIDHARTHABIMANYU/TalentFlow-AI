import { useState, useEffect } from 'react'
import axios from 'axios'

export default function EmailLogs() {
    const [candidates, setCandidates] = useState([])

    useEffect(() => {
        axios.get('https://recruitment.inceptarc.com/api/api/v1/candidates/')
            .then(res => setCandidates(res.data))
    }, [])

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">📧 Email Logs</h1>
            <div className="bg-white rounded-lg shadow">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-3 text-left">From</th>
                            <th className="p-3 text-left">Subject</th>
                            <th className="p-3 text-left">Status</th>
                            <th className="p-3 text-left">Score</th>
                            <th className="p-3 text-left">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {candidates.map(c => (
                            <tr key={c.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">{c.sender_email || c.email}</td>
                                <td className="p-3">{c.email_subject || 'N/A'}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-white text-sm ${c.status === 'approved' ? 'bg-green-500' :
                                            c.status === 'rejected' ? 'bg-red-500' :
                                                c.status === 'shortlist' ? 'bg-blue-500' : 'bg-yellow-500'
                                        }`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td className="p-3">{c.match_score}%</td>
                                <td className="p-3 text-sm text-gray-500">
                                    {new Date(c.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}