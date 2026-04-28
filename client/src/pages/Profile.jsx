import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import SlideNotification from '../components/SlideNotification';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';
import { useLocation } from 'react-router-dom';

export default function Profile() {
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    text: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isFirstLoginMode, setIsFirstLoginMode] = useState(false);

  const showNotification = (text, type = 'success') => {
    setNotification({ visible: true, type, text });
  };

  useEffect(() => {
    loadAdminProfile();
  }, [location.search]);

  const loadAdminProfile = async () => {
    try {
      setLoading(true);
      
      // Get user info from JWT token
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = jwtDecode(token);
        const meRes = await api.get('/admin/me');
        const me = meRes?.data?.data;

        const firstLoginFromToken = decoded?.isFirstLogin === true;
        const firstLoginFromServer = me?.isFirstLogin === true;
        const firstLoginFromQuery = new URLSearchParams(location.search).get('firstLogin') === '1';
        const firstLogin = firstLoginFromToken || firstLoginFromServer || firstLoginFromQuery;

        setIsFirstLoginMode(firstLogin);
        setIsChangingPassword(firstLogin);

        setAdmin({
          id: me?.id || decoded.id,
          name: me?.name || decoded.name,
          email: me?.email || decoded.email,
          role: me?.role || decoded.role
        });
        setFormData({
          name: me?.name || decoded.name || '',
          email: me?.email || decoded.email || ''
        });
      } else {
        throw new Error('No token found');
      }
    } catch (err) {
      showNotification(err?.message || 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Updating profile with:', formData);
      const res = await api.put('/admin/profile', formData);
      console.log('Update response:', res.data);
      
      // Update local state
      setAdmin({ ...admin, ...formData });
      
      // Update token if server sends new one
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }
      
      showNotification('Profile updated successfully!', 'success');
      setIsEditing(false);
      
      // Reload to get fresh token data
      setTimeout(() => loadAdminProfile(), 1000);
    } catch (err) {
      console.error('Profile update error:', err);
      console.error('Error response:', err?.response);
      showNotification(err?.response?.data?.message || err.message || 'Failed to update profile', 'error');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showNotification('Password must be at least 8 characters long', 'error');
      return;
    }

    if (!/[a-z]/.test(passwordData.newPassword)) {
      showNotification('Password must contain at least one lowercase letter', 'error');
      return;
    }

    if (!/[A-Z]/.test(passwordData.newPassword)) {
      showNotification('Password must contain at least one uppercase letter', 'error');
      return;
    }

    if (!/[0-9]/.test(passwordData.newPassword)) {
      showNotification('Password must contain at least one number', 'error');
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordData.newPassword)) {
      showNotification('Password must contain at least one special character', 'error');
      return;
    }

    try {
      const response = await api.put('/admin/password', {
        currentPassword: isFirstLoginMode ? undefined : passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      const updatedToken = response?.data?.data?.token;
      if (updatedToken) {
        localStorage.setItem('token', updatedToken);
      }

      showNotification('Password changed successfully!', 'success');
      setIsChangingPassword(false);
      setIsFirstLoginMode(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      showNotification(err?.response?.data?.message || 'Failed to change password', 'error');
    }
  };

  const roleLabel = admin?.role === 'super-admin' ? 'Super Admin' : 'Administrator';

  return (
    <>
      <Navbar />
      <Sidebar />
      <SlideNotification
        notification={notification}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />
      <div className="content-wrapper" style={{
        minHeight: 'calc(100vh - 60px)',
        marginTop: '60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 24px',
        backgroundColor: '#fff'
      }}>
        <div style={{ maxWidth: '700px', width: '100%' }}>

        {loading ? (
          <div className="text-center py-8">
            <div className="bg-white rounded-4 border" style={{ padding: '46px 24px', borderColor: '#e2e8f0' }}>
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-4 border shadow-sm" style={{ padding: '0', borderColor: '#e2e8f0', overflow: 'hidden' }}>
            {isEditing ? (
              <form onSubmit={handleUpdate} style={{ padding: '24px 24px' }}>
                <h4 className="mb-4" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>Edit Profile</h4>

                <div className="mb-3">
                  <label className="form-label" style={{ color: '#64748b', fontWeight: 600, fontSize: '0.88rem' }}>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    style={{ borderRadius: '10px', padding: '10px 12px', borderColor: '#cbd5e1' }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ color: '#64748b', fontWeight: 600, fontSize: '0.88rem' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    style={{ borderRadius: '10px', padding: '10px 12px', borderColor: '#cbd5e1' }}
                  />
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  <button type="submit" className="btn" style={{ background: '#0f172a', color: '#fff', borderRadius: '10px', padding: '9px 16px', fontWeight: 600 }}>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ background: '#e2e8f0', color: '#0f172a', borderRadius: '10px', padding: '10px 18px', fontWeight: 600 }}
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: admin?.name || '',
                        email: admin?.email || ''
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : isChangingPassword ? (
              <form onSubmit={handlePasswordChange} style={{ padding: '24px 24px' }}>
                <h4 className="mb-4" style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>Change Password</h4>
                {!isFirstLoginMode && (
                  <div className="mb-3">
                    <label className="form-label" style={{ color: '#64748b', fontWeight: 600, fontSize: '0.88rem' }}>Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, currentPassword: e.target.value })
                      }
                      required
                      style={{ borderRadius: '10px', padding: '10px 12px', borderColor: '#cbd5e1' }}
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label" style={{ color: '#64748b', fontWeight: 600, fontSize: '0.88rem' }}>New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    minLength={8}
                    style={{ borderRadius: '10px', padding: '10px 12px', borderColor: '#cbd5e1' }}
                  />
                  <small className="d-block mt-2" style={{ color: '#94a3b8' }}>
                    Must be at least 8 characters with lowercase, uppercase, number, and special character.
                  </small>
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ color: '#64748b', fontWeight: 600, fontSize: '0.88rem' }}>Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                    minLength={8}
                    style={{ borderRadius: '10px', padding: '10px 12px', borderColor: '#cbd5e1' }}
                  />
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  <button type="submit" className="btn" style={{ background: '#0f172a', color: '#fff', borderRadius: '10px', padding: '9px 16px', fontWeight: 600 }}>
                    Update Password
                  </button>
                  {!isFirstLoginMode && (
                    <button
                      type="button"
                      className="btn"
                      style={{ background: '#e2e8f0', color: '#0f172a', borderRadius: '10px', padding: '10px 18px', fontWeight: 600 }}
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <>
                <div style={{ padding: '18px 18px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: '50%',
                    margin: '0 auto 10px',
                    border: '3px solid #38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f1f5f9'
                  }}>
                    <i className="bi bi-person-fill" style={{ fontSize: '2.15rem', color: '#cbd5e1' }}></i>
                  </div>
                  <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 700, fontSize: '1.8rem' }}>{admin?.name || 'N/A'}</h3>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.98rem' }}>{roleLabel}</p>
                </div>

                <div style={{ padding: '12px 14px 14px' }}>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '9px 11px', display: 'flex', alignItems: 'center', gap: '11px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2f2ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-envelope"></i>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>EMAIL</div>
                        <div style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>{admin?.email || 'N/A'}</div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '9px 11px', display: 'flex', alignItems: 'center', gap: '11px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2f2ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-person-badge"></i>
                      </div>
                      <div>
                        <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>ROLE</div>
                        <div style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 600 }}>{roleLabel}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'grid', gap: '9px' }}>
                    <button
                      className="btn"
                      onClick={() => setIsEditing(true)}
                      style={{ background: '#0f172a', color: '#fff', borderRadius: '10px', padding: '9px 14px', fontSize: '0.98rem', fontWeight: 700 }}
                    >
                      <i className="bi bi-pencil-square me-2"></i>
                      Edit Profile
                    </button>
                    <button
                      className="btn"
                      onClick={() => setIsChangingPassword(true)}
                      style={{ background: '#dbeafe', color: '#0f172a', borderRadius: '10px', padding: '9px 14px', fontSize: '0.98rem', fontWeight: 700 }}
                    >
                      <i className="bi bi-key me-2"></i>
                      Reset Password
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
}
