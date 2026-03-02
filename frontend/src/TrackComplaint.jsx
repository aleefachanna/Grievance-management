import React, { useState } from 'react';

const TrackComplaint = () => {
  const [complaintId, setComplaintId] = useState("");

  const handleTrack = (e) => {
    e.preventDefault();
    console.log("Tracking ID:", complaintId);
  };

  const styles = {
    // This wrapper forces everything to the center of the screen
    wrapper: {
      backgroundColor: '#FFF3B8', 
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',      // Vertical Center
      justifyContent: 'center',   // Horizontal Center
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      margin: 0,
      padding: '20px',
      boxSizing: 'border-box'
    },
    // The card uses your new deep purple #210E2A for a premium look
    card: {
      backgroundColor: '#210E2A', 
      padding: '50px 40px',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
      width: '100%',
      maxWidth: '450px',         // Prevents mobile-view stretch on desktop
      textAlign: 'center',
      border: '1px solid rgba(255, 243, 184, 0.1)'
    },
    logo: {
      color: '#859E75',
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '10px',
      letterSpacing: '1px'
    },
    title: {
      color: '#FFF3B8',
      fontSize: '24px',
      marginBottom: '30px',
      fontWeight: '500'
    },
    input: {
      width: '100%',
      padding: '15px',
      borderRadius: '12px',
      border: '2px solid #859E75',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      color: '#FFF3B8',          // Light text for dark background
      fontSize: '16px',
      marginBottom: '20px',
      outline: 'none',
      boxSizing: 'border-box',
      textAlign: 'center'
    },
    button: {
      width: '100%',
      padding: '15px',
      backgroundColor: '#859E75',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(183, 107, 92, 0.4)'
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>ResolvePro</div>
        <h2 style={styles.title}>Track Complaint</h2>
        
        <form onSubmit={handleTrack}>
          <input
            type="text"
            placeholder="Enter Complaint ID"
            style={styles.input}
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            required
          />
          
          <button 
            type="submit" 
            style={styles.button}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#210E2A';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#859E75';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Track Status
          </button>
        </form>
        
        <p style={{ color: '#859E75', marginTop: '20px', fontSize: '14px', cursor: 'pointer' }}>
          Need help finding your ID?
        </p>
      </div>
    </div>
  );
};

export default TrackComplaint;