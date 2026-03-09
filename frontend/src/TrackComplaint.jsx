import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';

const TrackComplaint = () => {
  const [complaintId, setComplaintId] = useState("");
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    console.log("Tracking ID:", complaintId);
    // Add backend fetch logic here
  };

  return (
    <div className="resolve-wrapper">
      <div className="resolve-card">

        {/* Back to Home Button */}
        <button 
          onClick={() => navigate('/')}
          className="resolve-back-icon-btn"
          title="Back to Home"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path 
              d="M19 12H5M5 12L12 19M5 12L12 5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>

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

          <button type="submit" className="resolve-btn">
            Track Complaint
          </button>
        </form>

        <div style={{ marginTop: '20px' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Lost your ID? 
            <span style={{ color: '#859E75', cursor: 'pointer', fontWeight: 'bold' }}>
              {" "}Check your email
            </span>
          </p>
        </div>

      </div>
    </div>
  );
};

export default TrackComplaint;