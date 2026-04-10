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

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    try {
      const [dash, comp, work] = await Promise.all([
        pApi.get("/department/dashboard/"),
        pApi.get("/department/complaints/"),
        pApi.get("/department/works/"),
      ]);
      setData({ dashboard: dash.data, complaints: comp.data, works: work.data });

      if (selectedComplaint) {
        const updatedComp = comp.data.find(c => c.complaint_id === selectedComplaint.complaint_id);
        if (updatedComp) setSelectedComplaint(updatedComp);
      }

      setLoading(false);
    } catch (err) { console.error(err); }
  };

  // --- AI ACTIONS ---
  const runAIAssignment = async () => {
    setAiLoading(true);
    try {
      const res = await pApi.post("/department/ai/assign/");
      alert("AI Suggestion: " + JSON.stringify(res.data));
      loadAllData();
    } finally { setAiLoading(false); }
  };

  const generateAIReport = async () => {
    setAiLoading(true);
    try {
      const res = await pApi.post("/department/analyze/");
      setReport(res.data.report);
      setActiveTab("report");
    } finally { setAiLoading(false); }
  };

  // --- WORK ACTIONS ---
  const handleCompleteWork = async (id) => {
    await pApi.post(`/department/works/${id}/complete/`);
    loadAllData();
  };

  const handleUpdateComplaint = async (id, status) => {
    await pApi.patch(`/department/complaints/${id}/`, { status });
    loadAllData();
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

  if (loading) return <div className="loader">Loading Department Assets...</div>;

  const { dashboard, complaints, works } = data;

  return (
    <div className="admin-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h2>{dashboard.department}</h2>
        <nav>
          <button className={activeTab === 'works' ? 'active' : ''} onClick={() => setActiveTab('works')}>Department Works</button>
          <button className={activeTab === 'complaints' ? 'active' : ''} onClick={() => setActiveTab('complaints')}>Complaints</button>
          {dashboard.is_hod && (
            <button className={activeTab === 'report' ? 'active' : ''} onClick={() => setActiveTab('report')}>AI Analysis</button>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-viewport">
        <header className="top-nav">
          <div className="stats-header">
            <span><strong>Tasks:</strong> {dashboard.works_count}</span>
            <span><strong>Issues:</strong> {dashboard.complaints_count}</span>
          </div>
          <div className="user-profile">
            <span className="badge">{dashboard.is_hod ? "HOD" : "Staff"}</span>
          </div>
        </header>

        {/* Action Bar for HOD */}
        {dashboard.is_hod && (
          <div className="action-bar">
            <button onClick={() => setShowWorkModal(true)} className="resolve-btn" style={{ background: '#27ae60' }}>+ Create Work</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button disabled={aiLoading} onClick={runAIAssignment} className="ai-btn">✨ Run AI Work Assign</button>
              <button disabled={aiLoading} onClick={generateAIReport} className="report-btn">📊 Generate AI Summary</button>
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
          {activeTab === "works" && (
            <section>
              <h3>Active Work Orders</h3>
              <table className="data-table">
                <thead><tr><th>Title</th><th>Description</th><th>Assigned To</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {works.map(w => (
                    <tr key={w.id}>
                      <td>{w.title}
                        {w.complaint && <div style={{ fontSize: '11px', color: '#7f8c8d' }}>For: {w.complaint}</div>}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.description}</td>
                      <td>
                        {w.assigned_employees && w.assigned_employees.length > 0
                          ? w.assigned_employees.map(e => <span key={e.id} style={{ background: '#eee', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', margin: '2px', display: 'inline-block' }}>{e.name}</span>)
                          : <span style={{ color: '#999', fontStyle: 'italic', fontSize: '12px' }}>Unassigned</span>
                        }
                      </td>
                      <td><span className={`pill ${w.status}`}>{w.status}</span></td>
                      <td>
                        {w.status !== "DONE" && <button className="resolve-btn" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleCompleteWork(w.id)}>Mark Done</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === "complaints" && (
            <section>
              <h3>Public Complaints</h3>
              <div className="complaint-grid">
                {complaints.map(c => {
                  const isOverdue = c.deadline && new Date(c.deadline) < new Date() && c.status !== 'CLOSED';
                  return (
                    <div key={c.id || c.complaint_id} className="complaint-box" style={{ position: 'relative', border: isOverdue ? '1px solid #e74c3c' : '1px solid #e1e4e8' }}>
                      {isOverdue && (
                        <span style={{ position: 'absolute', top: '-10px', right: '10px', background: '#e74c3c', color: 'white', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>OVERDUE</span>
                      )}
                      <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50', display: 'flex', justifyContent: 'space-between' }}>
                        ID: {c.complaint_id}
                        {c.deadline && <span style={{ fontSize: '11px', color: '#7f8c8d', fontWeight: 'normal' }}>Due: {new Date(c.deadline).toLocaleDateString()}</span>}
                      </h5>
                      <p style={{ marginBottom: '15px' }}>{c.description.substring(0, 100)}{c.description.length > 100 ? '...' : ''}</p>
                      <div className="box-footer" style={{ flexWrap: 'wrap', gap: '10px' }}>
                        <span className={`status-${c.status.toLowerCase()}`}>{c.status}</span>
                        <button onClick={() => setSelectedComplaint(c)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                          Notes & Details
                        </button>

                        <div style={{ display: 'flex', gap: '5px', ml: 'auto' }}>
                          {c.status === "PENDING" && !dashboard.is_hod && (
                            <button onClick={() => handleUpdateComplaint(c.id || c.complaint_id, "WORKING")} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              Start Working
                            </button>
                          )}
                          {c.status !== "CLOSED" && (
                            <button onClick={() => handleUpdateComplaint(c.id || c.complaint_id, "CLOSED")} style={{ background: dashboard.is_hod ? '#2ecc71' : '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              {dashboard.is_hod ? "Close Issue" : "Request Close"}
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
        </div>
      </main>
    </div>
  );
}

export default DepDashboard;