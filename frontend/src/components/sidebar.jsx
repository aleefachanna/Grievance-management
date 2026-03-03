import React from 'react';
import { LayoutDashboard, MessageSquare, LogOut, Building2, Settings } from 'lucide-react';
import './sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <Building2 size={28} color="#859E75" />
        <h2>ResolvePro</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li className="nav-item active">
            <LayoutDashboard size={20} className="nav-icon" />
            <span className="nav-text">Dashboard</span>
          </li>
          <li className="nav-item">
            <MessageSquare size={20} className="nav-icon" />
            <span className="nav-text">Grievances</span>
          </li>
          <li className="nav-item">
            <Settings size={20} className="nav-icon" />
            <span className="nav-text">Settings</span>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;