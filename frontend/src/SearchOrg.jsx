import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api'; // Assuming this is your axios instance

const OrganisationList = () => {
  const [organisations, setOrganisations] = useState([]);
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Fetch ALL organisations on component mount
  useEffect(() => {
    const fetchAllOrgs = async () => {
      try {
        const response = await api.get('/organisations/search/?q=');
        // Note: You might need a separate 'list' endpoint if search requires 'q'
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

  // 2. Filter list locally as user types
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
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Browse Organizations</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by organization name or city..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px'
          }}
        />
      </div>

      {loading ? (
        <p>Loading organisations...</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredOrgs.length > 0 ? (
            filteredOrgs.map((org) => (
              <div
                key={org.slug}
                onClick={() => handleSelect(org.slug)}
                style={{
                  padding: '15px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{org.name}</div>
                <div style={{ color: '#666', fontSize: '14px' }}>
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
  );
};

export default OrganisationList;