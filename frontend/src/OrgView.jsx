import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from './api';
import './style.css'; // Utilizing shared styles

function OrgView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/organisation/${slug}/`)
      .then((res) => {
        setOrg(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="resolve-wrapper" style={{ justifyContent: 'center' }}>
        <h2 style={{ color: '#2c3e50' }}>Loading Organisation...</h2>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="resolve-wrapper" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <h2 style={{ color: '#e74c3c' }}>Organisation Not Found</h2>
        <button onClick={() => navigate('/search')} className="resolve-btn" style={{ marginTop: '20px' }}>
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px', fontFamily: "'Inter', sans-serif" }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/search')}
        style={{
          background: 'none',
          border: 'none',
          color: '#3498db',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '16px',
          marginBottom: '20px',
          padding: 0
        }}
      >
        <span>←</span> Back to Search
      </button>

      {/* Organisation Profile Card */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h1 style={{ fontSize: '32px', color: '#2c3e50', margin: '0 0 10px 0' }}>{org.name}</h1>
            <span style={{
              display: 'inline-block',
              padding: '6px 12px',
              background: '#e8f4fd',
              color: '#3498db',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '20px'
            }}>
              {org.organisation_type.toUpperCase()}
            </span>
            <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
              {org.description || "No description provided."}
            </p>
          </div>

          <div style={{
            background: '#f8f9fa',
            padding: '24px',
            borderRadius: '12px',
            minWidth: '250px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '18px' }}>Contact Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#555' }}>
              <div><strong>Email:</strong> {org.official_email || 'N/A'}</div>
              <div><strong>Location:</strong> {org.city}, {org.state}, {org.country}</div>
              {org.website && <div><strong>Website:</strong> <a href={org.website} target="_blank" rel="noreferrer" style={{ color: '#3498db', textDecoration: 'none' }}>{org.website}</a></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Public Complaints Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', color: '#2c3e50', margin: 0 }}>Public Complaints</h2>
        <span style={{ color: '#7f8c8d', fontSize: '14px' }}>Showing recent active complaints</span>
      </div>

      {org.recent_complaints && org.recent_complaints.length > 0 ? (
        <div style={{ display: 'grid', gap: '20px' }}>
          {org.recent_complaints.map((complaint) => (
            <div key={complaint.complaint_id} style={{
              background: '#fff',
              border: '1px solid #ebebeb',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  background: '#f1f2f6',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  color: '#57606f',
                  fontSize: '12px'
                }}>
                  ID: {complaint.complaint_id}
                </span>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: complaint.status === 'CLOSED' ? '#e8f8f5' : (complaint.status === 'WORKING' ? '#fef9e7' : '#fdedec'),
                  color: complaint.status === 'CLOSED' ? '#27ae60' : (complaint.status === 'WORKING' ? '#f39c12' : '#e74c3c')
                }}>
                  {complaint.status}
                </span>
              </div>

              <p style={{ color: '#2c3e50', fontSize: '16px', lineHeight: '1.5', margin: '0 0 15px 0' }}>
                {complaint.description.length > 150
                  ? complaint.description.substring(0, 150) + '...'
                  : complaint.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#95a5a6', borderTop: '1px solid #f1f2f6', paddingTop: '15px' }}>
                <span>Severity: {complaint.severity}/5</span>
                <span>Reported: {new Date(complaint.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          color: '#7f8c8d'
        }}>
          <p style={{ fontSize: '18px', margin: '0 0 10px 0' }}>No public complaints found.</p>
          <p style={{ fontSize: '14px', margin: 0 }}>This organisation currently has no recent complaints on record.</p>
        </div>
      )}
    </div>
  );
}

export default OrgView;