import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './style.css';

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

    return (
        <div className="resolve-wrapper">
            <div className="resolve-card">

                {/* Back to Home Button */}
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
                
                <h2 className="resolve-header">Department Login</h2>

                <form onSubmit={handleLogin}>
                    <div className="resolve-input-group">
                        <label className="resolve-label">Department ID</label>
                        <input 
                            className="resolve-input"
                            placeholder="e.g. DEP-402" 
                            value={credentials.Dep_id}
                            onChange={e => setCredentials({...credentials, Dep_id: e.target.value})} 
                            required
                        />
                    </div>

                    <div className="resolve-input-group">
                        <label className="resolve-label">Employee ID</label>
                        <input 
                            className="resolve-input"
                            type="password"
                            placeholder="Enter your Employee ID" 
                            value={credentials.Emp_id}
                            onChange={e => setCredentials({...credentials, Emp_id: e.target.value})} 
                            required
                        />
                    </div>

                    <button type="submit" className="resolve-btn">
                        Sign In
                    </button>
                </form>
                
                <div style={{ marginTop: '20px', fontSize: '13px', color: '#666' }}>
                    Authorized Personnel Only
                </div>
            </div>
        </div>
    );
}

export default DepLogin;