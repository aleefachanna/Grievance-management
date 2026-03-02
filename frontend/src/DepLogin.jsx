import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

function DepLogin() {
    const [credentials, setCredentials] = useState({ Dep_id: '', Emp_id: '' });
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        if (e) e.preventDefault(); 
        try {
            const res = await api.post('emplogin/', credentials);
            localStorage.setItem('access_token', res.data.access);
            localStorage.setItem('refresh_token', res.data.refresh);
            navigate('/depdashboard'); 
        } catch (err) {
            console.error(err);
            alert("Invalid Department ID or Employee ID.");
        }
    };

    const styles = {
        wrapper: {
            backgroundColor: '#FFF3B8', 
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',      
            justifyContent: 'center',   
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            margin: 0,
            padding: 0,
        },
        card: {
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '400px',
            borderTop: '8px solid #859E75', 
            boxSizing: 'border-box',
        },
        logoArea: {
            textAlign: 'center',
            marginBottom: '10px',
        },
        logoText: {
            color: '#859E75',
            fontSize: '32px',
            fontWeight: 'bold',
            margin: 0,
        },
        header: {
            fontSize: '20px',
            fontWeight: '600',
            textAlign: 'center',
            color: '#333',
            marginBottom: '25px',
        },
        inputGroup: {
            marginBottom: '15px',
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#555',
        },
        input: {
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '15px',
            boxSizing: 'border-box',
            backgroundColor: '#fff', 
            color: '#000',
            outline: 'none',
        },
        button: {
            width: '100%',
            padding: '14px',
            backgroundColor: '#210E2A', // Updated to requested color
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '15px',
            transition: 'all 0.3s ease',
        },
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <div style={styles.logoArea}>
                    <h1 style={styles.logoText}>ResolvePro</h1>
                </div>
                
                <h2 style={styles.header}>Department Login</h2>

                <form onSubmit={handleLogin}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Department ID</label>
                        <input 
                            style={styles.input}
                            placeholder="e.g. DEP-402" 
                            value={credentials.Dep_id}
                            onChange={e => setCredentials({...credentials, Dep_id: e.target.value})} 
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Employee ID</label>
                        <input 
                            style={styles.input}
                            type="password"
                            placeholder="Enter your Employee ID" 
                            value={credentials.Emp_id}
                            onChange={e => setCredentials({...credentials, Emp_id: e.target.value})} 
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        style={styles.button}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = '#3b1b4a'; // Slightly lighter purple on hover
                            e.target.style.transform = 'scale(1.02)';
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = '#210E2A';
                            e.target.style.transform = 'scale(1)';
                        }}
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}

export default DepLogin;