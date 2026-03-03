import React from 'react';
import './dashboard.css';
import Sidebar from '../components/sidebar';

const Dashboard = () => {
  // Mock data to visualize the UI
  const stats = [
    { label: "Total Complaints", value: 154, color: "#859E75" },
    { label: "Pending", value: 12, color: "#B76B5C" },
    { label: "In Progress", value: 24, color: "#D4A373" },
    { label: "Resolved", value: 118, color: "#2D6A4F" }
  ];

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <header className="content-header">
          <h1>Admin Overview</h1>
          <div className="org-badge">Org: Tech Solutions Inc.</div>
        </header>

        <div className="stats-row">
          {stats.map((item, index) => (
            <div key={index} className="stat-card" style={{ borderLeft: `5px solid ${item.color}` }}>
              <span className="stat-label">{item.label}</span>
              <h2 className="stat-value">{item.value}</h2>
            </div>
          ))}
        </div>

        <section className="table-section">
          <h3>Recent Grievances</h3>
          <div className="glass-table-container">
            {/* Table component will go here */}
            <p>Waiting for live data connection...</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;