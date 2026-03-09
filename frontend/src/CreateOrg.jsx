import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css'; 

const CreateOrg = () => {
  const [formData, setFormData] = useState({
    orgName: '',
    cin: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    country: '',
    adminName: '',
    adminEmail: '',
    categories: [], // Array to store multiple selections
    email: '',
    phone: '',
    website: ''
  });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Organisation:", formData);
    // Integration logic goes here
  };


  const categoryOptions = [
    { label: 'For-Profit', value: 'for_profit' },
    { label: 'Non-Profit', value: 'non_profit' },
    { label: 'Government', value: 'govt' },
    { label: 'Sole Proprietorship', value: 'sole_proprietorship' },
    { label: 'Partnership', value: 'partnership' },
    { label: 'Company', value: 'company' },
    { label: 'Cooperative Society', value: 'cooperative' }
  ];

  return (
    <div className="resolve-wrapper">
      {/* Use the wide variant of the card for multi-column forms */}
      <div className="resolve-card resolve-card-wide">
        
        {/* Modern Arrow Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="resolve-back-icon-btn"
          title="Back to Home"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="resolve-logo-area">
          <span className="resolve-logo-text">ResolvePro</span>
        </div>
        
        <h2 className="resolve-header" style={{ textAlign: 'center', color: '#B76B5C' }}>
          Create New Organisation
        </h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px', fontSize: '14px' }}>
          Please provide the official details for registration.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="resolve-input-group">
            <label className="resolve-label">Organisation Name *</label>
            <input 
              className="resolve-input" 
              type="text" 
              name="orgName" 
              placeholder="Enter full legal name"
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="resolve-row">
            <div className="resolve-col">
              <div className="resolve-input-group">
                <label className="resolve-label">Select Type *</label>
                <select className="resolve-input" name="type" onChange={handleChange} required>
                  <option value="">Choose...</option>
                  <option value="corporate">Corporate</option>
                  <option value="ngo">NGO</option>
                  <option value="govt">Government</option>
                  <option value="edu">Educational</option>
                </select>
              </div>
            </div>
            <div className="resolve-col">
              <div className="resolve-input-group">
                <label className="resolve-label">Official Email *</label>
                <input 
                  className="resolve-input" 
                  type="email" 
                  name="email" 
                  placeholder="contact@org.com"
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          <div className="resolve-row">
            <div className="resolve-col">
              <div className="resolve-input-group">
                <label className="resolve-label">Contact Phone *</label>
                <input 
                  className="resolve-input" 
                  type="tel" 
                  name="phone" 
                  placeholder="+1 234 567 890"
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            <div className="resolve-col">
              <div className="resolve-input-group">
                <label className="resolve-label">Website</label>
                <input 
                  className="resolve-input" 
                  type="url" 
                  name="website" 
                  placeholder="https://www.example.com"
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>

          <div className="resolve-row">
            <div className="resolve-col">
              <div className="resolve-input-group">
                <label className="resolve-label">City *</label>
                <input className="resolve-input" type="text" name="city" onChange={handleChange} required />
              </div>
            </div>
            <div className="resolve-col">
              <div className="resolve-input-group">
                <label className="resolve-label">State *</label>
                <input className="resolve-input" type="text" name="state" onChange={handleChange} required />
              </div>
            </div>
          </div>

          <div className="resolve-input-group">
            <label className="resolve-label">Country *</label>
            <input className="resolve-input" type="text" name="country" onChange={handleChange} required />
          </div>

          <button type="submit" className="resolve-btn">
            Register Organisation
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrg; 