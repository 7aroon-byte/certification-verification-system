import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import Navbar from '../components/Navbar';
import StudentSidebar from '../components/StudentSidebar';
import SlideNotification from '../components/SlideNotification';

export default function StudentProfile() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [name, setName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: 'success',
    text: ''
  });

  const showNotification = (text, type = 'success') => {
    setNotification({ visible: true, type, text });
  };

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/student/me');
        const me = res?.data?.data;
        if (me) {
          setProfile({
            name: me.name || '',
            email: me.email || '',
            id: me.id,
            enrollmentNumber: me.enrollment_number ?? 'N/A'
          });
          setName(me.name || '');
          setEmailInput(me.email || '');
          return;
        }
      } catch (err) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const decoded = jwtDecode(token);
            setProfile({
              name: decoded.name || '',
              email: decoded.email || '',
              id: decoded.id,
              enrollmentNumber: decoded.enrollment_number || decoded.enrollmentNumber || 'N/A'
            });
            setName(decoded.name || '');
            setEmailInput(decoded.email || '');
          } catch (error) {
            console.error('Error decoding token:', error);
          }
        }
      }
    }
    loadProfile();
  }, []);

  async function handleUpdateProfile(e) {
    e.preventDefault();

    const formType = e.nativeEvent?.submitter?.dataset?.form;

    if (formType === 'name') {
      if (!name || name === profile.name) {
        showNotification('Please enter a different name to update', 'error');
        return;
      }
    }

    if (formType === 'email') {
      if (!emailInput) {
        showNotification('Please enter an email', 'error');
        return;
      }
      if (emailInput === profile.email) {
        showNotification('Please enter a different email to update', 'error');
        return;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput)) {
        showNotification('Please enter a valid email address', 'error');
        return;
      }
    }

    if (formType === 'info') {
      if (!name || !emailInput) {
        showNotification('Name and email are required', 'error');
        return;
      }

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(emailInput)) {
        showNotification('Please enter a valid email address', 'error');
        return;
      }

      if (name === profile.name && emailInput === profile.email) {
        showNotification('Please update at least one field before submitting', 'error');
        return;
      }
    }

    if (formType === 'password') {
      if (!password) {
        showNotification('Please enter a new password', 'error');
        return;
      }
      if (password && password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
      }
      if (!oldPassword) {
        showNotification('Current password is required to set a new password', 'error');
        return;
      }
      if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const updateData = {};
      if (formType === 'name') {
        updateData.name = name;
      }
      if (formType === 'email') {
        updateData.email = emailInput;
      }
      if (formType === 'password') {
        updateData.password = password;
        updateData.oldPassword = oldPassword;
      }
      if (formType === 'info') {
        if (name !== profile.name) {
          updateData.name = name;
        }
        if (emailInput !== profile.email) {
          updateData.email = emailInput;
        }
      }

      await api.put('/student/profile', updateData);

      showNotification('Profile updated successfully!', 'success');
      if (formType === 'password') {
        setOldPassword('');
        setPassword('');
        setConfirmPassword('');
        setIsEditingPassword(false);
      }
      if (formType === 'name') {
        setProfile((prev) => ({ ...prev, name }));
      }
      if (formType === 'email') {
        setProfile((prev) => ({ ...prev, email: emailInput }));
      }
      if (formType === 'info') {
        setProfile((prev) => ({ ...prev, name, email: emailInput }));
        setIsEditingInfo(false);
      }

      window.dispatchEvent(
        new CustomEvent('student-profile-updated', { detail: { name, email: emailInput } })
      );
    } catch (err) {
      console.error(err);
      showNotification(err?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  }

  const primaryButtonStyle = {
    padding: '12px 24px',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background-color 0.3s',
    minWidth: '190px'
  };

  const secondaryButtonStyle = {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background-color 0.3s',
    minWidth: '190px'
  };

  return (
    <>
      <Navbar />
      <StudentSidebar />
      <SlideNotification
        notification={notification}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />
      <div className="content-wrapper" style={{ marginTop: '56px', padding: '40px 30px', background: '#f6f8fb', minHeight: 'calc(100vh - 56px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '30px', color: '#1a1a2e' }}>My Profile</h1>

        <div
          style={{
            backgroundColor: '#fff',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#1a1a2e' }}>
            👤 Profile Information
          </h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div
              style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '5px' }}>Name</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1a1a2e' }}>
                  {profile.name || 'N/A'}
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '5px' }}>Email</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1a1a2e' }}>
                  {profile.email || 'N/A'}
                </div>
              </div>
            </div>
            <div
              style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ color: '#666', fontSize: '0.875rem', marginBottom: '5px' }}>
                  Student ID
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1a1a2e' }}>
                  {profile.enrollmentNumber && profile.enrollmentNumber !== 'N/A' ? (
                    profile.enrollmentNumber
                  ) : (
                    <span style={{ color: '#dc3545', fontStyle: 'italic' }}>Not Assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px',
            alignItems: 'stretch'
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: '#1a1a2e' }}>
              👤 Edit Information
            </h2>
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a2e' }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={!isEditingInfo}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    backgroundColor: !isEditingInfo ? '#f8f9fa' : '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a2e' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  disabled={!isEditingInfo}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    backgroundColor: !isEditingInfo ? '#f8f9fa' : '#fff'
                  }}
                />
              </div>

              {!isEditingInfo ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingInfo(true);
                  }}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: '#0f4c81',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d3f6b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f4c81')}
                >
                  Edit Information
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    data-form="info"
                    disabled={loading}
                    style={{
                      ...primaryButtonStyle,
                      backgroundColor: loading ? '#6c757d' : '#0f4c81',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginRight: '10px'
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0d3f6b')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0f4c81')}
                  >
                    {loading ? 'Updating...' : 'Update Information'}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setName(profile.name || '');
                      setEmailInput(profile.email || '');
                      setIsEditingInfo(false);
                    }}
                    style={{
                      ...secondaryButtonStyle,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5a6268')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6c757d')}
                  >
                    Cancel
                  </button>
                </>
              )}
            </form>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <h2 style={{ fontSize: '1.3rem', marginBottom: '16px', color: '#1a1a2e' }}>
              🔒 Change Password
            </h2>
            <form onSubmit={handleUpdateProfile}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a2e' }}
                >
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={!isEditingPassword}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    backgroundColor: !isEditingPassword ? '#f8f9fa' : '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a2e' }}
                >
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={!isEditingPassword}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    backgroundColor: !isEditingPassword ? '#f8f9fa' : '#fff'
                  }}
                />
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  Click Edit Password before entering password details
                </small>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label
                  style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1a1a2e' }}
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={!isEditingPassword || !password}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '5px',
                    border: '1px solid #ddd',
                    fontSize: '1rem',
                    backgroundColor: !isEditingPassword || !password ? '#f8f9fa' : '#fff'
                  }}
                />
              </div>

              {!isEditingPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingPassword(true);
                  }}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: '#0f4c81',
                    cursor: 'pointer',
                    marginRight: '10px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d3f6b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f4c81')}
                >
                  Edit Password
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    data-form="password"
                    disabled={loading}
                    style={{
                      ...primaryButtonStyle,
                      backgroundColor: loading ? '#6c757d' : '#0f4c81',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      marginRight: '10px'
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0d3f6b')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0f4c81')}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setOldPassword('');
                      setPassword('');
                      setConfirmPassword('');
                      setIsEditingPassword(false);
                    }}
                    style={{
                      ...secondaryButtonStyle,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#5a6268')}
                    onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#6c757d')}
                  >
                    Cancel
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
