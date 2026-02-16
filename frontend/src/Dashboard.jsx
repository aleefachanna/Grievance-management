import React, { useEffect, useState } from 'react';
import api from './api';

function Dashboard() {
    const [data, setData] = useState({ complaints: [], works: [], department_name: '' });
    const [loading, setLoading] = useState(false);
    const [newWork, setNewWork] = useState({ title: '', desc: '' });

    // Fetch dashboard data (The GET logic)
    const fetchData = async () => {
        const res = await api.get('dashboard/');
        setData(res.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handle Actions (The POST logic from your views.py)
    const handleAction = async (payload) => {
        setLoading(true);
        try {
            await api.post('dashboard/', payload);
            fetchData(); // Refresh data after action
        } catch (err) {
            alert("Action failed: " + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-4">Dept: {data.department_name}</h1>
            
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={() => handleAction({ action: 'ai_assign' })}
                    className="bg-purple-600 text-white px-4 py-2 rounded"
                    disabled={loading}
                >
                    {loading ? "Processing..." : "AI Auto-Assign"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Complaints List */}
                <section>
                    <h2 className="text-xl font-bold mb-4">Complaints</h2>
                    {data.complaints.map(c => (
                        <div key={c.id} className="p-4 bg-white shadow mb-2 rounded border-l-4 border-blue-500">
                            <p className="font-medium">{c.description}</p>
                            <p className="text-sm text-gray-500">Status: {c.status} | Severity: {c.severity}</p>
                            <select 
                                className="mt-2 border rounded p-1 text-sm"
                                onChange={(e) => handleAction({ 
                                    action: 'new_status', 
                                    complaint_id: c.id, 
                                    new_status: e.target.value 
                                })}
                                value={c.status}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>
                        </div>
                    ))}
                </section>

                {/* Works List */}
                <section>
                    <h2 className="text-xl font-bold mb-4">Departmental Works</h2>
                    {data.works.map(w => (
                        <div key={w.id} className="p-4 bg-white shadow mb-2 rounded border-l-4 border-green-500 flex justify-between">
                            <div>
                                <p className="font-bold">{w.title}</p>
                                <p className="text-sm text-gray-600">{w.status}</p>
                            </div>
                            {w.status !== 'DONE' && (
                                <button 
                                    onClick={() => handleAction({ action: 'complete_work', work_id: w.id })}
                                    className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm hover:bg-green-200"
                                >
                                    Complete
                                </button>
                            )}
                        </div>
                    ))}
                    
                    {/* Create New Work Form */}
                    <div className="mt-6 p-4 bg-gray-200 rounded">
                        <h3 className="font-bold mb-2">Create New Work</h3>
                        <input 
                            placeholder="Title" 
                            className="w-full mb-2 p-1 rounded"
                            onChange={(e) => setNewWork({...newWork, title: e.target.value})}
                        />
                        <button 
                            onClick={() => handleAction({ ...newWork, action: 'create_work' })}
                            className="bg-blue-600 text-white w-full py-1 rounded"
                        >
                            Add Work
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Dashboard;