import React, { useEffect, useState } from "react";
import { pApi } from "./api";
import "./style2.css";

function DepDashboard() {
  const [data, setData] = useState({ dashboard: null, complaints: [], works: [] });
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [report, setReport] = useState("");
  const [activeTab, setActiveTab] = useState("works");

  // Modal states
  const [showWorkModal, setShowWorkModal] = useState(false);
  const [newWork, setNewWork] = useState({ title: "", description: "", complaint_id: "", assigned_employees: [] });
  const [submittingWork, setSubmittingWork] = useState(false);

  // Note Modal states
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [noteIsPublic, setNoteIsPublic] = useState(false);
  const [postingNote, setPostingNote] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [confirmCloseItem, setConfirmCloseItem] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [submittingClose, setSubmittingClose] = useState(false);
  const [complaintTab, setComplaintTab] = useState("active");

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    try {
      const [dash, comp, work] = await Promise.all([
        pApi.get("/department/dashboard/"),
        pApi.get("/department/complaints/"),
        pApi.get("/department/works/"),
      ]);
      setData({ dashboard: dash.data, complaints: comp.data, works: work.data });

      // If not HOD, default to 'my_complaints' on first load
      if (!dash.data.is_hod && activeTab === "works") {
        setActiveTab("my_complaints");
      }

      if (selectedComplaint) {
        const updatedComp = comp.data.find(c => c.complaint_id === selectedComplaint.complaint_id);
        if (updatedComp) setSelectedComplaint(updatedComp);
      }

      setLoading(false);
    } catch (err) { console.error(err); }
  };


  const runAIAutoManageWorks = async () => {
    setAiLoading(true);
    try {
      const res = await pApi.post("/department/ai/auto_manage_works/");
      alert(res.data.message || "AI Auto-Manage complete.");
      loadAllData();
      setActiveTab('works');
    } catch (err) {
      console.error(err);
      alert("AI Auto-Manage failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const generateAIReport = async () => {
    setAiLoading(true);
    try {
      const res = await pApi.post("/department/analyze/");
      setReport(res.data.report);
      setActiveTab("report");
    } finally { setAiLoading(false); }
  };

  const handlePurgeClosed = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete all closed work orders in this department? This cannot be undone.")) return;
    try {
      const res = await pApi.post("/department/works/purge_closed/");
      alert(res.data.message);
      loadAllData();
    } catch (err) {
      alert("Failed to purge closed works.");
    }
  };

  const runAIEmployeeAssignment = async () => {
    setAiLoading(true);
    try {
      const res = await pApi.post("/department/ai/assign_employees/");
      alert(res.data.message || "AI Auto-Assignment complete.");
      loadAllData();
    } catch (err) {
      console.error(err);
      alert("AI Assignment failed.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- WORK ACTIONS ---
  const handleUpdateWork = async (w, status) => {
    try {
      await pApi.patch(`/department/works/${w.id}/`, { status });
      loadAllData();
    } catch (err) { alert("Failed to update Work status"); }
  };

  const handleUpdateComplaint = async (c, status) => {
    const cid = c.id || c.complaint_id;
    if (status === "CLOSED") {
      setRemarks("");
      setConfirmCloseItem({ type: 'complaint', id: cid, entity: c });
      return;
    }
    try {
      await pApi.patch(`/department/complaints/${cid}/`, { status });
      loadAllData();
    } catch (err) { alert("Failed to update complaint status."); }
  };

  const submitClose = async (e) => {
    e.preventDefault();
    setSubmittingClose(true);
    try {
      if (confirmCloseItem.type === 'complaint') {
        await pApi.patch(`/department/complaints/${confirmCloseItem.id}/`, { status: "CLOSED", remarks });
      } else {
        await pApi.post(`/department/works/${confirmCloseItem.id}/complete/`, { remarks });
      }
      setConfirmCloseItem(null);
      setRemarks("");
      loadAllData();
    } catch (err) { alert("Failed to close item"); }
    finally { setSubmittingClose(false); }
  };

  const handleAssignEmployee = async (complaintId, employeeId) => {
    try {
      await pApi.post(`/department/complaints/${complaintId}/assign/`, {
        employee_ids: [employeeId]
      });
      loadAllData();
    } catch (err) {
      alert("Failed to assign employee");
    }
  };

  const handleCreateWork = async (e) => {
    e.preventDefault();
    setSubmittingWork(true);
    try {
      await pApi.post("/department/works/", newWork);
      setShowWorkModal(false);
      setNewWork({ title: "", description: "", complaint_id: "", assigned_employees: [] });
      loadAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to create work");
    } finally {
      setSubmittingWork(false);
    }
  };

  const toggleEmployeeSelection = (empId) => {
    setNewWork(prev => {
      const isSelected = prev.assigned_employees.includes(empId);
      if (isSelected) {
        return { ...prev, assigned_employees: prev.assigned_employees.filter(id => id !== empId) };
      } else {
        return { ...prev, assigned_employees: [...prev.assigned_employees, empId] };
      }
    });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    setPostingNote(true);
    try {
      // Use internal ID if exists, fallback to complaint_id
      const actualId = selectedComplaint.id || selectedComplaint.complaint_id;
      await pApi.post(`/department/complaints/${actualId}/add_update/`, {
        message: newNote,
        is_public: noteIsPublic
      });
      setNewNote("");
      setNoteIsPublic(false);
      loadAllData();
    } catch (err) {
      alert("Failed to add note");
    } finally {
      setPostingNote(false);
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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  if (loading) return <div className="loader">Loading Department Assets...</div>;

  const { dashboard, complaints, works } = data;

  return (
    <div className="admin-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h2>{dashboard.department}</h2>
        <div className="sidebar-group">
          <small className="sidebar-label">FOR ME</small>
          <button className={activeTab === 'my_complaints' ? 'active' : ''} onClick={() => setActiveTab('my_complaints')}>My Complaints</button>
          <button className={activeTab === 'my_works' ? 'active' : ''} onClick={() => setActiveTab('my_works')}>My Works</button>
        </div>

        <div className="sidebar-group">
          <small className="sidebar-label">DEPARTMENT</small>
          <button className={activeTab === 'complaints' ? 'active' : ''} onClick={() => setActiveTab('complaints')}>All Complaints</button>
          <button className={activeTab === 'works' ? 'active' : ''} onClick={() => setActiveTab('works')}>All Works</button>
        </div>
        
        {dashboard.is_hod && (
          <div className="sidebar-group">
            <small className="sidebar-label">MANAGEMENT</small>
            <button className={activeTab === 'report' ? 'active' : ''} onClick={() => setActiveTab('report')}>AI Summary Report</button>
          </div>
        )}

        <div className="sidebar-group">
          <small className="sidebar-label">PREFERENCES</small>
          <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Account Settings</button>
        </div>
        <div style={{ marginTop: "auto" }}>
          <button onClick={handleLogout} style={{ 
            width: "100%", 
            padding: "12px", 
            background: "rgba(231, 76, 60, 0.9)", 
            color: "white", 
            border: "1px solid rgba(231, 76, 60, 0.3)", 
            borderRadius: "8px", 
            cursor: "pointer", 
            fontWeight: "bold", 
            transition: "all 0.3s ease" 
          }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-viewport">
        <header className="top-nav">
          <div className="stats-header">
            <span><strong>Tasks:</strong> {dashboard.works_count}</span>
            <span><strong>Issues:</strong> {dashboard.complaints_count}</span>
          </div>
          <div className="user-profile">
            <div className="user-info-text">
              <div className="user-name">{dashboard.employee_name}</div>
              <div>
                <span className="profile-badge">{dashboard.is_hod ? "HOD" : "Staff Account"}</span>
              </div>
            </div>
            <div className="profile-avatar">
              {dashboard.employee_name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Action Bar for HOD */}
        {dashboard.is_hod && (
          <div className="action-bar">
            <button onClick={() => setShowWorkModal(true)} className="resolve-btn" style={{ background: '#27ae60' }}>+ Create Work</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button disabled={aiLoading} onClick={runAIAutoManageWorks} className="ai-btn" style={{ background: '#e67e22' }}>🪄 AI Auto-Manage Works</button>
              <button disabled={aiLoading} onClick={runAIEmployeeAssignment} className="ai-btn" style={{ background: '#8e44ad' }}>✨ AI Auto-Assign Staff</button>
              <button disabled={aiLoading} onClick={generateAIReport} className="report-btn">📊 Generate AI Summary</button>
              <button onClick={handlePurgeClosed} className="report-btn" style={{ background: '#e74c3c', color: 'white', border: 'none' }}>🗑️ Purge Closed Works</button>
            </div>
          </div>
        )}

        {/* Create Work Modal */}
        {showWorkModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
              <h3 style={{ marginTop: 0 }}>Create New Work</h3>
              <form onSubmit={handleCreateWork}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Title</label>
                  <input required value={newWork.title} onChange={e => setNewWork({ ...newWork, title: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                  <textarea value={newWork.description} onChange={e => setNewWork({ ...newWork, description: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Link Complaint (Optional)</label>
                  <select value={newWork.complaint_id} onChange={e => setNewWork({ ...newWork, complaint_id: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <option value="">-- No Complaint Linked --</option>
                    {complaints.filter(c => c.status !== 'CLOSED').map(c => (
                      <option key={c.id} value={c.id}>{c.complaint_id}: {c.description.substring(0, 30)}...</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px' }}>Assign Employees</label>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '4px' }}>
                    {dashboard.employees.map(emp => (
                      <label key={emp.id} style={{ display: 'block', marginBottom: '5px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newWork.assigned_employees.includes(emp.id)}
                          onChange={() => toggleEmployeeSelection(emp.id)}
                          style={{ marginRight: '8px' }}
                        />
                        {emp.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowWorkModal(false)} style={{ padding: '8px 16px', border: 'none', background: '#e0e0e0', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={submittingWork} style={{ padding: '8px 16px', border: 'none', background: '#3498db', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                    {submittingWork ? 'Creating...' : 'Create Work'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmCloseItem && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200
          }}>
            <form onSubmit={submitClose} style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
              <h3 style={{ marginTop: 0, color: '#e74c3c' }}>Confirm Closure</h3>
              <p style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '15px' }}>
                {confirmCloseItem.type === 'work' 
                  ? `Are you sure you want to close Work "${confirmCloseItem.entity.title}"?` 
                  : `Are you sure you want to close Complaint ${confirmCloseItem.entity.complaint_id}?`}
              </p>

              {confirmCloseItem.type === 'work' && confirmCloseItem.entity.complaints?.length > 0 && (
                <div style={{ padding: '12px', background: '#ffebeb', color: '#c62828', borderRadius: '8px', marginBottom: '20px', fontSize: '12px', border: '1px solid #ffcdd2' }}>
                  <strong>⚠️ IMPACT WARNING:</strong> This work order has <strong>{confirmCloseItem.entity.complaints.length}</strong> linked complaints. Proceeding will mark ALL of them as <strong>CLOSED</strong> and notify the respective residents.
                </div>
              )}
              
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label>Remarks (optional)</label>
                <textarea 
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit' }}
                  placeholder="These remarks will be attached to the notification email..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setConfirmCloseItem(null)} style={{ padding: '8px 16px', border: '1px solid #ccc', background: 'transparent', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submittingClose} style={{ padding: '8px 16px', border: 'none', background: '#27ae60', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                  {submittingClose ? 'Closing...' : 'Close & Notify'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notes & Detail Modal */}
        {selectedComplaint && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Complaint: {selectedComplaint.complaint_id}</h3>
                <button onClick={() => setSelectedComplaint(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                <p style={{ margin: '0 0 10px 0' }}>{selectedComplaint.description}</p>
                {selectedComplaint.attachment && (
                  <a href={selectedComplaint.attachment} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#3498db', color: 'white', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px' }}>
                    📎 View Attachment
                  </a>
                )}
              </div>

              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Linked Department Works</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                {selectedComplaint.works && selectedComplaint.works.length > 0 ? (
                  selectedComplaint.works.map(w => (
                    <span key={w.id} style={{ background: '#e8f4fd', color: '#2980b9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #c5e1f5' }}>
                      {w.title}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: '13px', color: '#95a5a6' }}>No Works linked natively.</span>
                )}
                {dashboard.is_hod && selectedComplaint.status !== "CLOSED" && (
                    <select 
                      onChange={async (e) => {
                        if (!e.target.value) return;
                        try {
                          await pApi.post(`/department/complaints/${selectedComplaint.id || selectedComplaint.complaint_id}/assign_work/`, { work_id: e.target.value });
                          alert("Work linked successfully!");
                          loadAllData();
                        } catch (err) { alert("Failed to link Work"); }
                      }} 
                      value="" 
                      style={{ fontSize: '11px', padding: '3px 6px', borderRadius: '4px', border: '1px solid #ccc', marginLeft: 'auto' }}
                    >
                      <option value="" disabled>Link to Work...</option>
                      {works.filter(w => w.status !== "CLOSED").map(work => (
                          <option key={work.id} value={work.id}>{work.title}</option>
                      ))}
                    </select>
                )}
              </div>

              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Communication Log</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {selectedComplaint.updates && selectedComplaint.updates.length > 0 ? (
                  selectedComplaint.updates.map(u => (
                    <div key={u.id} style={{ background: u.is_public ? '#e8f4fd' : '#fef9e7', padding: '10px', borderRadius: '6px', border: '1px solid #eee' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7f8c8d', marginBottom: '4px' }}>
                        <span><strong>{u.author}</strong> {u.is_public ? '(Public)' : '(Internal)'}</span>
                        <span>{new Date(u.created_at).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#2c3e50' }}>{u.message}</p>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '13px', color: '#95a5a6' }}>No updates logged yet.</span>
                )}
              </div>

              <h4 style={{ margin: '0 0 10px 0' }}>Add Note</h4>
              <form onSubmit={handleAddNote}>
                <textarea required value={newNote} onChange={e => setNewNote(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '60px', marginBottom: '10px' }} placeholder="Type an update or internal note..." />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={noteIsPublic} onChange={e => setNoteIsPublic(e.target.checked)} />
                    Make visible to Public Timeline
                  </label>
                  <button type="submit" disabled={postingNote} style={{ padding: '6px 16px', border: 'none', background: '#27ae60', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                    {postingNote ? 'Saving...' : 'Post Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="content-card">
          {(activeTab === "works" || activeTab === "my_works") && (
            <section>
              <h3>{activeTab === 'works' ? 'Active Work Orders' : 'My Work Orders'}</h3>
              <table className="data-table">
                <thead><tr><th>Title</th><th>Description</th><th>Assigned To</th><th>Status / Flow</th></tr></thead>
                <tbody>
                  {(activeTab === 'my_works' ? works.filter(w=>w.assigned_employees.some(e=>String(e.id)===String(dashboard.current_employee_id))) : works).map(w => (
                    <tr key={w.id}>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2c3e50' }}>{w.title}</div>
                        {w.complaints?.length > 0 && (
                          <div style={{ marginTop: '5px', padding: '8px', background: 'rgba(52, 152, 219, 0.05)', borderRadius: '6px', border: '1px solid rgba(52, 152, 219, 0.1)' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', color: '#3498db', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>LINKED COMPLAINTS:</span>
                            <ul style={{ margin: 0, paddingLeft: '14px', listStyle: 'disc' }}>
                              {w.complaints.map(c => (
                                <li key={c.id} style={{ fontSize: '10px', color: '#34495e', marginBottom: '2px' }}>
                                  <strong>{c.complaint_id}:</strong> {c.summary}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.description}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                          {w.assigned_employees && w.assigned_employees.length > 0
                            ? w.assigned_employees.map(e => <span key={e.id} style={{ background: '#eee', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', margin: '2px', display: 'inline-block' }}>{e.name}</span>)
                            : <span style={{ color: '#999', fontStyle: 'italic', fontSize: '12px' }}>Unassigned</span>
                          }
                          </div>
                          {dashboard.is_hod && w.status !== "CLOSED" && (
                            <select 
                              onChange={async (e) => {
                                if (!e.target.value) return;
                                try {
                                  await pApi.post(`/department/works/${w.id}/assign/`, { employee_id: e.target.value });
                                  loadAllData();
                                } catch (err) { alert("Failed to assign employee to work"); }
                              }} 
                              value="" 
                              style={{ fontSize: '10px', padding: '2px', borderRadius: '4px', border: '1px solid #ccc', maxWidth: '120px' }}
                            >
                              <option value="" disabled>+ Assign...</option>
                              {dashboard.employees?.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td>
                        {w.status === "CLOSED" ? (
                          <span className="pill closed" style={{ background: '#2ecc71', color: 'white' }}>CLOSED</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="pill" style={{ background: w.status === 'PENDING' ? '#f1c40f' : '#3498db', color: '#fff', fontSize: '10px' }}>{w.status}</span>
                            {(dashboard.is_hod || w.assigned_employees?.some(e => String(e.id) === String(dashboard.current_employee_id))) && (
                              <select 
                                onChange={e => {
                                  if (e.target.value === "CLOSED") {
                                    setRemarks("");
                                    setConfirmCloseItem({ type: 'work', id: w.id, entity: w });
                                    e.target.value = "";
                                  } else {
                                    handleUpdateWork(w, e.target.value);
                                  }
                                }} 
                                value="" 
                                style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '11px', outline: 'none' }}
                              >
                                <option value="" disabled>Update...</option>
                                {w.status === 'PENDING' && <option value="IN_PROGRESS">Start Work</option>}
                                <option value="CLOSED">Finish & Close</option>
                              </select>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === "my_complaints" && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>My Assigned Complaints</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setComplaintTab('active')} className={complaintTab === 'active' ? 'active' : ''} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', background: complaintTab === 'active' ? 'var(--accent-primary)' : 'transparent', color: 'white' }}>Active</button>
                  <button onClick={() => setComplaintTab('closed')} className={complaintTab === 'closed' ? 'active' : ''} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', background: complaintTab === 'closed' ? 'var(--accent-primary)' : 'transparent', color: 'white' }}>Closed</button>
                </div>
              </div>
              <div className="complaint-grid">
                {complaints.filter(c => (complaintTab === 'closed' ? c.status === "CLOSED" : c.status !== "CLOSED") && c.assigned_employees?.some(e => String(e.id) === String(dashboard.current_employee_id))).map(c => {
                  const isOverdue = c.deadline && new Date(c.deadline) < new Date() && c.status !== 'CLOSED';
                  return (
                    <div key={c.id || c.complaint_id} className={`complaint-box ${isOverdue ? 'overdue' : ''}`}>
                      <div className="complaint-info-main">
                        <span className="complaint-id">#{c.complaint_id}</span>
                        {c.deadline && (
                          <span className="complaint-deadline">
                            📅 {new Date(c.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div className="complaint-description-brief">
                        {c.description}
                      </div>

                      <div className="box-footer">
                        <span className={`status-pill status-${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                        
                        <span className="assigned-badge">FOR ME</span>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setSelectedComplaint(c)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            Details
                          </button>
                          
                          {c.status === "PENDING" && (
                            <button onClick={() => handleUpdateComplaint(c, "WORKING")} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                              Start
                            </button>
                          )}
                          
                          {c.status !== "CLOSED" && (
                            <button onClick={() => handleUpdateComplaint(c, "CLOSED")} style={{ background: dashboard.is_hod ? '#2ecc71' : '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                              {dashboard.is_hod ? "Close" : "Request Close"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {activeTab === "complaints" && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>All Department Complaints</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setComplaintTab('active')} className={complaintTab === 'active' ? 'active' : ''} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', background: complaintTab === 'active' ? 'var(--accent-primary)' : 'transparent', color: 'white' }}>Active</button>
                  <button onClick={() => setComplaintTab('closed')} className={complaintTab === 'closed' ? 'active' : ''} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', background: complaintTab === 'closed' ? 'var(--accent-primary)' : 'transparent', color: 'white' }}>Closed</button>
                </div>
              </div>
              <div className="complaint-grid">
                {complaints.filter(c => (complaintTab === 'closed' ? c.status === "CLOSED" : c.status !== "CLOSED")).map(c => {
                  const isOverdue = c.deadline && new Date(c.deadline) < new Date() && c.status !== 'CLOSED';
                  const isAssignedToMe = c.assigned_employees?.some(e => String(e.id) === String(dashboard.current_employee_id));
                  return (
                    <div key={c.id || c.complaint_id} className={`complaint-box ${isOverdue ? 'overdue' : ''}`}>
                      <div className="complaint-info-main">
                        <span className="complaint-id">#{c.complaint_id}</span>
                        {c.deadline && (
                          <span className="complaint-deadline">
                            📅 {new Date(c.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {isAssignedToMe && <span className="assigned-badge" style={{ width: 'max-content', marginTop: '4px' }}>FOR ME</span>}
                      </div>

                      <div className="complaint-description-brief">
                        {c.description}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: '600' }}>
                          👤 {c.assigned_employees?.map(e => e.name).join(", ") || "Unassigned"}
                        </div>
                      </div>

                      <div className="box-footer">
                        <span className={`status-pill status-${c.status.toLowerCase()}`}>
                          {c.status}
                        </span>
                        
                        {dashboard.is_hod && c.status !== "CLOSED" && (
                          <select 
                            onChange={(e) => handleAssignEmployee(c.id || c.complaint_id, e.target.value)} 
                            value="" 
                            style={{ fontSize: '11px', padding: '6px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
                          >
                            <option value="" disabled>Assign...</option>
                            {dashboard.employees?.map(emp => (
                                <option key={emp.id} value={emp.id} style={{ background: 'var(--bg-secondary)' }}>{emp.name}</option>
                            ))}
                          </select>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setSelectedComplaint(c)} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            Details
                          </button>
                          
                          {(dashboard.is_hod || isAssignedToMe) && c.status !== "CLOSED" && (
                            <>
                              {c.status === "PENDING" && (
                                <button onClick={() => handleUpdateComplaint(c, "WORKING")} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                  Start
                                </button>
                              )}
                              <button onClick={() => handleUpdateComplaint(c, "CLOSED")} style={{ background: dashboard.is_hod ? '#2ecc71' : '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                                {dashboard.is_hod ? "Close" : "Request Close"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {activeTab === "report" && (
            <section className="ai-report-view">
              <h3>Department Intelligence Report</h3>
              <div className="report-text">
                {/* Check if report exists and has the keys before rendering */}
                {report ? (
                  <>
                    <div className="report-summary">
                      <strong>Summary:</strong>
                      <p>{report.summary || report.report || "No summary available"}</p>
                    </div>

                    {report.tasks && (
                      <div className="report-tasks">
                        <strong>Suggested Tasks:</strong>
                        <p>{report.tasks}</p>
                      </div>
                    )}
                  </>
                ) : (
                  "No report generated yet. Click 'Generate AI Summary'."
                )}
              </div>
            </section>
          )}

          {activeTab === "settings" && (
            <section>
              <h3>Account Settings</h3>
              <div style={{ marginBottom: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px", border: "1px solid #e1e4e8" }}>
                <h4>Change Password</h4>
                <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
                  <input type="password" placeholder="Old Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }} />
                  <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "6px" }} />
                  <button type="submit" className="resolve-btn" style={{ alignSelf: "flex-start", margin: 0, padding: "10px 20px", background: "#3498db" }}>Update Password</button>
                </form>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default DepDashboard;