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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-blue-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Manager Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="text"
            placeholder="Organization ID"
            className="w-full border rounded-lg p-2"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Manager ID"
            className="w-full border rounded-lg p-2"
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-lg p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default ManagerLogin;