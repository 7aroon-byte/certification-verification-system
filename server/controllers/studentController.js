const bcrypt = require('bcrypt');
const userService = require('../services/useService');
const { signToken } = require('../utils/jwt');
const sessionService = require('../services/sessionService');
const { sendOTPEmail, sendPasswordResetConfirmation } = require('../services/emailService');
const { validatePassword } = require('../utils/passwordValidator');
const { logAuditEvent } = require('../services/auditService');
const crypto = require('crypto');

async function login(req, res) {
  const { email, password } = req.body;
  console.log('Student login attempt:', { email, passwordLength: password?.length });
  
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

  const student = await userService.findStudentByEmail(email);
  console.log('Student found:', !!student, student?.email);
  
  if (!student) {
    console.log('Student not found in database');
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  console.log('Student data from DB:', { 
    id: student.id, 
    email: student.email, 
    name: student.name, 
    enrollment_number: student.enrollment_number,
    is_first_login: student.is_first_login
  });

  const match = await bcrypt.compare(password, student.password);
  console.log('Password match:', match);
  
  if (!match) {
    console.log('Password does not match');
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const { token, jti, expiresAt } = signToken({ 
    id: student.id, 
    email: student.email, 
    name: student.name, 
    enrollment_number: student.enrollment_number || null,
    role: 'student' 
  });

  try {
    await sessionService.createSession({ jti, userId: student.id, role: 'student', expiresAt });
  } catch (err) {
    console.warn('Failed to create session record for student login:', err.message || err);
  }

  await logAuditEvent({
    actorId: student.id,
    actorRole: 'student',
    actorName: student.email,
    actionType: 'STUDENT_LOGIN',
    targetType: 'student',
    targetId: student.id,
    details: { email: student.email },
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  });
  
  // Return is_first_login flag so client can redirect to change password page
  res.json({ 
    success: true, 
    data: { 
      token,
      isFirstLogin: student.is_first_login === true || student.is_first_login === 1 // Handle both boolean and integer from DB
    } 
  });
}

async function logout(req, res) {
  try {
    await logAuditEvent({
      actorId: req.user?.id,
      actorRole: 'student',
      actorName: req.user?.email,
      actionType: 'STUDENT_LOGOUT',
      targetType: 'student',
      targetId: req.user?.id,
      details: { email: req.user?.email || null },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    try {
      if (req.user && req.user.jti) {
        await sessionService.revokeSession(req.user.jti);
      }
    } catch (err) {
      console.warn('Failed to revoke session during logout (student):', err.message || err);
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out student:', error);
    return res.status(500).json({ success: false, message: 'Failed to logout' });
  }
}

async function getMyCertificates(req, res) {
  const userId = req.user.id;
  const certs = await userService.getCertificatesByStudentId(userId);
  res.json({ success: true, data: certs });
}

async function updateProfile(req, res) {
  const { name, password, oldPassword } = req.body;
  const userId = req.user.id;
  if (!name && !password) return res.status(400).json({ success: false, message: 'Nothing to update' });

  const pool = require('../config/db');
  let table = 'students';

  // Fetch current password hash to validate old password and decide table
  let currentRow;
  let rows;
  [rows] = await pool.execute('SELECT password_hash FROM students WHERE id = ?', [userId]);
  currentRow = rows && rows[0];
  if (!currentRow) {
    table = 'users';
    [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
    currentRow = rows && rows[0];
  }

  if (!currentRow) {
    return res.status(404).json({ success: false, message: 'Student not found' });
  }

  if (password) {
    if (!oldPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }
    const matchOld = await bcrypt.compare(oldPassword, currentRow.password_hash);
    if (!matchOld) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
  }

  const fields = [];
  const values = [];
  if (name) { fields.push('name = ?'); values.push(name); }
  if (password) {
    const hashed = await bcrypt.hash(password, 10);
    fields.push('password_hash = ?'); values.push(hashed);
  }
  values.push(userId);

  const sql = `UPDATE ${table} SET ${fields.join(', ')} WHERE id = ?`;
  await pool.execute(sql, values);
  res.json({ success: true, message: 'Profile updated' });
}

async function getMe(req, res) {
  try {
    const userId = req.user.id;
    // Try students table first
    const pool = require('../config/db');
    const [rows] = await pool.execute(
      'SELECT id, name, email, enrollment_number, is_first_login FROM students WHERE id = ?',
      [userId]
    );

    let me = rows && rows[0];
    if (!me) {
      // Fallback to users table if students not available
      const [userRows] = await pool.execute(
        'SELECT id, name, email FROM users WHERE id = ?',
        [userId]
      );
      me = userRows && userRows[0];
      if (me) {
        me.enrollment_number = null;
        me.is_first_login = false;
      }
    }

    if (!me) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.json({ 
      success: true, 
      data: {
        ...me,
        isFirstLogin: me.is_first_login === true || me.is_first_login === 1
      }
    });
  } catch (err) {
    console.error('Error in getMe:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Change password for student on first login or during profile update
 * Used for both first-login forced password change and regular password change
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation are required'
      });
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: validation.errors
      });
    }

    // Get current student data
    const pool = require('../config/db');
    const [rows] = await pool.execute(
      'SELECT password_hash, is_first_login FROM students WHERE id = ?',
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const student = rows[0];

    // If not first login, require current password verification
    if (!student.is_first_login || (student.is_first_login !== true && student.is_first_login !== 1)) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required for password change'
        });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, student.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and set is_first_login to false
    const [result] = await pool.execute(
      'UPDATE students SET password_hash = ?, is_first_login = false WHERE id = ?',
      [passwordHash, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    console.log(`✓ Password changed successfully for student ID: ${userId}`);

    res.json({
      success: true,
      message: 'Password changed successfully. You can now access the system normally.',
      isFirstLogin: false
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
}

module.exports = { login, logout, getMyCertificates, updateProfile, getMe, forgotPassword, verifyOTP, resetPassword, changePassword };

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

async function forgotPassword(req, res) {
  const { enrollmentNumber, name } = req.body;
  
  // Student must provide either enrollment number OR full name
  if ((!enrollmentNumber || enrollmentNumber.trim() === '') && (!name || name.trim() === '')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Either enrollment number or full name is required' 
    });
  }

  try {
    const pool = require('../config/db');
    let rows;
    
    // Find student by enrollment number or name
    if (enrollmentNumber && enrollmentNumber.trim() !== '') {
      [rows] = await pool.execute(
        'SELECT id, name, email, enrollment_number FROM students WHERE enrollment_number = ?',
        [enrollmentNumber.trim()]
      );
    } else {
      [rows] = await pool.execute(
        'SELECT id, name, email, enrollment_number FROM students WHERE name = ?',
        [name.trim()]
      );
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student not found. Please verify your enrollment number or name.' 
      });
    }

    const student = rows[0];
    
    // Validate email exists
    if (!student.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'No email address registered for this student account.' 
      });
    }
    
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Use enrollment number as identifier (fallback to name if not available)
    const identifier = student.enrollment_number || student.name;
    
    // Store OTP with 2 minute expiration
    const otpData = {
      otp,
      studentId: student.id,
      enrollmentNumber: student.enrollment_number,
      name: student.name,
      email: student.email,
      expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes
      attempts: 0, // Track verification attempts
    };
    otpStore.set(`student_${identifier}`, otpData);

    // Send OTP via email
    try {
      await sendOTPEmail({
        to: student.email,
        name: student.name,
        otp,
        role: 'student',
        expiryMinutes: 2
      });
    } catch (emailError) {
      // Clean up OTP data if email fails
      otpStore.delete(`student_${identifier}`);
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email. Please try again or contact support.' 
      });
    }
    
    // Log for debugging (remove in production)
    console.log(`[STUDENT OTP] Generated for ${student.name} (${identifier}): ${otp} (expires in 2 min)`);
    
    // Mask email for security
    const emailParts = student.email.split('@');
    const maskedEmail = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`;

    res.json({ 
      success: true, 
      message: 'OTP sent to your registered email address',
      maskedEmail,
      identifier, // Return identifier for verification step
    });
  } catch (err) {
    console.error('Error in student forgotPassword:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
}

async function verifyOTP(req, res) {
  const { identifier, otp } = req.body;
  
  if (!identifier || !otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Identifier and OTP are required' 
    });
  }

  try {
    const otpData = otpStore.get(`student_${identifier}`);
    
    if (!otpData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found or OTP has expired. Please request a new one.' 
      });
    }

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(`student_${identifier}`);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check attempts limit (prevent brute force)
    if (otpData.attempts >= 5) {
      otpStore.delete(`student_${identifier}`);
      return res.status(429).json({ 
        success: false, 
        message: 'Too many failed attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpData.otp !== otp.trim()) {
      otpData.attempts++;
      otpStore.set(`student_${identifier}`, otpData);
      return res.status(400).json({ 
        success: false, 
        message: `Invalid OTP. ${5 - otpData.attempts} attempts remaining.` 
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Store reset token (valid for 15 minutes)
    otpData.resetToken = hashedResetToken;
    otpData.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    otpData.verified = true;
    otpStore.set(`student_${identifier}`, otpData);

    console.log(`[STUDENT OTP] Verified successfully for ${identifier}`);

    res.json({ 
      success: true, 
      message: 'OTP verified successfully. You can now reset your password.',
      resetToken, // Send plain token to client, store hashed version
    });
  } catch (err) {
    console.error('Error in student verifyOTP:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during OTP verification.' 
    });
  }
}

async function resetPassword(req, res) {
  const { resetToken, newPassword } = req.body;
  
  if (!resetToken || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Reset token and new password are required' 
    });
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
    });
  }

  try {
    // Hash the received token to match stored version
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Find the OTP data with this reset token
    let foundData = null;
    let foundKey = null;
    
    for (const [key, data] of otpStore.entries()) {
      if (key.startsWith('student_') && data.resetToken === hashedToken && data.verified) {
        foundData = data;
        foundKey = key;
        break;
      }
    }

    if (!foundData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token. Please restart the password reset process.' 
      });
    }

    if (Date.now() > foundData.resetTokenExpiry) {
      otpStore.delete(foundKey);
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token has expired. Please request a new OTP.' 
      });
    }

    // Hash new password with bcrypt (cost factor 12 for better security)
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    const pool = require('../config/db');
    const [result] = await pool.execute(
      'UPDATE students SET password_hash = ? WHERE id = ?',
      [passwordHash, foundData.studentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Student account not found' 
      });
    }

    // Clean up OTP data (single-use token)
    otpStore.delete(foundKey);

    // Send confirmation email (non-blocking)
    sendPasswordResetConfirmation({
      to: foundData.email,
      name: foundData.name,
      role: 'student'
    }).catch(err => console.error('Failed to send confirmation email:', err));

    console.log(`[STUDENT] Password reset successfully for ${foundData.name}`);

    res.json({ 
      success: true, 
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (err) {
    console.error('Error in student resetPassword:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during password reset' 
    });
  }
}
