import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './style.css';

const OrganisationList = () => {
  const [organisations, setOrganisations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllOrgs = async () => {
      try {
        const response = await api.get('/organisations/search/?q=');
        setOrganisations(response.data.results);
        setFilteredOrgs(response.data.results);
      } catch (error) {
        console.error("Error fetching organisations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllOrgs();
  }, []);

  useEffect(() => {
    const results = organisations.filter(org =>
      org.name.toLowerCase().includes(query.toLowerCase()) ||
      org.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredOrgs(results);
  }, [query, organisations]);

  const handleSelect = (slug) => {
    if (slug) navigate(`/organisation/${slug}`);
  };

  return (
    <div className="resolve-wrapper">
      <div className="resolve-card" style={{ maxWidth: '800px', width: '100%' }}>
        
        {/* Back Button */}
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

        <h2 className="resolve-header">Browse Organizations</h2>

        <div className="resolve-input-group">
          <input
            type="text"
            className="resolve-input"
            placeholder="Search by name or city..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading organisations...</div>
        ) : (
          <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
            {filteredOrgs.length > 0 ? (
              filteredOrgs.map((org) => (
                <div
                  key={org.slug}
                  onClick={() => handleSelect(org.slug)}
                  className="resolve-org-item"
                  style={{
                    padding: '15px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: 'rgba(255,255,255,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#fff' }}>{org.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                    {org.type} • {org.location}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#999' }}>No matches found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganisationList;