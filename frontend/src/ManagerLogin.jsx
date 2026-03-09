import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";

function ManagerLogin() {
  const [orgId, setOrgId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/manager-login/", {
        org_id: orgId,
        manager_id: managerId,
        password: password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "manager");

      navigate("/managerdashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="resolve-wrapper">
      <div className="resolve-card">

        {/* Back to Home Button */}
        <button
          onClick={() => navigate("/")}
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

        <h2 className="resolve-header">Manager Login</h2>

        <form onSubmit={handleLogin}>
          <div className="resolve-input-group">
            <label className="resolve-label">Organization ID</label>
            <input
              type="text"
              className="resolve-input"
              placeholder="e.g. ORG-123"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              required
            />
          </div>

          <div className="resolve-input-group">
            <label className="resolve-label">Manager ID</label>
            <input
              type="text"
              className="resolve-input"
              placeholder="Enter your ID"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
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

          <button type="submit" className="resolve-btn">
            Sign In
          </button>
        </form>

      </div>
    </div>
  );
}

export default ManagerLogin;