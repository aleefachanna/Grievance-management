import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";
import "./style.css";

function ManagerLogin() {
  const [organisations, setOrganisations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganisations = async () => {
      try {
        const response = await api.get("/organisations/search/");
        setOrganisations(response.data.results || []);
      } catch (error) {
        console.error("Failed to load organisations:", error);
      }
    };
    fetchOrganisations();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedOrg) {
      setMessage("Please select your organisation");
      return;
    }
    
    setIsLoading(true);
    setMessage("");

    try {
      const response = await api.post("/manager/login/", {
        email: email,
        password: password,
        organisation_id: selectedOrg,
      });
      
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      localStorage.setItem("role", "manager");

      navigate("/managerdashboard");
    } catch (error) {
      setMessage(error.response?.data?.error || error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="resolve-wrapper">
      <div className="resolve-card">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="resolve-back-icon-btn"
          title="Back to Home"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="resolve-logo-area">
          <span className="resolve-logo-text">ResolvePro</span>
        </div>

        <h2 className="resolve-header">Manager Portal</h2>

        <form onSubmit={handleLogin} className="resolve-form">
          <div className="resolve-input-group">
            <label className="resolve-label">Organisation</label>
            <select
              className="resolve-input"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              required
            >
              <option value="" disabled>Select your organisation</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="resolve-input-group">
            <label className="resolve-label">Admin Email</label>
            <input
              type="email"
              className="resolve-input"
              placeholder="admin@organisation.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <button 
            type="submit" 
            className="resolve-btn"
            disabled={isLoading}
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {message && (
          <div className="resolve-error-message" style={{ marginTop: '20px', fontSize: '14px', color: '#e74c3c' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerLogin;