import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Home.css";

// Import logos
import logo1 from "./assets/download (1).jpeg";
import logo2 from "./assets/download (1).png";
import logo3 from "./assets/download (2).jpeg";
import logo4 from "./assets/download (3).jpeg";
import logo5 from "./assets/download.jpeg";

function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Background Animated Elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>
            Resolve<span className="logo-accent">Pro</span>
          </div>

          <button
            className={`mobile-menu-btn ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          {/* Dropdown for Login */}
          <div className="dropdown">
            <a>Login</a>
            <div className="dropdown-content">
              <a href="/create-org">Create Organization</a>
              <a href="/manager-login">Manager Login</a>
              <a href="/employee-login">Employee Login</a>
              <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
                <a href="/track" className="nav-item">Track Complaint</a>
                <a href="/organisations" className="nav-item">Organizations</a>

                <div className="dropdown">
                  <span className="nav-item login-trigger">
                    Login
                    <svg className="chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </span>
                  <div className="dropdown-menu">
                    <a href="/login" className="dropdown-item">User Login</a>
                    <a href="/manager-login" className="dropdown-item">Manager Login</a>
                    <a href="/employee-login" className="dropdown-item">Employee Login</a>
                    <div className="dropdown-divider"></div>
                    <a href="/create-org" className="dropdown-item highlight">Create Organization</a>
                  </div>
                </div>

                <button onClick={() => navigate('/submit')} className="nav-cta-button">
                  Submit Complaint
                </button>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <main className="hero-section">
            <div className="hero-content">
              <div className="badge">Next-Gen Grievance Management</div>
              <h1 className="hero-title">
                Transform Concerns into <br />
                <span className="text-gradient">Dynamic Resolutions</span>
              </h1>
              <p className="hero-subtitle">
                An intelligent, seamless platform designed to empower individuals and organizations to resolve issues with unprecedented speed and transparency.
              </p>

              <div className="hero-actions">
                <button onClick={() => navigate('/submit')} className="primary-btn">
                  Get Started Now
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
                <button onClick={() => navigate('/track')} className="secondary-btn">
                  Track Status
                </button>
              </div>

              {/* Trusted By Carousel */}
              <div className="trusted-section">
                <p className="trusted-text">TRUSTED BY LEADING ORGANIZATIONS</p>
                <div className="carousel-container">
                  <div className="carousel-track-wrapper">
                    <div className="carousel-track">
                      {[...Array(6)].flatMap(() => [logo1, logo2, logo3, logo4, logo5]).map((logo, index) => (
                        <div className="carousel-item" key={`first-${index}`}>
                          <img src={logo} alt={`Company logo`} />
                        </div>
                      ))}
                    </div>
                    <div className="carousel-track">
                      {[...Array(6)].flatMap(() => [logo1, logo2, logo3, logo4, logo5]).map((logo, index) => (
                        <div className="carousel-item" key={`second-${index}`}>
                          <img src={logo} alt={`Company logo dup`} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="footer">
            <p>&copy; {new Date().getFullYear()} ResolvePro. Empowering resolutions globally.</p>
          </footer>
        </div>
        );
}

        export default Home;