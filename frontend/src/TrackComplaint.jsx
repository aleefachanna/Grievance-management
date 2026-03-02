import React, { useState } from 'react';
import './style.css'; // Importing the shared CSS file

const TrackComplaint = () => {
  const [complaintId, setComplaintId] = useState("");

  const handleTrack = (e) => {
    e.preventDefault();
    console.log("Tracking ID:", complaintId);
    // Add your backend fetch logic here
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
          
 <button type="submit" className="resolve-btn">
            Track Complaint
          </button>
        </form>
        
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