import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import './style.css';

import React, { useState } from "react";
import { api } from "./api";
import "./style.css"; // Importing the shared CSS file
function DepLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [firstLogin, setFirstLogin] = useState(false);
  const [message, setMessage] = useState("");

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
      const handleLogin = async (e) => {
        e.preventDefault();

        try {
          const response = await api.post(
            "/department/login/",
            {
              email,
              password,
              new_password: firstLogin ? newPassword : undefined,
            }
          );

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
                if (response.data.first_login) {
                  setFirstLogin(true);
                setMessage("First login. Please set a new password.");
      } else {

                  // ✅ STORE JWT TOKENS
                  localStorage.setItem("access", response.data.access);
                localStorage.setItem("refresh", response.data.refresh);

                window.location.href = "/depdashboard";
      }
    } catch (error) {
                  setMessage(
                    error.response?.data?.error || "Login failed. Try again."
                  );
    }
  };

                return (
                <div style={{ padding: "40px" }}>
                  <h2>Department Employee Login</h2>

                  <form onSubmit={handleLogin}>
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    {firstLogin && (
                      <div>
                        <input
                          type="password"
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <button type="submit">Login</button>
                  </form>

                  {message && <p style={{ color: "red" }}>{message}</p>}
                </div>
                );
}

                export default DepLogin;