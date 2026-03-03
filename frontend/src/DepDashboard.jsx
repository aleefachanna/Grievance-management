import React, { useEffect, useState } from "react";
import { pApi } from "./api";
import "./style2.css";

function DepDashboard() {
  const [data, setData] = useState({ dashboard: null, complaints: [], works: [] });
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [report, setReport] = useState("");
  const [activeTab, setActiveTab] = useState("works");

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
            <button disabled={aiLoading} onClick={runAIAssignment} className="ai-btn">✨ Run AI Work Assign</button>
            <button disabled={aiLoading} onClick={generateAIReport} className="report-btn">📊 Generate AI Summary</button>
          </div>
        )}

        <div className="content-card">
          {activeTab === "works" && (
            <section>
              <h3>Active Work Orders</h3>
              <table className="data-table">
                <thead><tr><th>Title</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {works.map(w => (
                    <tr key={w.id}>
                      <td>{w.title}</td>
                      <td><span className={`pill ${w.status}`}>{w.status}</span></td>
                      <td>
                        {w.status !== "DONE" && <button onClick={() => handleCompleteWork(w.id)}>Complete</button>}
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
                    <div className="box-footer">
                      <span className={`status-${c.status.toLowerCase()}`}>{c.status}</span>
                      {c.status !== "CLOSED" && (
                        <button onClick={() => handleUpdateComplaint(c.id, "CLOSED")}>
                          {dashboard.is_hod ? "Close" : "Request Close"}
                        </button>
                      )}
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