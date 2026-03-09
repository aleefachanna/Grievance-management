import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css"; // Import the new file

function ManagerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/manager/login/", {
        email: email,
        password: password,
      });
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      localStorage.setItem("role", "manager");
      navigate("/managerdashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="resolve-wrapper">
      <div className="resolve-card">
        <div className="resolve-logo-area">
          <span className="resolve-logo-text">ResolvePro</span>
        </div>
        <h2 className="resolve-header">Manager Login</h2>

        <form onSubmit={handleLogin}>
          <div className="resolve-input-group">
            <label className="resolve-label">Email</label>
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

          <button type="submit" className="resolve-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default ManagerLogin;