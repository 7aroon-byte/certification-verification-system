import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ResetPasswordAdmin() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '' });
  const [showRequirements, setShowRequirements] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // No global background class; keep default white
  }, []);

  useEffect(() => {
    // Check if reset token exists
    const resetToken = localStorage.getItem('resetToken');
    if (!resetToken) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const checkPasswordStrength = (password) => {
    if (!password) {
      return { score: 0, message: '', color: '' };
    }

    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Calculate score
    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    // Determine strength
    let message = '';
    let color = '';
    
    if (score <= 2) {
      message = 'Weak Password';
      color = 'danger';
    } else if (score === 3) {
      message = 'Fair Password';
      color = 'warning';
    } else if (score === 4) {
      message = 'Good Password';
      color = 'info';
    } else if (score === 5) {
      message = 'Strong Password';
      color = 'success';
    }

    return { score, message, color, checks };
  };

  useEffect(() => {
    const strength = checkPasswordStrength(newPassword);
    setPasswordStrength(strength);
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate password strength
    if (passwordStrength.score < 5) {
      setError('Password must meet all requirements: at least 8 characters, one uppercase, one lowercase, one number, and one special character.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const resetToken = localStorage.getItem('resetToken');
      const { data } = await api.post('/admin/reset-password', {
        resetToken,
        newPassword,
      });

      if (data.success) {
        setSuccess('Password reset successfully! Redirecting to login...');
        localStorage.removeItem('resetToken');
        setTimeout(() => {
          navigate('/admin/login');
        }, 2000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const { checks } = passwordStrength;

  return (
    <div className="d-flex align-items-center justify-content-center" style={{ 
      minHeight: '100vh', 
      width: '100%', 
      backgroundColor: '#222831',
      flexDirection: 'column'
    }}>
      <div className="card shadow-lg p-4 w-100" style={{ maxWidth: '32rem', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px' }}>
        <div className="card-body">
          <h2 className="h4 text-center mb-4 fw-bold">Reset Password</h2>
          <p className="text-center text-muted small mb-4">Admin Account</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setShowRequirements(true)}
                required
                className="form-control"
                placeholder="Enter new password"
              />
              
              {newPassword && (
                <div className={`mt-2 small alert alert-${passwordStrength.color} py-1`}>
                  <strong>{passwordStrength.message}</strong>
                </div>
              )}
            </div>

            {showRequirements && (
              <div className="mb-3 p-3 bg-light border rounded">
                <p className="small fw-bold mb-2">Password Requirements:</p>
                <ul className="small mb-0 ps-3">
                  <li className={checks?.length ? 'text-success' : 'text-danger'}>
                    {checks?.length ? '✓' : '✗'} At least 8 characters
                  </li>
                  <li className={checks?.uppercase ? 'text-success' : 'text-danger'}>
                    {checks?.uppercase ? '✓' : '✗'} One uppercase letter (A-Z)
                  </li>
                  <li className={checks?.lowercase ? 'text-success' : 'text-danger'}>
                    {checks?.lowercase ? '✓' : '✗'} One lowercase letter (a-z)
                  </li>
                  <li className={checks?.number ? 'text-success' : 'text-danger'}>
                    {checks?.number ? '✓' : '✗'} One number (0-9)
                  </li>
                  <li className={checks?.special ? 'text-success' : 'text-danger'}>
                    {checks?.special ? '✓' : '✗'} One special character (!@#$%^&*)
                  </li>
                </ul>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="form-control"
                placeholder="Confirm new password"
              />
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            {success && <div className="alert alert-success py-2 small">{success}</div>}

            <button
              type="submit"
              disabled={loading || passwordStrength.score < 5}
              className="btn btn-primary w-100 mb-3"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
