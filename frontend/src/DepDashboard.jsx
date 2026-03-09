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

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    try {
      const [dash, comp, work] = await Promise.all([
        pApi.get("/department/dashboard/"),
        pApi.get("/department/complaints/"),
        pApi.get("/department/works/"),
      ]);
      setData({ dashboard: dash.data, complaints: comp.data, works: work.data });
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  // --- AI ACTIONS ---
  const runAIAssignment = async () => {
    setAiLoading(true);
    try {
      const res = await pApi.post("/department/ai-assign/");
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
                {complaints.map(c => (
                  <div key={c.id} className="complaint-box">
                    <p>{c.description}</p>
                    <div className="box-footer" style={{ flexWrap: 'wrap', gap: '10px' }}>
                      <span className={`status-${c.status.toLowerCase()}`}>{c.status}</span>

                      <div style={{ display: 'flex', gap: '5px', ml: 'auto' }}>
                        {c.status === "PENDING" && !dashboard.is_hod && (
                          <button onClick={() => handleUpdateComplaint(c.id, "WORKING")} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            Start Working
                          </button>
                        )}
                        {c.status !== "CLOSED" && (
                          <button onClick={() => handleUpdateComplaint(c.id, "CLOSED")} style={{ background: dashboard.is_hod ? '#2ecc71' : '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                            {dashboard.is_hod ? "Close Issue" : "Request Close"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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