import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [userName, setUserName] = useState('Admin');
  const [userRole, setUserRole] = useState('Administrator');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth <= 900) {
      setIsOpen(false);
    }

    const loadAdminRole = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const meRes = await api.get('/admin/me');
        const admin = meRes?.data?.data;
        if (admin) {
          setUserName(admin.name || 'Admin');
          setUserRole(admin.role || 'admin');
          setIsFirstLogin(!!admin.isFirstLogin);
          localStorage.setItem('role', admin.role || 'admin');
          return;
        }
      } catch (error) {
        console.error('Error fetching admin profile:', error);
      }

      try {
        const decoded = jwtDecode(token);
        setUserName(decoded.name || 'Admin');
        setUserRole(decoded.role || 'admin');
        setIsFirstLogin(decoded?.isFirstLogin === true);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    };

    loadAdminRole();
  }, []);

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

  useEffect(() => {
    const isAuditRoute = ['/admin/student-logs', '/admin/admin-logs', '/admin/certificate-logs'].includes(location.pathname);
    if (isAuditRoute) {
      setIsAuditOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/admin/logout');
    } catch (error) {
      // ignore and continue local logout
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/admin/login');
    }
  };

  const panelLabel = userRole === 'super-admin' ? 'Super Admin Panel' : 'Admin Panel';

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-brand">
          <img className="sidebar-brand-logo" src="/logo.png" alt="Institution Logo" />
          <span className="sidebar-brand-text">IHECVS</span>
        </div>
        <h1 style={{ 
          padding: '8px 16px 14px', 
          fontSize: '0.82rem', 
          fontWeight: 400, 
          color: '#94a3b8', 
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          textAlign: 'left',
          margin: 0,
          borderBottom: '1px solid #1e293b'
        }}>
          {userName}
        </h1>
        <nav className="sidebar-nav">
          {!isFirstLogin && <div className="sidebar-panel-title">{panelLabel}</div>}
          <ul>
            {!isFirstLogin && (
              <>
                <li>
                  <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                    <i className="bi bi-speedometer2 sidebar-icon" aria-hidden="true" />
                    {isOpen && <span>Dashboard</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/manage-student" className={({ isActive }) => isActive ? 'active' : ''}>
                    <i className="bi bi-people sidebar-icon" aria-hidden="true" />
                    {isOpen && <span>Manage Student</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/issue-certificate" className={({ isActive }) => isActive ? 'active' : ''}>
                    <i className="bi bi-award sidebar-icon" aria-hidden="true" />
                    {isOpen && <span>Issue Certificate</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/admin/manage-certificates" className={({ isActive }) => isActive ? 'active' : ''}>
                    <i className="bi bi-patch-check sidebar-icon" aria-hidden="true" />
                    {isOpen && <span>Manage Certificates</span>}
                  </NavLink>
                </li>
                {userRole === 'super-admin' && (
                  <li>
                    <NavLink to="/admin/manage-admins" className={({ isActive }) => isActive ? 'active' : ''}>
                      <i className="bi bi-person-gear sidebar-icon" aria-hidden="true" />
                      {isOpen && <span>Manage Admins</span>}
                    </NavLink>
                  </li>
                )}
                {userRole === 'super-admin' && (
                  <li>
                    <button
                      type="button"
                      className={`sidebar-submenu-toggle ${isAuditOpen ? 'open' : ''}`}
                      onClick={() => setIsAuditOpen((prev) => !prev)}
                    >
                      <i className="bi bi-clipboard-data sidebar-icon" aria-hidden="true" />
                      {isOpen && <span>Audit Log</span>}
                      {isOpen && (
                        <i
                          className={`bi ${isAuditOpen ? 'bi-chevron-up' : 'bi-chevron-down'} sidebar-submenu-caret`}
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {isOpen && isAuditOpen && (
                      <ul className="audit-submenu">
                        <li>
                          <NavLink to="/admin/student-logs" className={({ isActive }) => isActive ? 'active' : ''}>
                            <i className="bi bi-journal-text sidebar-icon" aria-hidden="true" />
                            <span>Student Log</span>
                          </NavLink>
                        </li>
                        <li>
                          <NavLink to="/admin/admin-logs" className={({ isActive }) => isActive ? 'active' : ''}>
                            <i className="bi bi-file-earmark-person sidebar-icon" aria-hidden="true" />
                            <span>Admin Log</span>
                          </NavLink>
                        </li>
                        <li>
                          <NavLink to="/admin/certificate-logs" className={({ isActive }) => isActive ? 'active' : ''}>
                            <i className="bi bi-file-earmark-check sidebar-icon" aria-hidden="true" />
                            <span>Certificate Log</span>
                          </NavLink>
                        </li>
                      </ul>
                    )}
                  </li>
                )}
                <li>
                  <NavLink to="/admin/contact-messages" className={({ isActive }) => isActive ? 'active' : ''}>
                    <i className="bi bi-chat-dots sidebar-icon" aria-hidden="true" />
                    {isOpen && <span>Contact Messages</span>}
                  </NavLink>
                </li>
              </>
            )}
            <li>
              <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'active' : ''}>
                <i className="bi bi-person-circle sidebar-icon" aria-hidden="true" />
                {isOpen && <span>{isFirstLogin ? 'Reset Password' : 'Profile'}</span>}
              </NavLink>
            </li>
            <li>
              <button type="button" className="sidebar-logout-btn" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right sidebar-icon" aria-hidden="true" />
                {isOpen && <span>Logout</span>}
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
          transition: width 0.25s ease, transform 0.25s ease;
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

        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sidebar-panel-title {
          font-size: 0.82rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #94a3b8;
          padding: 8px 20px 10px;
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

        .sidebar-submenu-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 15px 20px;
          border: none;
          background: transparent;
          color: #e2e8f0;
          text-decoration: none;
          transition: all 0.3s ease;
          gap: 0;
          min-height: 50px;
          font-weight: 600;
          cursor: pointer;
        }

        .sidebar-submenu-toggle:hover,
        .sidebar-submenu-toggle.open {
          background-color: #1e293b;
          color: #fff;
          padding-left: 25px;
        }

        .sidebar-submenu-caret {
          margin-left: auto;
          font-size: 0.8rem;
          opacity: 0.9;
        }

        .audit-submenu {
          list-style: none;
          margin: 0;
          padding: 4px 0 8px;
        }

        .audit-submenu a {
          min-height: 42px;
          padding: 10px 20px 10px 52px;
          font-size: 0.95rem;
          font-weight: 500;
          color: #cbd5e1;
        }

        .audit-submenu a:hover {
          padding-left: 57px;
          background-color: #1e293b;
        }

        .audit-submenu a.active {
          background-color: #334155;
          border-left: 3px solid #38bdf8;
          padding-left: 49px;
          color: #fff;
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

        .sidebar.closed .sidebar-submenu-toggle {
          justify-content: center;
          padding: 15px;
          min-height: 60px;
        }

        .sidebar.closed .sidebar-nav a .sidebar-icon {
          margin-right: 0;
        }

        .sidebar.closed .sidebar-submenu-toggle .sidebar-icon {
          margin-right: 0;
        }

        .sidebar-logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 15px 20px;
          border: none;
          background: transparent;
          color: #e2e8f0;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sidebar-logout-btn:hover {
          background-color: #1e293b;
          color: #fff;
          padding-left: 25px;
        }

        .sidebar.closed .sidebar-logout-btn {
          justify-content: center;
          padding: 15px;
          min-height: 60px;
        }

        .sidebar.closed .sidebar-logout-btn .sidebar-icon {
          margin-right: 0;
        }

        .sidebar.closed .sidebar-nav a:hover {
          padding-left: 15px;
        }

        @media (max-width: 900px) {
          .sidebar {
            width: 230px;
            transform: translateX(0);
          }

          .sidebar.closed {
            transform: translateX(-100%);
            width: 230px;
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
