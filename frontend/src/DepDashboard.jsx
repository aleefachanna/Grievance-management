import React, { useEffect, useState } from 'react';
import api from './api';

function DepartmentDashboard() {

    const [data, setData] = useState(null);
    const [newWork, setNewWork] = useState({ title: '', description: '' });

    const fetchData = async () => {
        const res = await api.get("department/dashboard/");
        setData(res.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (payload) => {
        await api.post("department/dashboard/", payload);
        fetchData();
    };

    if (!data) return <div>Loading...</div>;

    return (
        <div className="p-6">

            <h1 className="text-2xl font-bold mb-6">
                Department: {data.department_name}
            </h1>

            {/* Complaints */}
            <div className="mb-10">
                <h2 className="font-bold mb-3">Complaints</h2>

                {data.complaints.map(c => (
                    <div key={c.id} className="bg-white p-4 shadow mb-3 rounded">
                        <p className="font-semibold">{c.description}</p>
                        <p className="text-sm text-gray-600">
                            AI Summary: {c.ai_summary}
                        </p>

                        <select
                            value={c.status}
                            onChange={(e) =>
                                handleAction({
                                    action: "update_complaint_status",
                                    complaint_id: c.id,
                                    status: e.target.value
                                })
                            }
                            className="mt-2 border p-1 rounded"
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="WORKING">WORKING</option>
                            <option value="CLOSED">CLOSED</option>
                        </select>
                    </div>
                ))}
            </div>

            {/* Works */}
            <div>
                <h2 className="font-bold mb-3">Works</h2>

                {data.works.map(w => (
                    <div key={w.id} className="bg-white p-4 shadow mb-3 rounded">
                        <p className="font-bold">{w.title}</p>
                        <p>{w.description}</p>
                        <p>Status: {w.status}</p>

                        {w.status !== "DONE" && (
                            <button
                                onClick={() =>
                                    handleAction({
                                        action: "complete_work",
                                        work_id: w.id
                                    })
                                }
                                className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
                            >
                                Mark Done
                            </button>
                        )}
                    </div>
                ))}

                {/* Create Work */}
                <div className="mt-6">
                    <input
                        placeholder="Title"
                        className="border p-2 w-full mb-2"
                        onChange={(e) =>
                            setNewWork({ ...newWork, title: e.target.value })
                        }
                    />
                    <textarea
                        placeholder="Description"
                        className="border p-2 w-full mb-2"
                        onChange={(e) =>
                            setNewWork({ ...newWork, description: e.target.value })
                        }
                    />
                    <button
                        onClick={() =>
                            handleAction({
                                action: "create_work",
                                ...newWork
                            })
                        }
                        className="bg-blue-600 text-white w-full py-2 rounded"
                    >
                        Create Work
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DepartmentDashboard;