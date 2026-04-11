import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from './api';
import './style.css';

const SubmitGrievance = () => {
  const [formData, setFormData] = useState({
    email: '',
    organisation: '',
    description: '',
    attachment: null
  });
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const presetOrgId = queryParams.get('orgId');

  useEffect(() => {
    // Fetch organisations for the dropdown
    const fetchOrgs = async () => {
      try {
        const response = await api.get('/organisations/search/?q=');
        setOrganisations(response.data.results);
      } catch (err) {
        console.error("Failed to fetch organisations", err);
      }
    };
    fetchOrgs();

    if (presetOrgId) {
      setFormData(prev => ({ ...prev, organisation: presetOrgId }));
    }
  }, [presetOrgId]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const formDataToSend = new FormData();
    formDataToSend.append('email', formData.email);
    
    // formData.organisation now directly contains the ID from the <select>
    formDataToSend.append('organisation', formData.organisation);
    formDataToSend.append('description', formData.description);

    if (formData.attachment) {
      formDataToSend.append('attachment', formData.attachment);
    }

    const response = await api.post("/complaint/submit/", formDataToSend, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setSuccessId(response.data.complaint_id);
  } catch (err) {
    setError(err.response?.data?.error || "Failed to submit grievance");
  } finally {
    setLoading(false);
  }
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

        {error && <div style={{ color: "red", marginBottom: "15px", textAlign: "center" }}>{error}</div>}

        {successId ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <h3 style={{ color: "#2ecc71" }}>Grievance Submitted!</h3>
            <p>Your tracking ID is:</p>
            <div style={{ background: "#f4f4f4", padding: "10px", margin: "10px 0", fontSize: "1.2rem", fontWeight: "bold", borderLeft: "4px solid #2ecc71" }}>
              {successId}
            </div>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>Please save this ID to track your complaint later.</p>
            <button onClick={() => navigate("/")} className="resolve-btn" style={{ marginTop: "20px" }}>
              Back to Home
            </button>
          </div>
        ) : (
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
                disabled={!!presetOrgId}
                style={presetOrgId ? { background: "#e8ecef", color: "#666", cursor: "not-allowed" } : {}}
              >
                <option value="">-- Choose Organisation --</option>
                {organisations.map(org => (
                  /* Use org.id as the value instead of org.slug */
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
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

            <div className="resolve-input-group">
              <label className="resolve-label">Evidence / Attachment (Optional)</label>
              <input
                type="file"
                className="resolve-input"
                style={{ padding: '8px' }}
                onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] })}
                accept="image/*,.pdf,.doc,.docx"
              />
            </div>

            <button type="submit" className="resolve-btn" disabled={loading}>
              {loading ? "Submitting..." : "Submit Complaint"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubmitGrievance;