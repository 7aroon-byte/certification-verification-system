import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default function StudentSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [userName, setUserName] = useState('Student');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserName(decoded.name || 'Student');
        setUserEmail(decoded.email || '');
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    try {
      const res = await api.get('/student/me');
      const me = res?.data?.data;
      if (me) {
        setUserName(me.name || 'Student');
        setUserEmail(me.email || '');
      }
    } catch (err) {
      // silent fallback to decoded token
    }
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 900) {
      setIsOpen(false);
    }

    refreshProfile();
    const handler = (e) => {
      if (e?.detail?.name) setUserName(e.detail.name);
      if (e?.detail?.email) setUserEmail(e.detail.email);
      refreshProfile();
    };
    window.addEventListener('student-profile-updated', handler);
    return () => window.removeEventListener('student-profile-updated', handler);
  }, [refreshProfile]);

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', isOpen);
    document.body.classList.toggle('sidebar-closed', !isOpen);

    return () => {
      document.body.classList.remove('sidebar-open');
      document.body.classList.remove('sidebar-closed');
    };
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalToggle = () => toggleSidebar();
    window.addEventListener('sidebar-toggle', handleGlobalToggle);
    return () => window.removeEventListener('sidebar-toggle', handleGlobalToggle);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/student/logout');
    } catch (err) {
      // ignore and continue local logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/student/login');
    }
  };

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src="/logo.png" alt="Institution Logo" />
          <span className="sidebar-brand-text">IHECVS</span>
        </div>
        <div style={{ padding: '8px 16px 14px', textAlign: 'left', borderBottom: '1px solid #1e293b', marginBottom: '0', position: 'relative' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 400, color: '#e2e8f0', margin: 0 }}>{userName}</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink to="/student/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="bi bi-speedometer2 sidebar-icon" aria-hidden="true" />
                {isOpen && <span>Dashboard</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/student/certificates" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="bi bi-award sidebar-icon" aria-hidden="true" />
                {isOpen && <span>My Certificates</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to="/student/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="bi bi-person-circle sidebar-icon" aria-hidden="true" />
                {isOpen && <span>Profile</span>}
              </NavLink>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isOpen ? 'flex-start' : 'center',
                  padding: '15px 20px',
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  gap: '0',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e293b';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.paddingLeft = '25px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#e2e8f0';
                  e.currentTarget.style.paddingLeft = '20px';
                }}
                >
                  <i
                    className="bi bi-box-arrow-right"
                    aria-hidden="true"
                    style={{
                      fontSize: '1.1rem',
                      minWidth: '1.25rem',
                      marginRight: isOpen ? '10px' : '0',
                      display: 'inline-flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  />
                  {isOpen && <span>Logout</span>}
                </div>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      <style>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: 250px;
          background-color: #0f172a;
          color: #fff;
          padding: 20px 0;
          transition: transform 0.3s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          z-index: 100;
          transform: translateX(0);
          border-right: 1px solid #1e293b;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          padding: 0 16px 6px;
          margin-bottom: 0;
        }

        .sidebar-brand-logo {
          width: 44px;
          height: 44px;
          object-fit: contain;
        }

        .sidebar-brand-text {
          color: #f8fafc;
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: 0.3px;
        }

        .sidebar.closed {
          width: 250px;
          transform: translateX(-100%);
        }

        .toggle-btn {
          display: none;
          background: none;
          border: none;
          color: #2d2f33;
          font-size: 24px;
          cursor: pointer;
          padding: 10px 15px;
          width: 100%;
          text-align: left;
        }

        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .sidebar-nav::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .sidebar-nav li {
          margin: 0;
        }

        .sidebar-nav a {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 15px 20px;
          color: #e2e8f0;
          text-decoration: none;
          transition: all 0.3s ease;
          gap: 0;
          min-height: 50px;
          font-weight: 600;
        }

        .sidebar-nav a:hover {
          background-color: #1e293b;
          color: #fff;
          padding-left: 25px;
        }

        .sidebar-nav a.active {
          background-color: #334155;
          color: #fff;
          border-left: 4px solid #38bdf8;
          padding-left: 16px;
        }

        .sidebar-icon {
          font-size: 1.1rem;
          min-width: 1.25rem;
          margin-right: 10px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }

        .sidebar.closed .sidebar-nav a span:last-child {
          display: none;
        }

        .sidebar.closed .sidebar-nav a {
          justify-content: center;
          padding: 15px;
          min-height: 60px;
        }

        .sidebar.closed .sidebar-nav a .sidebar-icon {
          margin-right: 0;
        }

        .sidebar.closed .sidebar-nav a:hover {
          padding-left: 15px;
        }

        .sidebar.closed .sidebar-nav a.active {
          padding-left: 11px;
        }

        @media (max-width: 768px) {
          .toggle-btn {
            display: block;
          }

          .sidebar {
            width: 250px;
          }

          .sidebar.closed {
            width: 250px;
            transform: translateX(-100%);
          }
        }

        .content-wrapper {
          margin-left: 250px;
          transition: margin-left 0.3s ease;
        }

        body.sidebar-closed .content-wrapper {
          margin-left: 0;
        }

        @media (max-width: 900px) {
          .content-wrapper {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
}

