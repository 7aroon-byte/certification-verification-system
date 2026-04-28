import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PublicNavbar() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <div 
            className="text-white rounded d-flex align-items-center justify-content-center me-2" 
            style={{ 
              width: '50px', 
              height: '50px', 
              fontSize: '24px',
              backgroundColor: '#0b4a6f',
              boxShadow: '0 2px 8px rgba(11, 74, 111, 0.3)'
            }}
          >
            🎓
          </div>
          <span className="fw-bold" style={{ color: '#2d3748', fontSize: '1.1rem' }}>
            IHECVS
          </span>
        </Link>

        <button 
          className="navbar-toggler border-0" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#publicNavbar"
          aria-controls="publicNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="publicNavbar">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item mx-2">
              <Link 
                to="/" 
                className={`nav-link px-3 py-2 rounded ${isActive('/') ? 'active' : ''}`}
                style={{
                  fontWeight: isActive('/') ? '600' : '500',
                  color: isActive('/') ? '#667eea' : '#4a5568',
                  backgroundColor: isActive('/') ? '#f7fafc' : 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                Home
              </Link>
            </li>
            <li className="nav-item mx-2">
              <Link 
                to="/student/login" 
                className={`nav-link px-3 py-2 rounded ${isActive('/student/login') || isActive('/admin/login') ? 'active' : ''}`}
                style={{
                  fontWeight: isActive('/student/login') || isActive('/admin/login') ? '600' : '500',
                  color: isActive('/student/login') || isActive('/admin/login') ? '#667eea' : '#4a5568',
                  backgroundColor: isActive('/student/login') || isActive('/admin/login') ? '#f7fafc' : 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                Login
              </Link>
            </li>
            <li className="nav-item mx-2">
              <Link 
                to="/contact" 
                className={`nav-link px-3 py-2 rounded ${isActive('/contact') ? 'active' : ''}`}
                style={{
                  fontWeight: isActive('/contact') ? '600' : '500',
                  color: isActive('/contact') ? '#667eea' : '#4a5568',
                  backgroundColor: isActive('/contact') ? '#f7fafc' : 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                Contact
              </Link>
            </li>
            <li className="nav-item mx-2">
              <Link 
                to="/verify" 
                className={`nav-link px-3 py-2 rounded ${isActive('/verify') ? 'active' : ''}`}
                style={{
                  fontWeight: isActive('/verify') ? '600' : '500',
                  color: isActive('/verify') ? '#667eea' : '#4a5568',
                  backgroundColor: isActive('/verify') ? '#f7fafc' : 'transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                Verify
              </Link>
            </li>
          </ul>

          {/* Institution Logo/Image on the right */}
          <div className="d-none d-lg-block ms-3">
            <img 
              src="/image.png" 
              alt="Institution Logo" 
              style={{ 
                height: '60px', 
                width: 'auto',
                objectFit: 'contain'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .nav-link:hover {
          color: #667eea !important;
          background-color: #f7fafc !important;
        }
      `}</style>
    </nav>
  );
}
