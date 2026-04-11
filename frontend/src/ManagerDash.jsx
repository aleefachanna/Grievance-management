import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { pApi } from './api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import './style2.css';

function ManagerDash() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("analytics");

    // Form states
    const [newDeptName, setNewDeptName] = useState("");
    const [newDeptDesc, setNewDeptDesc] = useState("");

    const [newEmpEmail, setNewEmpEmail] = useState("");
    const [newEmpDept, setNewEmpDept] = useState("");
    const [newEmpHod, setNewEmpHod] = useState(false);
    const [newEmpPassword, setNewEmpPassword] = useState("");

    const [createdEmpInfo, setCreatedEmpInfo] = useState(null);

    const [aiSummary, setAiSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [orgDescription, setOrgDescription] = useState("");

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const fetchData = async () => {
        try {
            const res = await pApi.get("/dashboard/manager/");
            setData(res.data);
            if (res.data.organisation_description) {
                setOrgDescription(res.data.organisation_description);
            }

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

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");
        navigate("/");
    };

    const handleReassign = async (complaintId, deptId) => {
        try {
            await pApi.post('/dashboard/manager/', {
                action: 'reassign_complaint',
                complaint_id: complaintId,
                department_id: deptId
            });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to reassign complaint.");
        }
    };

    const handleAssignEmployee = async (complaintId, employeeId) => {
        try {
            await pApi.post("/dashboard/manager/", {
                action: "assign_complaint_employee",
                complaint_id: complaintId,
                employee_ids: [employeeId]
            });
            fetchData();
        } catch (error) {
            console.error(error);
            alert("Failed to assign employee.");
        }
    };

    const handleGenerateSummary = async () => {
        setLoadingSummary(true);
        try {
            const res = await pApi.post("/dashboard/manager/", {
                action: "generate_ai_summary"
            });
            setAiSummary(res.data);
        } catch (error) {
            alert(error.response?.data?.error || "Failed to generate AI summary");
        }
        setLoadingSummary(false);
    };

    const runAIAutoAssign = async () => {
        setAiAssignLoading(true);
        try {
            const res = await pApi.post("/manager/ai/assign_employees/");
            alert(res.data.message || "AI Auto-Assignment complete.");
            fetchData();
        } catch (error) {
            console.error(error);
            alert("AI Assignment failed.");
        } finally {
            setAiAssignLoading(false);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            await pApi.post("/dashboard/manager/", {
                action: "update_org_description",
                description: orgDescription
            });
            alert("Settings saved successfully!");
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || "Error updating settings");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await pApi.post("/department/change_password/", {
                old_password: oldPassword,
                new_password: newPassword
            });
            alert("Password updated successfully!");
            setOldPassword("");
            setNewPassword("");
        } catch (error) {
            alert(error.response?.data?.error || "Error changing password");
        }
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
                is_hod: newEmpHod,
                password: newEmpPassword
            });
            setNewEmpEmail("");
            setNewEmpName("");
            setNewEmpDept("");
            setNewEmpHod(false);
            setNewEmpPassword("");
            setCreatedEmpInfo({ id: res.data.employee_id, email: res.data.email });
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
                    <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Org/AI Settings</button>
                </nav>
                <div style={{ marginTop: "auto" }}>
                    <button onClick={handleLogout} style={{ width: "100%", padding: "12px", background: "rgba(231, 76, 60, 0.9)", color: "white", border: "1px solid rgba(231, 76, 60, 0.3)", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "all 0.3s ease" }} onMouseOver={(e) => e.target.style.background = "#c0392b"} onMouseOut={(e) => e.target.style.background = "rgba(231, 76, 60, 0.9)"}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="main-viewport">
                <header className="top-nav">
                    <div className="stats-header" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
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

                                {/* Severity Bar Chart */}
                                <div style={{ flex: '1 1 300px', background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
                                    <h4 style={{ textAlign: 'center', margin: '0 0 20px 0', color: '#2c3e50' }}>Complaints by Severity</h4>
                                    <div style={{ height: '300px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={[
                                                    { name: 'Critical (5)', total: data.complaints.filter(c => c.severity === '5').length, fill: '#c62828' },
                                                    { name: 'High (4)', total: data.complaints.filter(c => c.severity === '4').length, fill: '#ef6c00' },
                                                    { name: 'Medium (3)', total: data.complaints.filter(c => c.severity === '3').length, fill: '#f57f17' },
                                                    { name: 'Low (2)', total: data.complaints.filter(c => c.severity === '2').length, fill: '#9e9e9e' },
                                                    { name: 'Very Low (1)', total: data.complaints.filter(c => c.severity === '1').length, fill: '#bdbdbd' },
                                                    { name: 'None (0)', total: data.complaints.filter(c => !c.severity || c.severity === '0').length, fill: '#eceff1' }
                                                ].filter(d => d.total > 0)}
                                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip cursor={{ fill: '#f8f9fa' }} />
                                                <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={30}>
                                                    {
                                                        [
                                                            { name: 'Critical (5)', total: data.complaints.filter(c => c.severity === '5').length, fill: '#c62828' },
                                                            { name: 'High (4)', total: data.complaints.filter(c => c.severity === '4').length, fill: '#ef6c00' },
                                                            { name: 'Medium (3)', total: data.complaints.filter(c => c.severity === '3').length, fill: '#f57f17' },
                                                            { name: 'Low (2)', total: data.complaints.filter(c => c.severity === '2').length, fill: '#9e9e9e' },
                                                            { name: 'Very Low (1)', total: data.complaints.filter(c => c.severity === '1').length, fill: '#bdbdbd' },
                                                            { name: 'None (0)', total: data.complaints.filter(c => !c.severity || c.severity === '0').length, fill: '#eceff1' }
                                                        ].filter(d => d.total > 0).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))
                                                    }
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* AI Summary Section */}
                            <div style={{ marginTop: '30px', background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', padding: '25px', borderRadius: '12px', border: '1px solid #dcdde1', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>✨</span> AI Complaints Summary
                                    </h4>
                                    <button
                                        onClick={handleGenerateSummary}
                                        disabled={loadingSummary}
                                        style={{ background: '#8e44ad', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: loadingSummary ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
                                    >
                                        {loadingSummary ? "Generating..." : "Generate Insights"}
                                    </button>
                                </div>
                                {aiSummary ? (
                                    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #8e44ad' }}>
                                        <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#34495e', marginBottom: '15px' }}>{aiSummary.summary}</p>
                                        <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Key Recurring Issues:</h5>
                                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#555' }}>
                                            {aiSummary.key_issues?.map((issue, idx) => (
                                                <li key={idx} style={{ marginBottom: '5px' }}>{issue}</li>
                                            ))}
                                            {(!aiSummary.key_issues || aiSummary.key_issues.length === 0) && (
                                                <li>No specific key issues identified.</li>
                                            )}
                                        </ul>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                                        Click the button above to analyze recent complaints using AI and generate an executive summary.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === "complaints" && (
                        <section>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                                <h3 style={{ margin: 0 }}>Organisation Complaints</h3>
                                <button
                                    onClick={runAIAutoAssign}
                                    disabled={aiAssignLoading}
                                    style={{
                                        padding: "10px 20px",
                                        background: "linear-gradient(45deg, #a855f7, #ec4899)",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "bold",
                                        boxShadow: "0 4px 15px rgba(236, 72, 153, 0.3)",
                                        transition: "all 0.3s ease"
                                    }}
                                    onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
                                    onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
                                >
                                    {aiAssignLoading ? "AI Processing..." : "✨ AI Auto-Assign"}
                                </button>
                            </div>
                            <div className="complaint-grid" style={{ gridTemplateColumns: "1fr" }}>
                                {data.complaints.map((c, index) => (
                                    <div key={c.complaint_id} className="complaint-box" style={{ marginBottom: "15px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                                            <strong>{index + 1}. ID: {c.complaint_id}</strong>
                                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                <span style={{
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: "bold",
                                                    background: c.severity === "5" ? "#ffebee" : c.severity === "4" ? "#fff3e0" : c.severity === "3" ? "#fff8e1" : "#f5f5f5",
                                                    color: c.severity === "5" ? "#c62828" : c.severity === "4" ? "#ef6c00" : c.severity === "3" ? "#f57f17" : "#616161",
                                                    border: `1px solid ${c.severity === "5" ? "#ffcdd2" : c.severity === "4" ? "#ffe0b2" : c.severity === "3" ? "#ffecb3" : "#e0e0e0"}`
                                                }}>
                                                    Severity: {c.severity || "0"}
                                                </span>
                                                <span className={`pill status-${c.status.toLowerCase()}`}>{c.status}</span>
                                            </div>
                                        </div>
                                        <p>{c.description}</p>
                                        <div className="box-footer" style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.9rem", color: "#4b5563" }}>
                                                <span><strong>Dept:</strong> {c.department || "None"}</span>
                                                <span><strong>Assignee:</strong> {c.assigned_employees?.map(e => e.name).join(", ") || "None"}</span>
                                            </div>
                                            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                                                <select
                                                    onChange={(e) => handleReassign(c.complaint_id, e.target.value)}
                                                    style={{ padding: "5px", borderRadius: "4px" }}
                                                    value=""
                                                >
                                                    <option value="" disabled>Reassign To Dept...</option>
                                                    {departments.map(d => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                                <select
                                                    onChange={(e) => handleAssignEmployee(c.complaint_id, e.target.value)}
                                                    style={{ padding: "5px", borderRadius: "4px" }}
                                                    value=""
                                                    disabled={!c.department}
                                                >
                                                    <option value="" disabled>Assign Employee...</option>
                                                    {employees.filter(emp => emp.department === c.department).map(emp => (
                                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                    ))}
                                                </select>
                                            </div>
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
                            <div style={{ marginBottom: "30px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #e1e4e8", marginTop: "20px" }}>
                                <h4>Create New Department</h4>
                                <form onSubmit={handleCreateDept} style={{ display: "flex", gap: "10px", marginTop: "20px", alignItems: "center" }}>
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
                                    <input type="password" placeholder="Password" value={newEmpPassword} onChange={e => setNewEmpPassword(e.target.value)} required style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }} />
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
                                        <button type="button" onClick={() => setCreatedEmpInfo(null)} style={{ marginLeft: "0", marginTop: "10px", background: "transparent", border: "none", color: "#666", cursor: "pointer", textDecoration: "underline" }}>Dismiss</button>
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

                    {activeTab === "settings" && (
                        <section>
                            <h3>Organisation & AI Settings</h3>
                            <div style={{ marginBottom: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #e1e4e8" }}>
                                <h4>Change Password</h4>
                                <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
                                    <input type="password" placeholder="Old Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
                                    <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }} />
                                    <button type="submit" className="submit-button" style={{ alignSelf: "flex-start", margin: 0, padding: "10px 20px" }}>Update Password</button>
                                </form>
                            </div>
                            <div style={{ marginBottom: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #e1e4e8" }}>
                                <h4>Organisation Description (AI Context)</h4>
                                <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "15px" }}>
                                    This text is used to describe the organisation to the public, and is also passed to the AI to understand the context of the organisation to correctly evaluate the severity of complaints. Mention what your organisation does, and clarify what kind of complaints warrant a "Critical (5)" or "Low (2)" severity.
                                </p>
                                <form onSubmit={handleUpdateSettings} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <textarea
                                        value={orgDescription}
                                        onChange={(e) => setOrgDescription(e.target.value)}
                                        placeholder="We are a local government body. Critical issues involve public safety hazards. Non-urgent issues are Medium severity..."
                                        style={{ minHeight: "150px", width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #d1d5db", fontFamily: "inherit" }}
                                    />
                                    <button type="submit" className="submit-button" style={{ alignSelf: "flex-start", margin: 0, padding: "10px 20px" }}>Save Settings</button>
                                </form>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

export default ManagerDash;