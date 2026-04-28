import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPasswordAdmin() {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: enter identifier, 2: enter OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [email, setEmail] = useState(''); // to display masked email
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // No global background class; keep default white
  }, []);

  useEffect(() => {
    if (!countdown) return undefined;
    const id = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = identifier.includes('@') ? { email: identifier } : { name: identifier };
      const { data } = await api.post('/admin/forgot-password', payload);
      if (data.success) {
        setEmail(data.maskedEmail);
        setStep(2);
        setCountdown(120);
        setSuccess(null); // Clear success message after transitioning to OTP entry
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP. Please check your name or email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = identifier.includes('@') ? { email: identifier, otp } : { name: identifier, otp };
      const { data } = await api.post('/admin/verify-otp', payload);
      if (data.success) {
        // Store the reset token
        localStorage.setItem('resetToken', data.resetToken);
        window.location.href = '/admin/reset-password';
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = identifier.includes('@') ? { email: identifier } : { name: identifier };
      const { data } = await api.post('/admin/forgot-password', payload);
      if (data.success) {
        setSuccess('OTP resent successfully!');
        setCountdown(120);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', width: '100%', backgroundColor: '#222831', flexDirection: 'column' }}
    >
      <div
        className="card shadow-lg p-4 w-100"
        style={{
          maxWidth: '28rem',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
        }}
      >
        <div className="card-body">
          <h2 className="h4 text-center mb-4 fw-bold">Forgot Password</h2>
          <p className="text-center text-muted small mb-4">Admin Account Recovery</p>

          {step === 1 ? (
            <form onSubmit={handleSendOTP}>
              <div className="mb-3">
                <label className="form-label">Admin Name</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="form-control"
                  placeholder="Enter your full name"
                />
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {success && <div className="alert alert-success py-2 small">{success}</div>}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 mb-3"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <div className="text-center">
                <Link to="/admin/login" className="text-decoration-none small">
                  ← Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="alert alert-info py-2 small mb-3">
                OTP has been sent to {email}
                {countdown > 0 && (
                  <div className="mt-1 small text-muted">
                    Expires in {Math.floor(countdown / 60)}:{`${countdown % 60}`.padStart(2, '0')}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="form-control"
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                />
              </div>

              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              {success && <div className="alert alert-success py-2 small">{success}</div>}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-100 mb-2"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading || countdown > 0}
                className="btn btn-outline-secondary w-100 mb-3"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
              </button>

              <div className="text-center">
                <Link to="/admin/login" className="text-decoration-none small">
                  ← Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
