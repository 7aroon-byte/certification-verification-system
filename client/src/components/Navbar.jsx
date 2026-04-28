import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  try { useAuth(); } catch (e) {}

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 900) {
      window.dispatchEvent(new Event('sidebar-toggle'));
    }
  };

  const handleLogout = async () => {
    const role = localStorage.getItem('role');
    const path = window.location.pathname;

    try {
      if (path.startsWith('/admin') || role === 'admin' || role === 'super-admin') {
        await api.post('/admin/logout');
      } else if (path.startsWith('/student') || role === 'student') {
        await api.post('/student/logout');
      }
    } catch (error) {
      // ignore logout endpoint failures and continue local logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/');
    }
  };

  useEffect(() => {
    // When navbar is present, adjust app content padding
    document.body.classList.add('navbar-no-top-margin');
    return () => document.body.classList.remove('navbar-no-top-margin');
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light fixed-top app-navbar" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', minHeight: '40px' }}>
      <div className="container-fluid px-4" style={{ minHeight: '40px' }}>
        <div className="d-flex align-items-center nav-brand-group" style={{ marginLeft: '12px' }}>
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="btn btn-link d-flex align-items-center justify-content-center p-0 sidebar-toggle-btn"
            style={{ color: '#2d2f33', textDecoration: 'none', width: '32px', height: '32px' }}
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <i className="bi bi-list" style={{ fontSize: '1.5rem', lineHeight: 1 }}></i>
          </button>
        </div>

        <div className="ms-auto d-flex align-items-center logout-wrap">
          <button
            onClick={handleLogout}
            className="nav-link btn btn-link text-decoration-none d-flex align-items-center"
            style={{ color: '#2d2f33', fontWeight: '700' }}
            aria-label="Logout"
            title="Logout"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>
      <style>{`
        .app-navbar {
          left: 0;
          width: 100%;
          transition: left 0.3s ease, width 0.3s ease;
        }

        @media (min-width: 901px) {
          .app-navbar {
            left: 250px;
            width: calc(100% - 250px);
          }

          body.sidebar-closed .app-navbar {
            left: 0;
            width: 100%;
          }
        }

        .sidebar-toggle-btn {
          display: inline-flex !important;
        }

        @media (min-width: 901px) {
          .sidebar-toggle-btn {
            display: none !important;
          }
        }

        @media (max-width: 900px) {
          .nav-brand-group {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </nav>
  );
}
