import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function ForgotPasswordStudent() {
  const [enrollmentNumber, setEnrollmentNumber] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: enter enrollment/email, 2: enter OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [email, setEmail] = useState(''); // masked email from backend

  useEffect(() => {
    // Clear stored identifier on mount for a fresh flow
    localStorage.removeItem('studentIdentifier');
  }, []);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = (identifier || enrollmentNumber).includes('@')
        ? { email: identifier || enrollmentNumber }
        : { enrollmentNumber: identifier || enrollmentNumber };

      const { data } = await api.post('/student/forgot-password', payload);
      if (data.success) {
        localStorage.setItem('studentIdentifier', data.identifier);
        setIdentifier(data.identifier);
        setEmail(data.maskedEmail);
        setStep(2);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to send OTP. Please check your enrollment number or email.',
      );
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
      const storedIdentifier = localStorage.getItem('studentIdentifier') || identifier;
      if (!storedIdentifier) {
        setError('Session expired. Please start the password reset process again.');
        setStep(1);
        return;
      }

      const payload = { identifier: storedIdentifier, otp };
      const { data } = await api.post('/student/verify-otp', payload);
      if (data.success) {
        localStorage.setItem('resetToken', data.resetToken);
        window.location.href = '/student/reset-password';
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
      const storedIdentifier = localStorage.getItem('studentIdentifier') || identifier;
      if (!storedIdentifier) {
        setError('Session expired. Please start the password reset process again.');
        setStep(1);
        return;
      }

      const payload = storedIdentifier.includes('@')
        ? { email: storedIdentifier }
        : { enrollmentNumber: storedIdentifier };

      const { data } = await api.post('/student/forgot-password', payload);
      if (data.success) {
        setSuccess('OTP resent. Please check your inbox.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{ minHeight: '100vh', backgroundColor: '#222831', padding: '20px' }}
    >
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card-body">
          <h3 className="card-title mb-3 text-center">Student Password Recovery</h3>
          <p className="text-muted small text-center mb-4">
            Enter your enrollment number or email to receive an OTP.
          </p>

          {step === 1 ? (
            <form onSubmit={handleSendOTP}>
              <div className="mb-3">
                <label className="form-label">Enrollment Number or Email</label>
                <input
                  type="text"
                  value={identifier || enrollmentNumber}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setEnrollmentNumber(e.target.value);
                  }}
                  required
                  className="form-control"
                  placeholder="Enter your enrollment number or email"
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
                <Link to="/student/login" className="text-decoration-none small">
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="alert alert-info py-2 small mb-3">
                OTP has been sent to {email}
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
                disabled={loading}
                className="btn btn-outline-secondary w-100 mb-3"
              >
                Resend OTP
              </button>

              <div className="text-center">
                <Link to="/student/login" className="text-decoration-none small">
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
