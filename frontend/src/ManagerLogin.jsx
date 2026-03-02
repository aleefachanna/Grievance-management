import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ManagerLogin() {
  const [orgId, setOrgId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/manager-login/",
        {
          org_id: orgId,
          manager_id: managerId,
          password: password,
        }
      );
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", "manager");
      localStorage.setItem("managerName", response.data.name);
      navigate("/managerdashboard");
    } catch (error) {
      alert(error.response?.data?.message || "Invalid credentials");
    }
  };

  const styles = {
    wrapper: {
      backgroundColor: "#FFF3B8", // Theme background
      minHeight: "100vh",
      width: "100vw",
      display: "flex",
      alignItems: "center",     // Vertical centering
      justifyContent: "center",    // Horizontal centering
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      margin: 0,
      padding: 0,
    },
    card: {
      backgroundColor: "white",
      padding: "40px",
      borderRadius: "16px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      width: "100%",
      maxWidth: "400px",        // Keeps it from stretching too wide on desktop
      borderTop: "8px solid #859E75",
      boxSizing: "border-box",
    },
    logoArea: {
      textAlign: "center",
      marginBottom: "10px",
    },
    logoText: {
      color: "#859E75",
      fontSize: "32px",
      fontWeight: "bold",
      margin: 0,
    },
    header: {
      fontSize: "20px",
      fontWeight: "600",
      textAlign: "center",
      color: "#333",
      marginBottom: "25px",
    },
    inputGroup: {
      marginBottom: "15px",
    },
    label: {
      display: "block",
      marginBottom: "8px",
      fontSize: "14px",
      fontWeight: "600",
      color: "#555",
    },
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "15px",
      boxSizing: "border-box",
      backgroundColor: "#fff", // Fixes dark input issue
      color: "#000",
      outline: "none",
    },
    button: {
      width: "100%",
      padding: "14px",
      backgroundColor: "#859E75", 
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "15px",
      transition: "background 0.3s",
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logoArea}>
          <h1 style={styles.logoText}>ResolvePro</h1>
        </div>
        
        <h2 style={styles.header}>Manager Login</h2>

        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Organization ID</label>
            <input
              type="text"
              placeholder="e.g. ORG-123"
              style={styles.input}
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Manager ID</label>
            <input
              type="text"
              placeholder="Enter your ID"
              style={styles.input}
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            style={styles.button}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#210E2A")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#859E75")}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default ManagerLogin;