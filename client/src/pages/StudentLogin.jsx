import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from '../services/api';
import PublicHeader from '../components/PublicHeader';
import '../styles/LoginPage.css';

export default function StudentLogin() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [rememberMe, setRememberMe] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		// Check if there's a saved email
		const savedEmail = localStorage.getItem('studentEmail');
		if (savedEmail) {
			setEmail(savedEmail);
			setRememberMe(true);
		}
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			// Trim whitespace from email and password
			const trimmedEmail = email.trim();
			const trimmedPassword = password.trim();
			
			const loginData = { 
				email: trimmedEmail, 
				password: trimmedPassword 
			};
			
			console.log('Student login attempt:', loginData);
			console.log('Email length:', trimmedEmail.length);
			console.log('Password length:', trimmedPassword.length);
			console.log('Email characters:', [...trimmedEmail].map(c => `${c}(${c.charCodeAt(0)})`).join(', '));
			
			const { data } = await api.post('/student/login', loginData);
			if (data.success && data.data.token) {
				localStorage.setItem("token", data.data.token);
				localStorage.setItem("role", "student");
				
				// Handle remember me
				if (rememberMe) {
					localStorage.setItem('studentEmail', email);
				} else {
					localStorage.removeItem('studentEmail');
				}
				
				// Check if this is first login - redirect to change password page
				if (data.data.isFirstLogin) {
					console.log('First login detected - redirecting to change password page');
					navigate("/student/change-password");
				} else {
					navigate("/student/dashboard");
				}
			} else {
				setError("Login failed. Invalid response from server.");
			}
		} catch (err) {
			console.error('Login error:', err);
			console.error('Status:', err?.response?.status);
			console.error('Error message:', err?.response?.data?.message);
			const message = err?.response?.data?.message || "Login failed. Check credentials and try again.";
			setError(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="ihecvs-homepage login-page">
			<PublicHeader active="signin" />

			<div className="login-body">
				<div className="text-center mb-4">
				</div>
				<div className="card shadow-lg p-4 w-100 login-card" style={{ maxWidth: '28rem' }}>
					<div className="card-body">
						<h2 className="h4 text-center mb-4 fw-bold">Student Login</h2>
						<form className="login-form" onSubmit={handleSubmit}>
						<div className="login-field">
							<label className="form-label">Email</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="form-control login-input"
								placeholder="Enter your email"
							/>
						</div>

						<div className="login-field">
							<label className="form-label">Password</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="form-control login-input"
								placeholder="Enter your password"
							/>
						</div>

						<div className="login-remember-row">
							<div className="form-check login-remember-check">
								<input
									type="checkbox"
									className="form-check-input login-remember-input"
									id="studentRememberMe"
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
								/>
								<label className="form-check-label login-remember-label" htmlFor="studentRememberMe">
									Remember me
								</label>
							</div>
							<Link to="/student/forgot-password" className="text-decoration-none login-remember-link">
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
							<Link to="/contact" className="text-decoration-none small">
								Contact Us
							</Link>
							<span className="text-muted small ms-2 me-2">|</span>
							<Link to="/admin/login" className="text-decoration-none small">
								Admin Login
							</Link>
						</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}