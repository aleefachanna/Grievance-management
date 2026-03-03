import React from 'react';
import './dashboard.css';
import Sidebar from '../components/sidebar';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const GrievancePieChart = ({ chartStats }) => {
  const chartData = [
    { name: 'Pending', value: chartStats.pending, color: '#B76B5C' },
    { name: 'In Progress', value: chartStats.inProgress, color: '#D4A373' },
    { name: 'Resolved', value: chartStats.resolved, color: '#859E75' },
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
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip contentStyle={{ backgroundColor: '#210E2A', border: 'none', color: '#fff' }} />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const Dashboard = () => {
  const stats = [
    { label: "Total Complaints", value: 154, color: "#859E75" },
    { label: "Pending", value: 12, color: "#B76B5C" },
    { label: "In Progress", value: 24, color: "#D4A373" },
    { label: "Resolved", value: 118, color: "#859E75" }
  ];

  const chartStats = { pending: 12, inProgress: 24, resolved: 118 };

  return (
    <div className="dashboard-page">
      {/* Background Elements from Home */}
      <div className="floating-element floating-1"></div>
      <div className="floating-element floating-2"></div>
      <div className="dashboard-bg-overlay"></div>

      <div className="dashboard-container">
        <Sidebar />
        
        <main className="main-content">
          <header className="content-header">
            <div className="header-titles">
              <h1 className="tagline">Admin Overview</h1>
              <div className="company-name">Tech Solutions Inc.</div>
            </div>
            {/*<div className="org-badge">System Active</div>*/}
          </header>

          <div className="stats-row">
            {stats.map((item, index) => (
              <div key={index} className="stat-card">
                <div className="stat-card-inner" style={{ borderTop: `3px solid ${item.color}` }}>
                  <span className="stat-label">{item.label}</span>
                  <h2 className="stat-number">{item.value}</h2>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-grid">
            <section className="chart-section">
              <h3 className="section-title">Distribution</h3>
              <div className="glass-card">
                <GrievancePieChart chartStats={chartStats} />
              </div>
            </section>

            <section className="table-section">
              <h3 className="section-title">Recent Grievances</h3>
              <div className="glass-card table-container">
                 <p className="placeholder-text">Syncing with secure database...</p>
                 {/* Table logic will go here */}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;