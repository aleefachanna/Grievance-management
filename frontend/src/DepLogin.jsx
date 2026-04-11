import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './style.css';

function DepLogin() {
  const [empid, setEmpid] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [firstLogin, setFirstLogin] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/department/login/", {
        empid,
        password,
        new_password: firstLogin ? newPassword : undefined,
      });

      if (response.data.first_login) {
        setFirstLogin(true);
        setMessage("First login. Please set a new password.");
      } else {
        localStorage.setItem("access", response.data.access);
        localStorage.setItem("refresh", response.data.refresh);
        navigate("/depdashboard");
      }
    } catch (error) {
      setMessage(error.response?.data?.error || "Login failed. Try again.");
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
            <label className="resolve-label">Employee ID</label>
            <input
              type="text"
              className="resolve-input"
              placeholder="EMP-ORG-XXXX"
              value={empid}
              onChange={(e) => setEmpid(e.target.value)}
              required
            />
          </div>

          <div className="resolve-input-group">
            <label className="resolve-label">Password</label>
            <input
              type="password"
              className="resolve-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {firstLogin && (
            <div className="resolve-input-group">
              <label className="resolve-label">New Password</label>
              <input
                type="password"
                className="resolve-input"
                placeholder="Set new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="resolve-btn">
            Login
          </button>
        </form>

        {message && <p style={{ color: "red", marginTop: "15px", textAlign: "center" }}>{message}</p>}
      </div>
    </div>
  );
}

export default DepLogin;