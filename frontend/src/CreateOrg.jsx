import React, { useState } from 'react';

const CreateOrg = () => {
  const [formData, setFormData] = useState({
    orgName: '', type: '', email: '', phone: '', website: '', city: '', state: '', country: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting Organisation:", formData);
    // Logic for your existing backend integration goes here
  };

  const styles = {
    wrapper: {
      backgroundColor: '#FFF3B8', // Theme background
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',    // Horizontal centering for the card
      justifyContent: 'center',  // Vertical centering for the card
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '20px',
      boxSizing: 'border-box'
    },
    card: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '800px', // Wider than login to accommodate two-column rows
      boxSizing: 'border-box',
      borderTop: '8px solid #859E75'
    },
    title: { 
      color: '#B76B5C', 
      textAlign: 'center', 
      margin: '0 0 10px 0',
      fontSize: '28px' 
    },
    subtitle: { 
      textAlign: 'center', 
      color: '#666', 
      marginBottom: '30px', 
      fontSize: '15px' 
    },
    row: { 
      display: 'flex', 
      gap: '20px', 
      marginBottom: '20px',
      flexWrap: 'wrap' // Ensures responsiveness on very small screens
    },
    group: { 
      display: 'flex', 
      flexDirection: 'column', 
      flex: 1,
      minWidth: '250px' // Prevents columns from getting too thin
    },
    label: { 
      fontWeight: '600', 
      marginBottom: '8px', 
      fontSize: '14px', 
      color: '#333' 
    },
    input: {
      padding: '12px',
      borderRadius: '8px',
      border: '1.5px solid #859E75',
      backgroundColor: '#ffffff', // Explicit white background
      color: '#000',
      fontSize: '14px',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box'
    },
    button: {
      backgroundColor: '#B76B5C',
      color: 'white',
      padding: '16px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '20px',
      width: '100%',
      transition: '0.3s'
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1 style={{ color: '#859E75', margin: 0 }}>ResolvePro</h1>
        </div>
        
        <h2 style={styles.title}>Create New Organisation</h2>
        <p style={styles.subtitle}>Please provide the official details for registration.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ ...styles.group, marginBottom: '20px' }}>
            <label style={styles.label}>Organisation Name *</label>
            <input 
              style={styles.input} 
              type="text" 
              name="orgName" 
              placeholder="Enter full legal name"
              onChange={handleChange} 
              required 
            />
          </div>

          <div style={styles.row}>
            <div style={styles.group}>
              <label style={styles.label}>Select Type *</label>
              <select style={styles.input} name="type" onChange={handleChange} required>
                <option value="">Choose...</option>
                <option value="corporate">Corporate</option>
                <option value="ngo">NGO</option>
                <option value="govt">Government</option>
                <option value="edu">Educational</option>
              </select>
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Official Email *</label>
              <input 
                style={styles.input} 
                type="email" 
                name="email" 
                placeholder="contact@org.com"
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.group}>
              <label style={styles.label}>Contact Phone *</label>
              <input 
                style={styles.input} 
                type="tel" 
                name="phone" 
                placeholder="+1 234 567 890"
                onChange={handleChange} 
                required 
              />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>Website</label>
              <input 
                style={styles.input} 
                type="url" 
                name="website" 
                placeholder="https://www.example.com"
                onChange={handleChange} 
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.group}>
              <label style={styles.label}>City *</label>
              <input style={styles.input} type="text" name="city" onChange={handleChange} required />
            </div>
            <div style={styles.group}>
              <label style={styles.label}>State *</label>
              <input style={styles.input} type="text" name="state" onChange={handleChange} required />
            </div>
          </div>

          <div style={{ ...styles.group, marginBottom: '15px' }}>
            <label style={styles.label}>Country *</label>
            <input style={styles.input} type="text" name="country" onChange={handleChange} required />
          </div>

          <button 
            type="submit" 
            style={styles.button}
            onMouseOver={(e) => e.target.style.backgroundColor = '#a35a4d'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#B76B5C'}
          >
            Register Organisation
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrg;