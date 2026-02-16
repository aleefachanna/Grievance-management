import React, { useEffect, useState } from 'react';
import api from './api';

function ManagerDash() {

    const [data, setData] = useState(null);

    const fetchData = async () => {
        const res = await api.get("manager/dashboard/");
        setData(res.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReassign = async (complaintId, deptId) => {
        await api.post("manager/dashboard/", {
            action: "reassign_complaint",
            complaint_id: complaintId,
            department_id: deptId
        });
        fetchData();
    };

    if (!data) return <div>Loading...</div>;

    return (
        <div className="p-6">

            <h1 className="text-2xl font-bold mb-6">
                Organisation: {data.organisation}
            </h1>

            {data.complaints.map(c => (
                <div key={c.id} className="bg-white p-4 shadow mb-3 rounded">
                    <p>{c.description}</p>
                    <p>Status: {c.status}</p>

                    <select
                        onChange={(e) =>
                            handleReassign(c.id, e.target.value)
                        }
                        className="mt-2 border p-1"
                    >
                        <option>Select Department</option>
                        {data.departments.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
        </div>
    );
}

export default ManagerDash;