import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
        const response = await axios.get("http://127.0.0.1:8000/api/organisations/search/");
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
      const response = await axios.post("http://127.0.0.1:8000/api/manager/login/", {
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
    <div className="resolve-wrapper" style={{background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'}}>
      <div className="resolve-card" style={{
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        borderRadius: "16px",
        padding: "40px 30px",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)"
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="resolve-back-icon-btn"
          title="Back to Home"
          style={{ position: 'absolute', top: '20px', left: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="resolve-logo-area" style={{marginBottom: "10px", textAlign: "center"}}>
          <span className="resolve-logo-text" style={{fontSize: "2rem", color: "#1e3c72", fontWeight: "800"}}>ResolvePro</span>
        </div>

        <h2 className="resolve-header" style={{fontSize: "1.4rem", color: "#333", textAlign: "center", marginBottom: "30px", fontWeight: "600"}}>Manager Portal</h2>

        <form onSubmit={handleLogin} style={{display: "flex", flexDirection: "column", gap: "20px"}}>
          
          <div className="resolve-input-group" style={{display: "flex", flexDirection: "column", gap: "8px"}}>
            <label className="resolve-label" style={{fontWeight: "600", fontSize: "0.9rem", color: "#555"}}>Organisation</label>
            <select
              className="resolve-input"
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", backgroundColor: "#f9fbfd", transition: "border 0.3s ease"
              }}
            >
              <option value="" disabled>Select your organisation</option>
              {organisations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="resolve-input-group" style={{display: "flex", flexDirection: "column", gap: "8px"}}>
            <label className="resolve-label" style={{fontWeight: "600", fontSize: "0.9rem", color: "#555"}}>Admin Email</label>
            <input
              type="email"
              className="resolve-input"
              placeholder="admin@organisation.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", backgroundColor: "#f9fbfd", transition: "border 0.3s ease", boxSizing: "border-box"
              }}
            />
          </div>

          <div className="resolve-input-group" style={{display: "flex", flexDirection: "column", gap: "8px"}}>
            <label className="resolve-label" style={{fontWeight: "600", fontSize: "0.9rem", color: "#555"}}>Password</label>
            <input
              type="password"
              className="resolve-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", backgroundColor: "#f9fbfd", transition: "border 0.3s ease", boxSizing: "border-box"
              }}
            />
          </div>

          <button 
            type="submit" 
            className="resolve-btn"
            disabled={isLoading}
            style={{
              padding: "14px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", color: "white", fontSize: "1.1rem", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer", marginTop: "10px", boxShadow: "0 4px 15px rgba(30, 60, 114, 0.4)", transition: "transform 0.2s"
            }}
            onMouseOver={(e) => !isLoading && (e.target.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => !isLoading && (e.target.style.transform = "translateY(0)")}
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {message && <p style={{ color: "#d9534f", marginTop: "20px", textAlign: "center", fontWeight: "500", backgroundColor: "#fdf2f2", padding: "10px", borderRadius: "6px", border: "1px solid #f2dede" }}>{message}</p>}
      </div>
    </div>
  );
}

export default ManagerLogin;