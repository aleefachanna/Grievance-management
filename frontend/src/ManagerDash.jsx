import React, { useEffect, useState, useMemo } from 'react';
import { pApi } from './api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import './style2.css';

function ManagerDash() {
    const [data, setData] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("analytics");

    // Form states
    const [newDeptName, setNewDeptName] = useState("");
    const [newDeptDesc, setNewDeptDesc] = useState("");

    const [newEmpEmail, setNewEmpEmail] = useState("");
    const [newEmpName, setNewEmpName] = useState("");
    const [newEmpDept, setNewEmpDept] = useState("");
    const [newEmpHod, setNewEmpHod] = useState(false);
    
    const [createdEmpInfo, setCreatedEmpInfo] = useState(null);

    const fetchData = async () => {
        try {
            const res = await pApi.get("/dashboard/manager/");
            setData(res.data);

            const deptRes = await pApi.get("/manager/departments/");
            setDepartments(deptRes.data);

            const empRes = await pApi.get("/manager/employees/");
            setEmployees(empRes.data);

            setLoading(false);
        } catch (error) {
            console.error("Failed to load manager dashboard:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleReassign = async (complaintId, deptId) => {
        // Backend expects 'action', 'complaint_id', 'department_id'
        // Let's grab the actual internal ID of the complaint rather than the string complaint_id
        const comp = data.complaints.find(c => c.complaint_id === complaintId);
        if (!comp) return;

        await pApi.post("/dashboard/manager/", {
            action: "reassign_complaint",
            complaint_id: comp.complaint_id,
            department_id: deptId
        });
        alert("Complaint reassigned!");
        fetchData();
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        try {
            await pApi.post("/manager/departments/", {
                name: newDeptName,
                description: newDeptDesc
            });
            setNewDeptName("");
            setNewDeptDesc("");
            fetchData();
            alert("Department created successfully!");
        } catch (error) {
            alert(error.response?.data?.error || "Error creating department");
        }
    };

    const handleCreateEmp = async (e) => {
        e.preventDefault();
        try {
            const res = await pApi.post("/manager/employees/", {
                email: newEmpEmail,
                name: newEmpName,
                department_id: newEmpDept,
                is_hod: newEmpHod
            });
            setNewEmpEmail("");
            setNewEmpName("");
            setNewEmpDept("");
            setNewEmpHod(false);
            setCreatedEmpInfo({ id: res.data.employee_id, tempPassword: res.data.password, email: res.data.email });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error creating employee");
        }
    };

    if (loading) return <div className="loader">Loading Manager Assets...</div>;
    if (!data) return <div>Data not found or unauthorized.</div>;

    return (
        <div className="admin-container">
            <aside className="sidebar">
                <h2>{data.organisation}</h2>
                <nav>
                    <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>Analytics</button>
                    <button className={activeTab === 'complaints' ? 'active' : ''} onClick={() => setActiveTab('complaints')}>Complaints</button>
                    <button className={activeTab === 'departments' ? 'active' : ''} onClick={() => setActiveTab('departments')}>Departments</button>
                    <button className={activeTab === 'employees' ? 'active' : ''} onClick={() => setActiveTab('employees')}>Employees</button>
                </nav>
            </aside>

            <main className="main-viewport">
                <header className="top-nav">
                    <div className="stats-header">
                        <span><strong>Total Complaints:</strong> {data.stats?.total_complaints || 0}</span>
                        <span><strong>Pending:</strong> {data.stats?.pending_complaints || 0}</span>
                    </div>
                    <div className="user-profile">
                        <span className="badge">Manager (Owner)</span>
                    </div>
                </header>

                <div className="content-card">
                    {activeTab === "analytics" && (
                        <section>
                            <h3>Organisation Analytics</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginTop: '20px' }}>
                                {/* Status Pie Chart */}
                                <div style={{ flex: '1 1 300px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
                                    <h4 style={{ textAlign: 'center', margin: '0 0 20px 0', color: '#2c3e50' }}>Complaints by Status</h4>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'CLOSED', value: data.complaints.filter(c => c.status === 'CLOSED').length },
                                                        { name: 'WORKING', value: data.complaints.filter(c => c.status === 'WORKING').length },
                                                        { name: 'PENDING', value: data.complaints.filter(c => c.status === 'PENDING').length },
                                                        { name: 'REVIEW', value: data.complaints.filter(c => c.status === 'REQUESTED_CLOSE').length }
                                                    ].filter(d => d.value > 0)}
                                                    cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value"
                                                >
                                                    <Cell key="CLOSED" fill="#27ae60" />
                                                    <Cell key="WORKING" fill="#f39c12" />
                                                    <Cell key="PENDING" fill="#e74c3c" />
                                                    <Cell key="REVIEW" fill="#9b59b6" />
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Department Bar Chart */}
                                <div style={{ flex: '2 1 400px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
                                    <h4 style={{ textAlign: 'center', margin: '0 0 20px 0', color: '#2c3e50' }}>Complaints by Department</h4>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={departments.map(d => ({
                                                    name: d.name.substring(0, 15) + (d.name.length > 15 ? '...' : ''),
                                                    total: data.complaints.filter(c => c.department === d.name).length
                                                })).filter(d => d.total > 0)}
                                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip cursor={{ fill: '#f8f9fa' }} />
                                                <Bar dataKey="total" fill="#3498db" radius={[4, 4, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === "complaints" && (
                        <section>
                            <h3>Organisation Complaints</h3>
                            <div className="complaint-grid" style={{ gridTemplateColumns: "1fr" }}>
                                {data.complaints.map(c => (
                                    <div key={c.complaint_id} className="complaint-box" style={{ marginBottom: "15px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                                            <strong>ID: {c.complaint_id}</strong>
                                            <span className={`pill status-${c.status.toLowerCase()}`}>{c.status}</span>
                                        </div>
                                        <p>{c.description}</p>
                                        <div className="box-footer" style={{ marginTop: "10px", justifyContent: "flex-start", gap: "10px", alignItems: "center" }}>
                                            <span>Current Dept: {c.department || "None"}</span>
                                            <select
                                                onChange={(e) => handleReassign(c.complaint_id, e.target.value)}
                                                style={{ padding: "5px", borderRadius: "4px" }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Reassign To...</option>
                                                {departments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                                {data.complaints.length === 0 && <p>No complaints found.</p>}
                            </div>
                        </section>
                    )}

                    {activeTab === "departments" && (
                        <section>
                            <h3>Manage Departments</h3>
                            <div style={{ marginBottom: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #e1e4e8" }}>
                                <h4>Create New Department</h4>
                                <form onSubmit={handleCreateDept} style={{ display: "flex", gap: "10px", marginTop: "10px", alignItems: "center" }}>
                                    <input type="text" placeholder="Department Name" value={newDeptName} onChange={e => setNewDeptName(e.target.value)} required style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }} />
                                    <input type="text" placeholder="Description (Optional)" value={newDeptDesc} onChange={e => setNewDeptDesc(e.target.value)} style={{ flex: 1, padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }} />
                                    <button type="submit" className="submit-button" style={{ margin: 0, padding: "10px 20px" }}>Create</button>
                                </form>
                            </div>

                            <table className="data-table">
                                <thead><tr><th>Name</th><th>Description</th></tr></thead>
                                <tbody>
                                    {departments.map(d => (
                                        <tr key={d.id}>
                                            <td>{d.name}</td>
                                            <td>{d.description}</td>
                                        </tr>
                                    ))}
                                    {departments.length === 0 && <tr><td colSpan="2">No departments created yet.</td></tr>}
                                </tbody>
                            </table>
                        </section>
                    )}

                    {activeTab === "employees" && (
                        <section>
                            <h3>Manage Employees</h3>
                            <div style={{ marginBottom: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #e1e4e8" }}>
                                <h4>Add New Employee</h4>
                                <form onSubmit={handleCreateEmp} style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap", alignItems: "center" }}>
                                    <input type="text" placeholder="Full Name" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} required style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }} />
                                    <input type="email" placeholder="Email" value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} required style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }} />
                                    <select value={newEmpDept} onChange={e => setNewEmpDept(e.target.value)} required style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }}>
                                        <option value="" disabled>Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                                        <input type="checkbox" checked={newEmpHod} onChange={e => setNewEmpHod(e.target.checked)} />
                                        Is HOD?
                                    </label>
                                    <button type="submit" className="submit-button" style={{ margin: 0, padding: "10px 20px" }}>Add Employee</button>
                                </form>
                                {createdEmpInfo && (
                                    <div style={{ marginTop: "15px", padding: "10px 15px", background: "#e8f5e9", borderLeft: "4px solid #4caf50", borderRadius: "4px" }}>
                                        <strong>Employee Created Successfully!</strong><br />
                                        <span><strong>ID:</strong> {createdEmpInfo.id}</span><br />
                                        <span><strong>Email:</strong> {createdEmpInfo.email}</span><br />
                                        <span><strong>Temp Password:</strong> {createdEmpInfo.tempPassword}</span>
                                        <button type="button" onClick={() => setCreatedEmpInfo(null)} style={{ marginLeft: "15px", background: "transparent", border: "none", color: "#666", cursor: "pointer", textDecoration: "underline" }}>Dismiss</button>
                                    </div>
                                )}
                            </div>

                            <table className="data-table">
                                <thead><tr><th>Emp ID</th><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th></tr></thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.id}>
                                            <td>{emp.employee_id}</td>
                                            <td>{emp.name}</td>
                                            <td>{emp.email}</td>
                                            <td>{emp.department || "N/A"}</td>
                                            <td>{emp.is_hod ? <span className="badge" style={{ background: "#ff9800" }}>HOD</span> : "Staff"}</td>
                                            <td>{emp.is_active ? "Active" : "Inactive"}</td>
                                        </tr>
                                    ))}
                                    {employees.length === 0 && <tr><td colSpan="6">No employees created yet.</td></tr>}
                                </tbody>
                            </table>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

export default ManagerDash;