import React from 'react';
import './dashboard.css';
import Sidebar from '../components/sidebar';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// 1. Define the Pie Chart Component first
const GrievancePieChart = ({ chartStats }) => {
  const chartData = [
    { name: 'Pending', value: chartStats.pending, color: '#B76B5C' },
    { name: 'In Progress', value: chartStats.inProgress, color: '#D4A373' },
    { name: 'Resolved', value: chartStats.resolved, color: '#2D6A4F' },
  ];

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Define the Main Dashboard Component
const Dashboard = () => {
  const stats = [
    { label: "Total Complaints", value: 154, color: "#859E75" },
    { label: "Pending", value: 12, color: "#B76B5C" },
    { label: "In Progress", value: 24, color: "#D4A373" },
    { label: "Resolved", value: 118, color: "#2D6A4F" }
  ];

  // Object to pass specifically to the chart
  const chartStats = {
    pending: 12,
    inProgress: 24,
    resolved: 118
  };

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

        {/* 3. Grid Layout for Chart and Table */}
        <div className="dashboard-grid">
          <section className="chart-section">
            <h3>Status Distribution</h3>
            <div className="glass-card">
              <GrievancePieChart chartStats={chartStats} />
            </div>
          </section>

          <section className="table-section">
            <h3>Recent Grievances</h3>
            <div className="glass-table-container">
              <p>Waiting for live data connection...</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;