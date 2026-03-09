import React, { useState } from 'react';
import { api } from './api';
import './CreateOrg.css';

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

  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Specialized handler for multiple checkboxes
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    const { categories } = formData;

    if (checked) {
      setFormData({ ...formData, categories: [...categories, value] });
    } else {
      setFormData({ ...formData, categories: categories.filter((cat) => cat !== value) });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/organisation/create/', formData);
      setSuccessData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create organisation");
    } finally {
      setLoading(false);
    }
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

  if (successData) {
    return (
      <div className="wrapper">
        <div className="card" style={{ textAlign: "center" }}>
          <h2 style={{ color: "#2ecc71" }}>Organisation Created!</h2>
          <p>Save these credentials for your Manager Login:</p>
          <div style={{ background: "#f4f4f4", padding: "15px", margin: "20px 0", borderRadius: "8px", borderLeft: "4px solid #2ecc71" }}>
            <p><strong>Manager Email:</strong> {successData.manager_email}</p>
            <p><strong>Temporary Password:</strong> {successData.password}</p>
            <p><strong>Org Slug:</strong> {successData.organisation_slug}</p>
          </div>
          <a href="/manager-login" className="submit-button" style={{ display: "inline-block", textDecoration: "none", marginTop: "20px" }}>Go to Login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="wrapper">
      <div className="card">
        <div className="brand-header">
          <h1 className="brand-title">ResolvePro</h1>
        </div>

        <h2 className="form-title">Create New Organisation</h2>
        <p className="subtitle">Please provide the official details for registration.</p>

        {error && <div style={{ color: "red", marginBottom: "15px" }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Section: Organisation Basic Info */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Organisation Name *</label>
              <input className="form-input" type="text" name="orgName" placeholder="Legal Name" onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">CIN (Corporate ID) *</label>
              <input className="form-input" type="text" name="cin" placeholder="U12345..." onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">GSTIN *</label>
              <input className="form-input" type="text" name="gstin" placeholder="15-digit ID" onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group form-group-full">
            <label className="form-label">Office Address *</label>
            <textarea className="form-textarea" name="address" placeholder="Street address..." onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input className="form-input" type="text" name="city" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">State *</label>
              <input className="form-input" type="text" name="state" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Country *</label>
              <input className="form-input" type="text" name="country" onChange={handleChange} required />
            </div>
          </div>

          {/* Section: Categories (Multi-select) */}
          <div className="section-divider">Organisation Categories</div>
          <div className="checkbox-grid">
            {categoryOptions.map((opt) => (
              <label key={opt.value} className="checkbox-item">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={formData.categories.includes(opt.value)}
                  onChange={handleCategoryChange}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Section: Admin Details */}
          <div className="section-divider">Admin Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Admin Full Name *</label>
              <input className="form-input" type="text" name="adminName" placeholder="John Doe" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Admin Email *</label>
              <input className="form-input" type="email" name="adminEmail" placeholder="admin@org.com" onChange={handleChange} required />
            </div>
          </div>

          {/* Section: Contact Info */}
          <div className="section-divider">Contact Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Official Email *</label>
              <input className="form-input" type="email" name="email" placeholder="contact@org.com" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone *</label>
              <input className="form-input" type="tel" name="phone" placeholder="+91..." onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Website</label>
              <input className="form-input" type="url" name="website" placeholder="https://..." onChange={handleChange} />
            </div>
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Registering..." : "Register Organisation"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrg;