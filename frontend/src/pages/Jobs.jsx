import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Jobs() {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [form, setForm] = useState({
        title: '', department: '', required_skills: '', min_experience_years: ''
    })

    useEffect(() => {
        fetchJobs()
    }, [])

    const fetchJobs = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await axios.get('http://127.0.0.1:8000/api/v1/jobs/')
            setJobs(res.data)
        } catch (err) {
            console.error(err)
            setError('Failed to load jobs. Is the backend running?')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!form.title || !form.required_skills) {
            alert('Title and Required Skills are mandatory!')
            return
        }
        try {
            await axios.post('http://127.0.0.1:8000/api/v1/jobs/', form)
            alert('✅ Job created!')
            fetchJobs()
            setForm({ title: '', department: '', required_skills: '', min_experience_years: '' })
        } catch (err) {
            console.error(err)
            alert('❌ Failed to create job!')
        }
    }

    const handleDelete = async (jobId) => {
        if (!confirm('Delete this job?')) return
        try {
            await axios.delete(`http://127.0.0.1:8000/api/v1/jobs/${jobId}`)
            fetchJobs()
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">💼 Job Requirements</h1>

            {/* Create Job Form */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <h2 className="text-lg font-bold mb-3">Add New Job</h2>
                <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Job Title *" className="border p-2 rounded"
                        value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                    <input placeholder="Department" className="border p-2 rounded"
                        value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                    <input placeholder="Required Skills * (comma separated)" className="border p-2 rounded col-span-2"
                        value={form.required_skills} onChange={e => setForm({ ...form, required_skills: e.target.value })} />
                    <input placeholder="Min Experience Years" type="number" className="border p-2 rounded"
                        value={form.min_experience_years} onChange={e => setForm({ ...form, min_experience_years: e.target.value })} />
                </div>
                <button onClick={handleCreate}
                    className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    ➕ Create Job
                </button>
            </div>

            {/* Jobs List */}
            {loading && <p className="text-center text-gray-500">Loading jobs...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!loading && !error && jobs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No jobs yet. Add one above!</p>
            )}
            {!loading && jobs.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-3 text-left">Title</th>
                                <th className="p-3 text-left">Department</th>
                                <th className="p-3 text-left">Required Skills</th>
                                <th className="p-3 text-left">Experience</th>
                                <th className="p-3 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(j => (
                                <tr key={j.id} className="border-b">
                                    <td className="p-3 font-semibold">{j.title}</td>
                                    <td className="p-3">{j.department}</td>
                                    <td className="p-3 text-sm">{j.required_skills}</td>
                                    <td className="p-3">{j.min_experience_years} years</td>
                                    <td className="p-3">
                                        <button onClick={() => handleDelete(j.id)}
                                            className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                                            🗑️ Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}