import React, { useEffect, useState } from "react";
import api from "./api";

function DepDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [works, setWorks] = useState([]);
  const [error, setError] = useState("");

  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [newWorkDescription, setNewWorkDescription] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [dashRes, compRes, workRes] = await Promise.all([
        api.get("/department/dashboard/"),
        api.get("/department/complaints/"),
        api.get("/department/works/"),
      ]);

      setDashboard(dashRes.data);
      setComplaints(compRes.data);
      setWorks(workRes.data);
    } catch (err) {
      handleError(err);
    }
  };

  const handleError = (err) => {
    console.error(err);
    if (err.response?.status === 401) {
      window.location.href = "/employee-login";
    } else {
      setError("Something went wrong.");
    }
  };

  // ==============================
  // WORK ACTIONS
  // ==============================

  const createWork = async () => {
    try {
      await api.post("/department/works/", {
        title: newWorkTitle,
        description: newWorkDescription,
      });

      setNewWorkTitle("");
      setNewWorkDescription("");
      loadAllData();
    } catch (err) {
      handleError(err);
    }
  };

  const assignEmployee = async (workId, employeeId) => {
    if (!employeeId) return;

    try {
      await api.post(`/department/works/${workId}/assign/`, {
        employee_id: employeeId,
      });

      loadAllData();
    } catch (err) {
      handleError(err);
    }
  };

  const completeWork = async (workId) => {
    try {
      await api.post(`/department/works/${workId}/complete/`);
      loadAllData();
    } catch (err) {
      handleError(err);
    }
  };

  // ==============================
  // COMPLAINT ACTIONS
  // ==============================

  const closeComplaint = async (complaintId) => {
    try {
      await api.patch(`/department/complaints/${complaintId}/`, {
        status: "CLOSED",
      });

      loadAllData();
    } catch (err) {
      handleError(err);
    }
  };

  if (!dashboard) return <h3>Loading...</h3>;

  return (
    <div style={{ padding: "40px" }}>
      <h2>{dashboard.department} Dashboard</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* ============================= */}
      {/* COMPLAINTS SECTION */}
      {/* ============================= */}
      <section>
        <h3>Complaints</h3>
        {complaints.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid gray",
              margin: "10px 0",
              padding: "10px",
            }}
          >
            <p><strong>Status:</strong> {c.status}</p>
            <p>{c.description}</p>

            {dashboard.is_hod && c.status !== "CLOSED" && (
              <button onClick={() => closeComplaint(c.id)}>
                Close Complaint
              </button>
            )}
          </div>
        ))}
      </section>

      {/* ============================= */}
      {/* WORKS SECTION */}
      {/* ============================= */}
      <section>
        <h3>Department Works</h3>

        {works.map((w) => (
          <div
            key={w.id}
            style={{
              border: "1px solid blue",
              margin: "10px 0",
              padding: "10px",
            }}
          >
            <p><strong>{w.title}</strong></p>
            <p>Status: {w.status}</p>

            {w.status !== "DONE" && (
              <button onClick={() => completeWork(w.id)}>
                Mark Done
              </button>
            )}

            {dashboard.is_hod && (
              <div style={{ marginTop: "10px" }}>
                <select
                  onChange={(e) => assignEmployee(w.id, e.target.value)}
                >
                  <option value="">Assign Employee</option>
                  {dashboard.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* ============================= */}
      {/* CREATE WORK (HOD ONLY) */}
      {/* ============================= */}
      {dashboard.is_hod && (
        <section style={{ marginTop: "30px" }}>
          <h3>Create New Work</h3>

          <input
            type="text"
            placeholder="Title"
            value={newWorkTitle}
            onChange={(e) => setNewWorkTitle(e.target.value)}
          />
          <br />

          <textarea
            placeholder="Description"
            value={newWorkDescription}
            onChange={(e) => setNewWorkDescription(e.target.value)}
          />
          <br />

          <button onClick={createWork}>Create Work</button>
        </section>
      )}
    </div>
  );
}

export default DepDashboard;