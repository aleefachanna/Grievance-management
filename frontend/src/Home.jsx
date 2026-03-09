import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'unset';
  }, [menuOpen]);

  return (
    <div className="home-container">
      {/* Floating bubbles */}
      <div className="floating-element floating-1"></div>
      <div className="floating-element floating-2"></div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="logo">Resolve<span>Pro</span></div>
        <button
          className={`mobile-menu-btn ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <a href="/track">Track Complaint</a>
          <a href="/organisation">Organization</a>

          {/* Dropdown for Login */}
          <div className="dropdown">
            <a>Login</a>
            <div className="dropdown-content">
              <a href="/create-org">Create Organization</a>
              <a href="/manager-login">Manager Login</a>
              <a href="/employee-login">Employee Login</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="hero-wrapper">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="tagline">From Concern to Resolution</h1>
            <div className="company-name">ResolvePro</div>
            <p className="hero-description">
              Smart grievance tracking & organisation management system.<br />
              Streamlined, efficient, and effective solutions for all your concerns.
            </p>
            <button onClick={() => navigate('/submit')} className="cta-button">
              Submit Complaint Now
            </button>
            <div className="stats-container">
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">Resolution Rate</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">24h</div>
                <div className="stat-label">Avg Response</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Resolved</div>
              </div>
            </div>
            <a href="/submit" className="mobile-cta">Submit Complaint →</a>
          </div>
          <div className="hero-bg"></div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>Transforming complaints into solutions since 2023</p>
      </footer>
    </div>
  );
}

export default Home;