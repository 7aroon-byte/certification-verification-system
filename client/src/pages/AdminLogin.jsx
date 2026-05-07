// Commit: Repository re-initialized and pushed successfully
// Another test commit to trigger Vercel deployment with correct author
// Commit: Integration test - Vercel and Render backend connection
// Commit: Integration test - Vercel and Render backend connection
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/LoginPage.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('adminEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      console.log('Admin login attempt with:', { 
        email: trimmedEmail, 
        passwordLength: trimmedPassword.length 
      });
      const res = await api.post('/admin/login', { 
        email: trimmedEmail, 
        password: trimmedPassword 
      });
      console.log('Login response:', res);
      const token = res?.data?.token || res?.data?.data?.token;

      if (!token) throw new Error('No token returned');

      localStorage.setItem('token', token);
      localStorage.setItem('role', res?.data?.data?.role || 'admin');

      const isFirstLogin = !!(res?.data?.data?.isFirstLogin);

      if (rememberMe) {
        localStorage.setItem('adminEmail', email);
      } else {
        localStorage.removeItem('adminEmail');
      }

      setEmail('');
      setPassword('');
      
      setTimeout(() => {
        if (isFirstLogin) {
          navigate('/admin/profile?firstLogin=1');
        } else {
          navigate('/admin/dashboard');
        }
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error details:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        message: err?.response?.data?.message,
        errorMessage: err.message,
        code: err?.code
      });
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <header className="login-top-strip" aria-label="Top navigation">
        <div className="login-top-strip-inner">
          <div className="login-top-contact">
            <img className="login-top-logo" src="/logo.png" alt="IHECVS logo" />
            <strong>IHECVS</strong>
          </div>
          <div className="login-top-nav-links" aria-label="Primary links">
            <Link to="/">HOME</Link>
            <Link to="/verify">VERIFICATION</Link>
            <Link to="/contact">ENQUIRY/SUPPORT</Link>
            <Link className="active" to="/admin/login">SIGN IN</Link>
          </div>
        </div>
      </header>

      <div className="login-body">
        <div className="text-center mb-4">
        </div>
        <div className="card shadow-lg p-4 w-100" style={{ maxWidth: '28rem', backgroundColor: '#ffffff', border: '1px solid #d9e2ef', borderRadius: '12px' }}>
          <div className="card-body">
            <h2 className="h4 text-center mb-4 fw-bold">Admin Login</h2>
            <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-control"
                placeholder="Enter your email"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-control"
                placeholder="Enter your password"
              />
            </div>

            <div className="mb-3 d-flex justify-content-between align-items-center">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              <Link to="/admin/forgot-password" className="text-decoration-none small">
                Forgot Password?
              </Link>
            </div>

            {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 mb-3"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="text-center">
              <Link to="/student/login" className="text-decoration-none small">
                Student Login
              </Link>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}