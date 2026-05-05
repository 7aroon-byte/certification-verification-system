// Trigger redeploy with correct Git author
// Trigger redeploy on Vercel
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from '../services/api';
import "../styles/ChangePassword.css";

/**
 * ChangePassword Component
 * Handles both first-login forced password change and regular password updates
 */
export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "Weak",
    requirements: {
      minLength: false,
      uppercase: false,
      number: false,
      special: false,
    },
  });
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Check if this is first login on component mount
  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/student/login");
          return;
        }

        // Fetch user info to check isFirstLogin flag
        const response = await api.get("/student/me");
        if (response.data.success && response.data.data.isFirstLogin) {
          setIsFirstLogin(true);
        }
      } catch (err) {
        console.error("Error checking first login status:", err);
      }
    };

    checkFirstLogin();
  }, [navigate]);

  // Evaluate password strength
  useEffect(() => {
    evaluatePasswordStrength(newPassword);
  }, [newPassword]);

  const evaluatePasswordStrength = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;
    let score = (metRequirements / 4) * 100;
    let label = "Weak";

    if (metRequirements === 4 && password.length >= 12) {
      label = "Strong";
      score = 100;
    } else if (metRequirements === 4) {
      label = "Good";
      score = 75;
    } else if (metRequirements >= 3) {
      label = "Fair";
      score = 50;
    }

    setPasswordStrength({
      score,
      label,
      requirements,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("New password and confirmation are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isFirstLogin && !currentPassword) {
      setError("Current password is required to change your password");
      return;
    }

    // Check password strength
    if (!passwordStrength.requirements.minLength) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (!passwordStrength.requirements.uppercase) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!passwordStrength.requirements.number) {
      setError("Password must contain at least one number");
      return;
    }
    if (!passwordStrength.requirements.special) {
      setError("Password must contain at least one special character");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/student/change-password", {
        currentPassword: isFirstLogin ? undefined : currentPassword,
        newPassword,
        confirmPassword,
      });

      if (response.data.success) {
        setSuccess(true);
        setError(null);
        
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/student/dashboard");
        }, 2000);
      } else {
        setError(response.data.message || "Failed to change password");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.join(", ") || 
                          "Failed to change password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStrengthBarColor = () => {
    if (passwordStrength.score === 0) return "#e0e0e0";
    if (passwordStrength.score < 50) return "#f44336";
    if (passwordStrength.score < 75) return "#ff9800";
    if (passwordStrength.score < 100) return "#8bc34a";
    return "#4caf50";
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="change-password-header">
          <h1>
            {isFirstLogin ? "Set Your Password" : "Change Password"}
          </h1>
          <p className="change-password-subtitle">
            {isFirstLogin
              ? "Welcome! Please set a secure password to continue"
              : "Update your account password"}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && (
          <div className="alert alert-success">
            Password changed successfully! Redirecting to dashboard...
          </div>
        )}

        <form onSubmit={handleSubmit} className="change-password-form">
          {!isFirstLogin && (
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  disabled={loading}
                  required={!isFirstLogin}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  tabIndex="-1"
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a new password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex="-1"
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>

            {newPassword && (
              <div className="password-strength">
                <div className="strength-bar-container">
                  <div
                    className="strength-bar"
                    style={{
                      width: `${passwordStrength.score}%`,
                      backgroundColor: getStrengthBarColor(),
                    }}
                  />
                </div>
                <p className="strength-label">
                  Strength: <span style={{ color: getStrengthBarColor() }}>
                    {passwordStrength.label}
                  </span>
                </p>

                <div className="requirements-list">
                  <div
                    className={`requirement ${
                      passwordStrength.requirements.minLength ? "met" : ""
                    }`}
                  >
                    <span className="requirement-icon">
                      {passwordStrength.requirements.minLength ? "✓" : "○"}
                    </span>
                    At least 8 characters
                  </div>
                  <div
                    className={`requirement ${
                      passwordStrength.requirements.uppercase ? "met" : ""
                    }`}
                  >
                    <span className="requirement-icon">
                      {passwordStrength.requirements.uppercase ? "✓" : "○"}
                    </span>
                    At least one uppercase letter
                  </div>
                  <div
                    className={`requirement ${
                      passwordStrength.requirements.number ? "met" : ""
                    }`}
                  >
                    <span className="requirement-icon">
                      {passwordStrength.requirements.number ? "✓" : "○"}
                    </span>
                    At least one number
                  </div>
                  <div
                    className={`requirement ${
                      passwordStrength.requirements.special ? "met" : ""
                    }`}
                  >
                    <span className="requirement-icon">
                      {passwordStrength.requirements.special ? "✓" : "○"}
                    </span>
                    At least one special character
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {newPassword && confirmPassword && newPassword === confirmPassword && (
              <p className="password-match-success">✓ Passwords match</p>
            )}
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="password-match-error">✗ Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading || !newPassword || !confirmPassword}
          >
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>

        {isFirstLogin && (
          <div className="info-box">
            <p>
              <strong>Note:</strong> This is your first login. You must set a new
              password to continue using the system. You will be redirected to your
              dashboard once your password is set.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
