/**
 * Password Validation Utility for IHECVS
 * Enforces security requirements for passwords
 */

/**
 * Validate password against security requirements
 * Requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param {string} password - The password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validatePassword(password) {
  const errors = [];

  // Check minimum length
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)')
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate temporary password in format IHECVS<EnrollmentNumber>
 * Example: IHECVS2023CSC001
 * 
 * @param {string} enrollmentNumber - The student's enrollment number
 * @returns {string} - The temporary password
 */
function generateTemporaryPassword(enrollmentNumber) {
  if (!enrollmentNumber) {
    throw new Error('Enrollment number is required');
  }
  return `IHECVS${enrollmentNumber}`;
}

/**
 * Generate temporary password for admin onboarding.
 * Format ensures uppercase, number, and special character.
 * Example: Adm@A1B2C3D4
 *
 * @returns {string}
 */
function generateAdminTemporaryPassword() {
  const random = Math.random().toString(36).slice(-8).toUpperCase();
  return `Adm@${random}`;
}

/**
 * Get password strength feedback for UI
 * @param {string} password - The password to evaluate
 * @returns {Object} - { strength: 'weak'|'fair'|'good'|'strong', feedback: string[] }
 */
function getPasswordStrength(password) {
  const validation = validatePassword(password);
  
  if (!validation.isValid) {
    return {
      strength: 'weak',
      feedback: validation.errors
    };
  }

  let strength = 'good';
  const feedback = [];

  // Check for additional strength factors
  if (password.length >= 12) {
    strength = 'strong';
  } else if (password.length >= 10) {
    strength = 'good';
  } else {
    strength = 'fair';
  }

  // Check for multiple types of special characters
  const specialCharTypes = [
    /[!@#$%^&*]/.test(password),
    /[()_+\-=[\]{}]/.test(password),
    /[;':"\\|]/.test(password),
    /[,.<>/?]/.test(password)
  ].filter(Boolean).length;

  if (specialCharTypes >= 2) {
    feedback.push('Multiple types of special characters used');
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    feedback.push('Mixed case letters');
  }

  if (password.length >= 16) {
    feedback.push('Excellent password length');
  }

  return {
    strength,
    feedback: feedback.length > 0 ? feedback : ['Password meets all security requirements']
  };
}

module.exports = {
  validatePassword,
  generateTemporaryPassword,
  generateAdminTemporaryPassword,
  getPasswordStrength
};
