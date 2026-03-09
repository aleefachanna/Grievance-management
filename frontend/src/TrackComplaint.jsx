import React, { useState } from 'react';
import api from './api';
import './style.css'; // Importing the shared CSS file

const TrackComplaint = () => {
  const [complaintId, setComplaintId] = useState("");
  const [complaintData, setComplaintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setComplaintData(null);
    try {
      const response = await api.get(`/complaint/track/${complaintId}/`);
      setComplaintData(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError("Complaint not found. Please check your tracking ID.");
      } else {
        setError("An error occurred while fetching the complaint details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resolve-wrapper">
      <div className="resolve-card">
        <div className="resolve-logo-area">
          <span className="resolve-logo-text">ResolvePro</span>
        </div>

        <h2 className="resolve-header">Track Your Complaint</h2>

        <form onSubmit={handleTrack}>
          <div className="resolve-input-group">
            <label className="resolve-label">Complaint ID</label>
            <input
              type="text"
              className="resolve-input"
              placeholder="e.g. RPC-99210"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              required
              style={{ textAlign: 'center' }}
            />
          </div>

          <button type="submit" className="resolve-btn" disabled={loading}>
            {loading ? "Tracking..." : "Track Complaint"}
          </button>
        </form>

        {error && <div style={{ color: "red", marginTop: "15px", textAlign: "center" }}>{error}</div>}

        {complaintData && (
          <div style={{ marginTop: "25px", padding: "20px", background: "#f8f9fa", borderRadius: "8px", borderLeft: "4px solid #3498db" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Status: {complaintData.status}</h3>
            <p style={{ margin: "5px 0" }}><strong>Organisation:</strong> {complaintData.organisation}</p>
            <p style={{ margin: "5px 0" }}><strong>Department:</strong> {complaintData.department || "Unassigned"}</p>
            <p style={{ margin: "5px 0" }}><strong>Severity:</strong> {complaintData.severity}/5</p>
            <hr style={{ margin: "15px 0", borderTop: "1px solid #ddd" }} />
            <p style={{ margin: 0, color: "#555" }}>{complaintData.description}</p>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Lost your ID? <span style={{ color: '#B76B5C', cursor: 'pointer', fontWeight: 'bold' }}>Check your email</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrackComplaint;