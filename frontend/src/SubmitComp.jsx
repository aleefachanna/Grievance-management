import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css'; 

const SubmitGrievance = () => {
  const [formData, setFormData] = useState({
    email: '',
    organisation: '',
    description: ''
  });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Grievance Submitted:", formData);
  };

  return (
    <div className="resolve-wrapper">
      <div className="resolve-card">
        {/* Modern Arrow Back Button based on Noun Project reference */}
        <button 
          onClick={() => navigate('/')}
          className="resolve-back-icon-btn"
          title="Back to Home"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
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
        
        <h2 className="resolve-header">Submit a Grievance</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="resolve-input-group">
            <label className="resolve-label">Your Email</label>
            <input
              type="email"
              className="resolve-input"
              placeholder="name@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="resolve-input-group">
            <label className="resolve-label">Select Organisation</label>
            <select
              className="resolve-input"
              value={formData.organisation}
              onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
              required
            >
              <option value="">-- Choose Organisation --</option>
              <option value="org1">Health Department</option>
              <option value="org2">Education Board</option>
              <option value="org3">Public Works</option>
            </select>
          </div>

          <div className="resolve-input-group">
            <label className="resolve-label">Describe your issue</label>
            <textarea
              className="resolve-input"
              style={{ minHeight: '120px', resize: 'vertical' }}
              placeholder="Provide details about your grievance..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          
          <button type="submit" className="resolve-btn">
            Submit Complaint
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubmitGrievance;