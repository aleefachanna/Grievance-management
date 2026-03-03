import React, { useState } from "react";
import {api} from "./api";
import "./style.css"; // Importing the shared CSS file
function DepLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [firstLogin, setFirstLogin] = useState(false);
  const [message, setMessage] = useState("");

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