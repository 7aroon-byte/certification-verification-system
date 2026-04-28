const nodemailer = require('nodemailer');

/**
 * Email Service for sending OTP and other emails
 * Configured via environment variables
 */

// Create reusable transporter
function createTransporter() {
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // Validate configuration
  if (!config.host || !config.auth.user || !config.auth.pass) {
    throw new Error('SMTP configuration incomplete. Check SMTP_HOST, SMTP_USER, and SMTP_PASS in .env');
  }

  return nodemailer.createTransport(config);
}

/**
 * Send OTP email to user
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - Recipient name
 * @param {string} params.otp - One-time password
 * @param {string} params.role - User role (admin/student)
 * @param {number} params.expiryMinutes - OTP expiry time in minutes
 */
async function sendOTPEmail({ to, name, otp, role, expiryMinutes = 2 }) {
  try {
    const transporter = createTransporter();
    
    const fromName = process.env.SMTP_FROM_NAME || 'Certificate Verification System';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: `Password Reset OTP - ${role === 'admin' ? 'Admin' : 'Student'} Account`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>We received a request to reset your password for your <strong>${role === 'admin' ? 'Admin' : 'Student'}</strong> account.</p>
              
              <div class="otp-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Your One-Time Password (OTP)</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for ${expiryMinutes} minutes</p>
              </div>
              
              <p>Enter this OTP on the password reset page to continue.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>This OTP is valid for <strong>${expiryMinutes} minutes</strong> only</li>
                  <li>Do not share this code with anyone</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
              
              <p>If you didn't request a password reset, your account is still secure and you can safely ignore this email.</p>
              
              <div class="footer">
                <p>This is an automated message, please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} Certificate Verification System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${name},

We received a request to reset your password for your ${role === 'admin' ? 'Admin' : 'Student'} account.

Your One-Time Password (OTP): ${otp}

This OTP is valid for ${expiryMinutes} minutes only.

Enter this OTP on the password reset page to continue.

SECURITY NOTICE:
- Do not share this code with anyone
- If you didn't request this, please ignore this email

This is an automated message, please do not reply.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ OTP email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log detailed error to help diagnose SMTP/auth/config issues
    console.error('✗ Failed to send OTP email:', error?.message || error);
    if (error?.response) {
      console.error('SMTP response:', error.response);
    }
    if (error?.stack) {
      console.error(error.stack);
    }
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Send password reset confirmation email
 */
async function sendPasswordResetConfirmation({ to, name, role }) {
  try {
    const transporter = createTransporter();
    
    const fromName = process.env.SMTP_FROM_NAME || 'Certificate Verification System';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: 'Password Reset Successful',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">Password Reset Successful</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your password has been successfully reset for your <strong>${role === 'admin' ? 'Admin' : 'Student'}</strong> account.</p>
            <p>If you did not perform this action, please contact support immediately.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply.</p>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${name},\n\nYour password has been successfully reset for your ${role === 'admin' ? 'Admin' : 'Student'} account.\n\nIf you did not perform this action, please contact support immediately.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✓ Password reset confirmation sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error('✗ Failed to send confirmation email:', error.message);
    // Don't throw error for confirmation emails - password reset already succeeded
    return { success: false, error: error.message };
  }
}

/**
 * Send student account creation email with temporary credentials
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - Student name
 * @param {string} params.enrollmentNumber - Student enrollment number (used as username)
 * @param {string} params.temporaryPassword - Temporary password (unhashed)
 * @param {string} params.loginUrl - System login URL
 */
async function sendStudentAccountEmail({ to, name, enrollmentNumber, temporaryPassword, loginUrl }) {
  try {
    const transporter = createTransporter();
    
    const fromName = process.env.SMTP_FROM_NAME || 'Certificate Verification System';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const systemName = 'Imamu Hafsin e-Certificate Verification System (IHECVS)';
    
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: `Welcome to ${systemName} - Account Created`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials-box { background: white; border-left: 4px solid #28a745; border-radius: 4px; padding: 20px; margin: 20px 0; font-family: 'Courier New', monospace; }
            .credential-row { margin: 12px 0; }
            .credential-label { color: #666; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .credential-value { color: #333; font-size: 14px; font-weight: bold; word-break: break-all; }
            .info-box { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .cta-button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
            .footer { text-align: center; color: #777; font-size: 12px; margin-top: 20px; }
            .system-name { font-weight: bold; color: #667eea; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to IHECVS</h1>
              <p style="margin: 5px 0 0 0;">Your account has been created</p>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              
              <p>Your student account has been successfully created in the <span class="system-name">${systemName}</span>.</p>
              
              <div class="credentials-box">
                <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; color: #333;">Your Login Credentials</p>
                
                <div class="credential-row">
                  <div class="credential-label">Username (Enrollment Number)</div>
                  <div class="credential-value">${enrollmentNumber}</div>
                </div>
                
                <div class="credential-row">
                  <div class="credential-label">Temporary Password</div>
                  <div class="credential-value">${temporaryPassword}</div>
                </div>
              </div>
              
              <div class="info-box">
                <strong>📌 Login Instructions:</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                  <li>Visit the login page at: <a href="${loginUrl}" style="color: #2196F3;">${loginUrl}</a></li>
                  <li>Enter your enrollment number as the username</li>
                  <li>Enter your temporary password</li>
                </ol>
              </div>
              
              <div class="warning-box">
                <strong>⚠️ Important - First Login Instructions:</strong>
                <p style="margin: 10px 0;">On your first login, you will be required to change your password. Please:</p>
                <ul style="margin: 10px 0;">
                  <li>Create a new, secure password</li>
                  <li>Use a password with at least 8 characters</li>
                  <li>Include at least one uppercase letter, one number, and one special character</li>
                  <li><strong>Save your new password securely</strong> - you will not be able to recover the temporary password</li>
                </ul>
              </div>
              
              <div class="info-box">
                <strong>🔒 Security Reminders:</strong>
                <ul>
                  <li>Never share your password with anyone, including administrators</li>
                  <li>This temporary password is for one-time use only on first login</li>
                  <li>You will be unable to access the system until you change your password</li>
                  <li>Keep your login credentials confidential</li>
                </ul>
              </div>
              
              <p style="margin-top: 20px;">If you have any questions or encounter issues logging in, please contact your system administrator.</p>
              
              <div class="footer">
                <p>This is an automated message from <strong>${systemName}</strong>. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Imamu Hafsin e-Certificate Verification System. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to ${systemName}

Hello ${name},

Your student account has been successfully created in the Imamu Hafsin e-Certificate Verification System (IHECVS).

LOGIN CREDENTIALS:
- Username (Enrollment Number): ${enrollmentNumber}
- Temporary Password: ${temporaryPassword}

LOGIN INSTRUCTIONS:
1. Visit: ${loginUrl}
2. Enter your enrollment number as the username
3. Enter your temporary password

IMPORTANT - FIRST LOGIN:
On your first login, you will be required to change your password. Please:
- Create a new, secure password
- Use at least 8 characters
- Include at least one uppercase letter, one number, and one special character
- Save your new password securely

SECURITY REMINDERS:
- Never share your password with anyone
- This temporary password is for one-time use only
- You will be unable to access the system until you change your password
- Keep your login credentials confidential

If you have any questions, please contact your system administrator.

This is an automated message. Please do not reply to this email.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Student account email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Failed to send student account email:', error?.message || error);
    if (error?.response) {
      console.error('SMTP response:', error.response);
    }
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Send admin account creation email with temporary credentials
 * @param {Object} params
 * @param {string} params.to
 * @param {string} params.name
 * @param {string} params.temporaryPassword
 * @param {string} params.loginUrl
 */
async function sendAdminAccountEmail({ to, name, temporaryPassword, loginUrl }) {
  try {
    const transporter = createTransporter();

    const fromName = process.env.SMTP_FROM_NAME || 'Certificate Verification System';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
    const systemName = 'Imamu Hafsin e-Certificate Verification System (IHECVS)';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Admin Account Created - ${systemName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2b7de9 0%, #1f5dbf 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials-box { background: white; border-left: 4px solid #2b7de9; border-radius: 4px; padding: 20px; margin: 20px 0; }
            .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Admin Account Created</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${name}</strong>,</p>
              <p>Your admin account has been created in <strong>${systemName}</strong>.</p>

              <div class="credentials-box">
                <p><strong>Login Email:</strong> ${to}</p>
                <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
              </div>

              <div class="warning-box">
                <strong>⚠️ First Login Required:</strong>
                <ul>
                  <li>You must change this temporary password on first login.</li>
                  <li>Use at least 8 characters with uppercase, number, and special character.</li>
                  <li>Keep your new password confidential.</li>
                </ul>
              </div>

              <p>This is an automated message. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${name},

Your admin account has been created in ${systemName}.

Login Email: ${to}
Temporary Password: ${temporaryPassword}
Login URL: ${loginUrl}

IMPORTANT:
- You must change this temporary password on first login.
- Use a secure password with uppercase, number, and special character.

This is an automated message. Please do not reply.
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Admin account email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('✗ Failed to send admin account email:', error?.message || error);
    if (error?.response) {
      console.error('SMTP response:', error.response);
    }
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

module.exports = {
  sendOTPEmail,
  sendPasswordResetConfirmation,
  sendStudentAccountEmail,
  sendAdminAccountEmail,
};
