const bcrypt = require('bcrypt');
const userService = require('../services/useService');
const { signToken } = require('../utils/jwt');
const { sendOTPEmail, sendPasswordResetConfirmation, sendStudentAccountEmail, sendAdminAccountEmail } = require('../services/emailService');
const { generateTemporaryPassword, validatePassword } = require('../utils/passwordValidator');
const {
  logAuditEvent,
  getAuditLogs: fetchAuditLogs,
  getStudentLogs: fetchStudentLogs,
  getAdminLogs: fetchAdminLogs,
  getCertificateLogs: fetchCertificateLogs,
} = require('../services/auditService');
const { getVerificationInsights } = require('../services/verificationAnalyticsService');
const crypto = require('crypto');
const sessionService = require('../services/sessionService');

function toBlockchainIssueFailureMessage(rawErrorMessage) {
  const normalized = String(rawErrorMessage || '').trim().toLowerCase();
  if (!normalized) {
    return 'Blockchain service is unavailable. Certificate was not issued.';
  }

  if (normalized.includes('connection refused') || normalized.includes('unable to connect')) {
    return 'Blockchain node is offline. Certificate was not issued. Start the blockchain node and try again.';
  }

  if (normalized.includes('eth_rpc_url')) {
    return 'Blockchain service is not configured correctly. Certificate was not issued.';
  }

  return 'Blockchain transaction failed. Certificate was not issued.';
}

async function login(req, res) {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, passwordLength: password?.length });
  
  if (!email || !password) {
    console.log('Missing credentials');
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const user = await userService.findUserByEmail(email);
  console.log('User found:', !!user, user?.role);
  
  if (!user || !['admin', 'super-admin'].includes(user.role)) {
    console.log('User not found or has invalid role');
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password);
  console.log('Password match:', match);
  
  if (!match) {
    console.log('Password does not match');
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ success: false, message: 'Account suspended. Contact super-admin.' });
  }

  await logAuditEvent({
    actorId: user.id,
    actorRole: user.role,
    actorName: user.email,
    actionType: 'ADMIN_LOGIN',
    targetType: 'admin',
    targetId: user.id,
    details: { email: user.email },
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  });
  const { token, jti, expiresAt } = signToken({ ...user, isFirstLogin: !!user.is_first_login });

  // Create a server-side session record so authMiddleware can validate the JWT
  try {
    await sessionService.createSession({ jti, userId: user.id, role: user.role, expiresAt });
  } catch (sessErr) {
    console.warn('Failed to create session record for admin login:', sessErr.message || sessErr);
  }

  console.log('Login successful, token generated');
  res.json({
    success: true,
    data: {
      token,
      isFirstLogin: user.is_first_login === true || user.is_first_login === 1,
      role: user.role,
      status: user.status || 'active'
    }
  });
}

async function logout(req, res) {
  try {
    await logAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      actorName: req.user?.email,
      actionType: 'ADMIN_LOGOUT',
      targetType: 'admin',
      targetId: req.user?.id,
      details: { email: req.user?.email || null },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out admin:', error);
    return res.status(500).json({ success: false, message: 'Failed to logout' });
  }
}

async function getAuditLogs(req, res) {
  try {
    const { limit, offset, actionType } = req.query;
    const rows = await fetchAuditLogs({ limit, offset, actionType });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
}

async function getStudentLogs(req, res) {
  try {
    const { limit, offset } = req.query;
    const rows = await fetchStudentLogs({ limit, offset });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching student logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch student logs' });
  }
}

async function checkStudentAvailability(req, res) {
  try {
    const email = String(req.body?.email || '').trim();
    const enrollmentNumber = String(req.body?.enrollmentNumber || '').trim();

    if (!email && !enrollmentNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email or enrollment number is required'
      });
    }

    const [emailRecord, enrollmentRecord] = await Promise.all([
      email ? userService.findStudentByEmailIncludingDeleted(email) : Promise.resolve(null),
      enrollmentNumber ? userService.findStudentByEnrollmentNumberIncludingDeleted(enrollmentNumber) : Promise.resolve(null),
    ]);

    return res.json({
      success: true,
      data: {
        emailAvailable: email ? !emailRecord : null,
        enrollmentAvailable: enrollmentNumber ? !enrollmentRecord : null,
      }
    });
  } catch (error) {
    console.error('Error checking student availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check student availability'
    });
  }
}

async function getAdminLogs(req, res) {
  try {
    const { limit, offset } = req.query;
    const rows = await fetchAdminLogs({ limit, offset });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin logs' });
  }
}

async function getCertificateLogs(req, res) {
  try {
    const { limit, offset } = req.query;
    const rows = await fetchCertificateLogs({ limit, offset });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching certificate logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch certificate logs' });
  }
}

async function getVerificationAnalytics(req, res) {
  try {
    const insights = await getVerificationInsights();
    return res.json({ success: true, data: insights });
  } catch (error) {
    console.error('Error fetching verification analytics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch verification analytics' });
  }
}

async function createStudent(req, res) {
  try {
    const {
      name,
      email,
      contactNumber,
      enrollmentNumber,
      enrollmentYear,
      graduationYear,
      positionHeld,
      conduct,
      status = 'active'
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !enrollmentNumber || !enrollmentYear || !graduationYear || !positionHeld || !conduct) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, enrollment number, enrollment year, graduation year, position held, and conduct are required' 
      });
    }

    // Check if student with this email already exists
    const existing = await userService.findStudentByEmail(email);
    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'A student account with this email already exists' 
      });
    }

    // Check if student with this enrollment number already exists
    const existingEnrollment = await userService.findStudentByEnrollmentNumber(enrollmentNumber);
    if (existingEnrollment) {
      return res.status(409).json({ 
        success: false, 
        message: 'A student account with this enrollment number already exists' 
      });
    }

    const deletedByEmail = await userService.findStudentByEmailIncludingDeleted(email);
    const deletedByEnrollment = await userService.findStudentByEnrollmentNumberIncludingDeleted(enrollmentNumber);

    const deletedEmailRecord = deletedByEmail?.is_deleted ? deletedByEmail : null;
    const deletedEnrollmentRecord = deletedByEnrollment?.is_deleted ? deletedByEnrollment : null;

    // If email and enrollment point to two different soft-deleted rows, restoring either will violate unique keys.
    if (deletedEmailRecord && deletedEnrollmentRecord && deletedEmailRecord.id !== deletedEnrollmentRecord.id) {
      return res.status(409).json({
        success: false,
        message: 'Conflicting archived records found for this email and enrollment number. Use the original email-enrollment pair or update one archived record before creating a new student.'
      });
    }

    const deletedRecord = deletedEmailRecord || deletedEnrollmentRecord || null;

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword(enrollmentNumber);
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Create or restore student account with isFirstLogin = true
    const createPayload = {
      name,
      email,
      passwordHash,
      contactNumber: contactNumber || null,
      enrollmentNumber,
      enrollmentYear,
      graduationYear,
      positionHeld,
      conduct,
      isFirstLogin: true
    };

    const created = deletedRecord
      ? await userService.restoreStudent(deletedRecord.id, createPayload)
      : await userService.createStudent(createPayload);

    // Send account creation email with temporary credentials
    const loginUrl = process.env.PUBLIC_BASE_URL || 'https://certification-verification-system.vercel.app';
    const studentLoginUrl = `${loginUrl}/student/login`;
    
    // Send account creation email with temporary credentials in background
    sendStudentAccountEmail({
      to: email,
      name,
      enrollmentNumber,
      temporaryPassword,
      loginUrl: studentLoginUrl
    })
      .then(() => console.log(`✓ Student account created/restored and email sent: ${email}`))
      .catch((emailError) => console.error('Failed to send account creation email (background):', emailError?.message || emailError));

    // Respond immediately — email delivery is attempted in background to avoid blocking the API
    res.status(201).json({
      success: true,
      message: 'Student account created successfully. Account credentials will be sent to the student email address shortly.',
      data: {
        id: created.id,
        name: created.name,
        email: created.email,
        contactNumber: created.contactNumber,
        enrollmentNumber: created.enrollmentNumber,
        enrollmentYear: created.enrollmentYear,
        graduationYear: created.graduationYear,
        positionHeld: created.positionHeld,
        conduct: created.conduct,
        status,
        isFirstLogin: created.isFirstLogin
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);

    if (error?.code === 'ER_DUP_ENTRY') {
      const message = String(error?.sqlMessage || error?.message || 'Duplicate entry');
      if (message.includes('students.enrollment_number')) {
        return res.status(409).json({
          success: false,
          message: 'This enrollment number already exists in another student record.'
        });
      }
      if (message.includes('students.email')) {
        return res.status(409).json({
          success: false,
          message: 'This email already exists in another student record.'
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Duplicate student data found. Please use a different email or enrollment number.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create student account'
    });
  }
}

async function getAllUsers(req, res) {
  const students = await userService.getAllStudents();
  res.json({ success: true, data: students });
}

async function getMe(req, res) {
  try {
    const userId = req.user.id;
    const pool = require('../config/db');
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, is_first_login, status FROM admin WHERE id = ? LIMIT 1',
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const admin = rows[0];
    return res.json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        status: admin.status || 'active',
        isFirstLogin: admin.is_first_login === true || admin.is_first_login === 1
      }
    });
  } catch (error) {
    console.error('Error getting admin profile:', error);
    return res.status(500).json({ success: false, message: 'Failed to load admin profile' });
  }
}

async function getCertificates(req, res) {
  try {
    const rows = await userService.getAllCertificates();
    const data = rows.map((row) => ({
      id: row.id,
      enrollmentNumber: row.enrollment_number,
      studentName: row.student_name,
      studentEmail: row.student_email || null,
      createdAt: row.created_at,
      startDate: row.start_date,
      finishedDate: row.finished_date,
      dateIssued: row.date_issued,
      status: row.status,
      blockchainStatus: row.blockchain_status,
      examType: row.exam_type,
      positionHeld: row.position_held,
      conduct: row.conduct,
      issuerWallet: row.issuer_wallet,
      verificationCode: row.verification_code,
      pdfHash: row.pdf_hash,
      blockchainTxHash: row.blockchain_tx_hash
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load certificates' });
  }
}

async function issueCertificate(req, res) {
  let connection;
  try {
    console.log('Issue certificate request body:', req.body);
    
    const {
      studentId,
      enrollmentNumber,
      examType,
      positionHeld,
      conduct
    } = req.body;

    if (!studentId || !examType) {
      console.log('Missing fields:', { studentId, examType });
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    console.log('Looking up student with ID:', studentId);
    
    const db = require('../config/db');
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get student info - try students table first, then users table
    let studentRows;
    let queryError;
    
    try {
      [studentRows] = await connection.execute(
        `SELECT id, name, email, enrollment_number, enrollment_year, graduation_year, position_held, conduct
         FROM students
         WHERE id = ?`,
        [studentId]
      );
    } catch (err) {
      queryError = err;
      console.log('Students table query failed, trying users table:', err.message);
      try {
        [studentRows] = await connection.execute(
          `SELECT id, name, email,
                  NULL AS enrollment_number,
                  NULL AS enrollment_year,
                  NULL AS graduation_year,
                  NULL AS position_held,
                  NULL AS conduct
           FROM users
           WHERE id = ? AND role = ?`,
          [studentId, 'student']
        );
      } catch (innerErr) {
        console.error('Both queries failed:', innerErr);
        throw innerErr;
      }
    }

    console.log('Student query result:', studentRows);

    if (!studentRows || studentRows.length === 0) {
      const notFoundError = new Error('Student not found');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }

    const student = studentRows[0];
    console.log('Found student:', student);
    const normalizedExamType = String(examType || '').trim().toUpperCase();
    const resolvedEnrollmentNumber = String(student.enrollment_number || enrollmentNumber || '').trim();
    const enrollmentYear = String(student.enrollment_year || '').trim();
    const graduationYear = String(student.graduation_year || '').trim();
    const resolvedPositionHeld = String(student.position_held || positionHeld || 'None').trim() || 'None';
    const resolvedConduct = String(student.conduct || conduct || 'Satisfactory').trim() || 'Satisfactory';

    if (!resolvedEnrollmentNumber) {
      return res.status(400).json({ success: false, message: 'Selected student is missing Student ID (enrollment number). Update student details first.' });
    }

    if (!/^\d{4}$/.test(enrollmentYear) || !/^\d{4}$/.test(graduationYear)) {
      return res.status(400).json({ success: false, message: 'Selected student is missing valid enrollment/graduation year. Update student details first.' });
    }

    const startDate = `${enrollmentYear}-01-01`;
    const finishDate = `${graduationYear}-12-31`;

    // Prevent duplicate active certificate for the same student and exam type
    const [duplicateRows] = await connection.execute(
      `SELECT id, exam_type, date_issued
       FROM certificates
       WHERE status = 'issued'
         AND exam_type = ?
         AND (student_id = ? OR enrollment_number = ?)
       ORDER BY id DESC
       LIMIT 1`,
      [normalizedExamType, studentId, resolvedEnrollmentNumber]
    );

    if (duplicateRows && duplicateRows.length > 0) {
      const existingCertificate = duplicateRows[0];
      const duplicateError = new Error(
        `This student already has an issued ${normalizedExamType} certificate (ID: ${existingCertificate.id}). Re-issuing is not allowed.`
      );
      duplicateError.statusCode = 409;
      throw duplicateError;
    }

    const certificate = await userService.createCertificate({
      studentId,
      enrollmentNumber: resolvedEnrollmentNumber,
      studentName: student.name,
      startDate,
      finishedDate: finishDate,
      examType: normalizedExamType,
      positionHeld: resolvedPositionHeld,
      conduct: resolvedConduct,
      issuerWallet: req.body.walletAddress || null
    }, connection);

    await connection.execute(
      "UPDATE students SET status = 'graduated' WHERE id = ? AND COALESCE(is_deleted, 0) = 0",
      [studentId]
    );

    console.log('Certificate created:', certificate);

    // Generate PDF with QR code and compute hash
    const { generateCertificatePDF } = require('../services/pdfService');
    const baseUrl = process.env.PUBLIC_VERIFY_BASE_URL || undefined;
    const { filePath, hashHex } = await generateCertificatePDF({
      certificateId: certificate.id,
      studentName: student.name,
      enrollmentNumber: resolvedEnrollmentNumber,
      startDate,
      finishedDate: finishDate,
      examType: normalizedExamType,
      positionHeld: resolvedPositionHeld,
      conduct: resolvedConduct,
      verificationCode: certificate.verificationCode,
      baseUrl
    });

    // Persist PDF hash
    await userService.updateCertificateArtifacts(certificate.id, {
      pdfHash: hashHex
    }, connection);

    // Store hash on Ethereum (admin wallet, no student wallet required)
    const { registerOnChain } = require('../services/blockchainService');
    console.log('[Admin] Attempting blockchain registration with enrollmentNumber:', resolvedEnrollmentNumber);
    const onChain = await registerOnChain({ pdfHashHex: hashHex, enrollmentNumber: resolvedEnrollmentNumber });
    const txHash = onChain?.txHash || null;
    const chainStatus = Number(onChain?.status) === 1 ? 'onchain' : 'failed';

    if (!txHash || chainStatus !== 'onchain') {
      throw new Error('Blockchain transaction was not confirmed successfully');
    }

    console.log('[Admin] Blockchain registration successful. txHash:', txHash);

    // Update certificate with blockchain info
    await userService.updateCertificateArtifacts(certificate.id, {
      blockchainTxHash: txHash,
      blockchainStatus: chainStatus,
      issuerWallet: req.body.walletAddress || null
    }, connection);

    await connection.commit();
    connection.release();
    connection = null;

    await logAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      actorName: req.user?.email,
      actionType: 'CERTIFICATE_ISSUED',
      targetType: 'certificate',
      targetId: certificate.id,
      details: {
        email: req.user?.email || null,
        studentId,
        enrollmentNumber: resolvedEnrollmentNumber,
        examType: normalizedExamType,
        blockchainStatus: chainStatus,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.status(201).json({
      success: true,
      message: 'Certificate issued and registered on blockchain successfully',
      data: {
        ...certificate,
        pdfPath: filePath,
        pdfHash: hashHex,
        blockchainTxHash: txHash,
        blockchainStatus: chainStatus
      }
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Transaction rollback failed:', rollbackErr);
      }
      connection.release();
      connection = null;
    }
    console.error('Error issuing certificate:', error);
    console.error('Error stack:', error.stack);
    const statusCode = Number.isInteger(error?.statusCode)
      ? error.statusCode
      : String(error?.message || '').toLowerCase().includes('blockchain')
        ? 503
        : 500;

    const message = statusCode === 503
      ? toBlockchainIssueFailureMessage(error?.message)
      : (error.message || 'Failed to issue certificate');

    res.status(statusCode).json({ success: false, message });
  }
}

async function updateProfile(req, res) {
  try {
    console.log('Update profile request:', { userId: req.user?.id, body: req.body });
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Check if email is already taken by another user
    const existing = await userService.findUserByEmail(email);
    console.log('Existing user check:', existing);
    if (existing && existing.id !== userId) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const pool = require('../config/db');
    const [result] = await pool.execute(
      'UPDATE admin SET name = ?, email = ? WHERE id = ?',
      [name, email, userId]
    );
    console.log('Update result:', result);

    // Generate new token with updated info
    const { token, jti, expiresAt } = signToken({ id: userId, name, email, role: req.user.role });

    // Create a new server-side session for the new token (best-effort)
    try {
      await sessionService.createSession({ jti, userId, role: req.user.role, expiresAt });
    } catch (sessErr) {
      console.warn('Failed to create session for updated profile token:', sessErr.message || sessErr);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      token
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: error.message || 'Failed to update profile' });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    console.log('Change password request for user:', userId);

    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required' });
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.errors.join(', ') });
    }

    // Get user from database
    const pool = require('../config/db');
    const [userRows] = await pool.execute(
      'SELECT password_hash, is_first_login, role, name, email FROM admin WHERE id = ?',
      [userId]
    );

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRows[0];
    const isFirstLogin = user.is_first_login === true || user.is_first_login === 1;

    if (!isFirstLogin) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required' });
      }

      // Verify current password
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear first login requirement
    await pool.execute(
      'UPDATE admin SET password_hash = ?, is_first_login = false WHERE id = ?',
      [newPasswordHash, userId]
    );

    const token = signToken({
      id: userId,
      name: user.name,
      email: user.email,
      role: user.role,
      isFirstLogin: false
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        token,
        isFirstLogin: false
      }
    });
  } catch (error) {
    console.error('Error changing password:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: error.message || 'Failed to change password' });
  }
}

async function deleteCertificate(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Certificate id is required' });

    const certificate = await userService.getCertificateById(id);

    const affected = await userService.deleteCertificate(id);
    if (!affected) return res.status(404).json({ success: false, message: 'Certificate not found' });

    if (certificate) {
      await userService.recalculateStudentStatusFromCertificates({
        studentId: certificate.student_id,
        enrollmentNumber: certificate.enrollment_number
      });
    }

    await logAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      actorName: req.user?.email,
      actionType: 'CERTIFICATE_DELETED',
      targetType: 'certificate',
      targetId: id,
      details: { email: req.user?.email || null },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.json({ success: true, message: 'Certificate deleted' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete certificate' });
  }
}

async function revokeCertificate(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Certificate id is required' });

    const certificate = await userService.getCertificateById(id);

    const affected = await userService.revokeCertificate(id);
    if (!affected) return res.status(404).json({ success: false, message: 'Certificate not found' });

    if (certificate) {
      await userService.recalculateStudentStatusFromCertificates({
        studentId: certificate.student_id,
        enrollmentNumber: certificate.enrollment_number
      });
    }

    await logAuditEvent({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      actorName: req.user?.email,
      actionType: 'CERTIFICATE_REVOKED',
      targetType: 'certificate',
      targetId: id,
      details: { email: req.user?.email || null },
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    return res.json({ success: true, message: 'Certificate revoked' });
  } catch (error) {
    console.error('Error revoking certificate:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to revoke certificate' });
  }
}

async function updateCertificateArtifacts(req, res) {
  try {
    const { id } = req.params;
    const { pdfHash, blockchainTxHash, blockchainStatus, issuerWallet } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Certificate id is required' });
    }

    if (
      pdfHash === undefined &&
      blockchainTxHash === undefined &&
      blockchainStatus === undefined &&
      issuerWallet === undefined
    ) {
      return res.status(400).json({ success: false, message: 'No artifact fields provided' });
    }

    const affected = await userService.updateCertificateArtifacts(id, {
      pdfHash,
      blockchainTxHash,
      blockchainStatus,
      issuerWallet
    });

    if (!affected) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    return res.json({ success: true, message: 'Certificate artifacts updated' });
  } catch (error) {
    console.error('Error updating certificate artifacts:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update certificate artifacts' });
  }
}

async function generateUniqueVerificationCode(executor) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = crypto.randomBytes(16).toString('hex');
    const [rows] = await executor.execute('SELECT id FROM certificates WHERE verification_code = ? LIMIT 1', [code]);
    if (!rows || rows.length === 0) {
      return code;
    }
  }
  throw new Error('Unable to generate a unique verification code');
}

async function backfillIssuedCertificateQRCodes(req, res) {
  const pool = require('../config/db');
  const { generateCertificatePDF } = require('../services/pdfService');
  const { registerOnChain } = require('../services/blockchainService');
  const baseUrl = process.env.PUBLIC_VERIFY_BASE_URL || undefined;

  try {
    const [certificates] = await pool.execute(
      `SELECT id, enrollment_number, student_name, start_date, finished_date,
              exam_type, position_held, conduct, verification_code, issuer_wallet
       FROM certificates
       WHERE status = 'issued'
       ORDER BY id ASC`
    );

    if (!certificates || certificates.length === 0) {
      return res.json({
        success: true,
        message: 'No issued certificates found for QR backfill',
        data: { total: 0, updated: 0, failed: 0, failures: [] }
      });
    }

    const summary = {
      total: certificates.length,
      updated: 0,
      failed: 0,
      failures: []
    };

    for (const certificate of certificates) {
      let connection;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let verificationCode = certificate.verification_code;
        if (!verificationCode) {
          verificationCode = await generateUniqueVerificationCode(connection);
          await connection.execute(
            'UPDATE certificates SET verification_code = ? WHERE id = ?',
            [verificationCode, certificate.id]
          );
        }

        const { hashHex } = await generateCertificatePDF({
          certificateId: certificate.id,
          studentName: certificate.student_name,
          enrollmentNumber: certificate.enrollment_number,
          startDate: certificate.start_date,
          finishedDate: certificate.finished_date,
          examType: certificate.exam_type,
          positionHeld: certificate.position_held,
          conduct: certificate.conduct,
          verificationCode,
          baseUrl
        });

        const onChain = await registerOnChain({
          pdfHashHex: hashHex,
          enrollmentNumber: certificate.enrollment_number
        });

        const chainStatus = onChain.status === 1 ? 'onchain' : 'pending';

        await userService.updateCertificateArtifacts(
          certificate.id,
          {
            pdfHash: hashHex,
            blockchainTxHash: onChain.txHash,
            blockchainStatus: chainStatus,
            issuerWallet: certificate.issuer_wallet || null
          },
          connection
        );

        await connection.commit();
        summary.updated += 1;
      } catch (error) {
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackErr) {
            console.error('Backfill rollback failed for cert', certificate.id, rollbackErr.message);
          }
        }

        summary.failed += 1;
        summary.failures.push({
          id: certificate.id,
          enrollmentNumber: certificate.enrollment_number,
          error: error.message || String(error)
        });
      } finally {
        if (connection) {
          connection.release();
        }
      }
    }

    return res.json({
      success: true,
      message: `QR backfill completed. Updated: ${summary.updated}, Failed: ${summary.failed}`,
      data: summary
    });
  } catch (error) {
    console.error('Error running QR backfill:', error);
    return res.status(500).json({ success: false, message: error.message || 'QR backfill failed' });
  }
}

async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Student id is required' });
    }

    const affected = await userService.deleteStudent(id);
    if (!affected) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    return res.json({ success: true, message: 'Student archived successfully. Their data and certificates are preserved but they can no longer log in.' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete student' });
  }
}

async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      enrollment_number,
      enrollment_year,
      graduation_year,
      position_held,
      conduct,
      status
    } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Student id is required' });
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const affected = await userService.updateStudent(id, {
      name,
      email,
      enrollment_number,
      enrollment_year,
      graduation_year,
      position_held,
      conduct,
      status
    });
    if (!affected) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    try {
      const db = require('../config/db');
      const { generateCertificatePDF } = require('../services/pdfService');
      const baseUrl = process.env.PUBLIC_VERIFY_BASE_URL || undefined;

      const [certificateRows] = await db.execute(
        `SELECT id, student_name, enrollment_number, start_date, finished_date,
                exam_type, position_held, conduct, verification_code
         FROM certificates
         WHERE student_id = ?
           AND COALESCE(is_deleted, 0) = 0`,
        [id]
      );

      for (const certificate of certificateRows || []) {
        const { hashHex } = await generateCertificatePDF({
          certificateId: certificate.id,
          studentName: name || certificate.student_name,
          enrollmentNumber: certificate.enrollment_number,
          startDate: certificate.start_date,
          finishedDate: certificate.finished_date,
          examType: certificate.exam_type,
          positionHeld: certificate.position_held,
          conduct: certificate.conduct,
          verificationCode: certificate.verification_code,
          baseUrl
        });

        await userService.updateCertificateArtifacts(certificate.id, {
          pdfHash: hashHex
        });
      }
    } catch (syncError) {
      console.warn('Student updated, but certificate sync/regeneration failed:', syncError.message);
    }

    return res.json({ success: true, message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update student' });
  }
}

// ===== ADMIN MANAGEMENT FUNCTIONS =====

async function getAllAdmins(req, res) {
  try {
    const [admins] = await require('../config/db').execute(
      'SELECT id, name, email, role, status, created_at FROM admin WHERE role != ? ORDER BY created_at DESC',
      ['student']
    );
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admins' });
  }
}

async function createAdmin(req, res) {
  try {
    const { name, email } = req.body;
    const currentUserRole = req.user.role;
    const normalizedRole = 'admin';

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Only super-admin can create admins
    if (currentUserRole !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Only super-admins can create new admins' });
    }

    const { generateAdminTemporaryPassword } = require('../utils/passwordValidator');
    const temporaryPassword = generateAdminTemporaryPassword();

    // Check if admin with this email already exists
    const pool = require('../config/db');
    const [existing] = await pool.execute('SELECT id FROM admin WHERE email = ?', [email]);
    if (existing && existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An admin with this email already exists' });
    }

    // Hash default password and create admin with first-login reset required
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const [result] = await pool.execute(
      'INSERT INTO admin (name, email, password_hash, role, created_by, is_first_login, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, normalizedRole, req.user.id, true, 'active']
    );

    const loginUrl = process.env.PUBLIC_BASE_URL || 'https://certification-verification-system.vercel.app';
    const adminLoginUrl = `${loginUrl}/admin/login`;

    try {
      await sendAdminAccountEmail({
        to: email,
        name,
        temporaryPassword,
        loginUrl: adminLoginUrl
      });
    } catch (emailError) {
      return res.status(201).json({
        success: true,
        message: 'Admin account created but email sending failed. Share temporary password securely and ask admin to reset on first login.',
        data: {
          id: result.insertId,
          name,
          email,
          role: normalizedRole,
          status: 'active',
          isFirstLogin: true,
          temporaryPassword,
          emailError: emailError.message
        }
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Admin account created successfully. Login credentials have been sent to admin email and password reset is required on first login.',
      data: {
        id: result.insertId,
        name,
        email,
        role: normalizedRole,
        status: 'active',
        isFirstLogin: true,
        temporaryPassword
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ success: false, message: 'Failed to create admin' });
  }
}

async function updateAdmin(req, res) {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const pool = require('../config/db');

    const [existingByEmail] = await pool.execute('SELECT id FROM admin WHERE email = ? AND id <> ?', [email, id]);
    if (existingByEmail && existingByEmail.length > 0) {
      return res.status(409).json({ success: false, message: 'Another admin already uses this email' });
    }

    const [result] = await pool.execute(
      'UPDATE admin SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({ success: true, message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ success: false, message: 'Failed to update admin' });
  }
}

async function suspendAdmin(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const currentUserId = req.user.id;

    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (!['active', 'suspended'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: 'Status must be active or suspended' });
    }

    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ success: false, message: 'You cannot suspend your own account' });
    }

    const pool = require('../config/db');
    const [rows] = await pool.execute('SELECT id, role FROM admin WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (rows[0].role === 'super-admin') {
      return res.status(400).json({ success: false, message: 'Super-admin account cannot be suspended' });
    }

    await pool.execute('UPDATE admin SET status = ? WHERE id = ?', [normalizedStatus, id]);

    return res.json({
      success: true,
      message: normalizedStatus === 'suspended' ? 'Admin suspended successfully' : 'Admin re-activated successfully'
    });
  } catch (error) {
    console.error('Error suspending admin:', error);
    return res.status(500).json({ success: false, message: 'Failed to update admin status' });
  }
}

async function deleteAdmin(req, res) {
  try {
    const { id } = req.params;
    const currentUserRole = req.user.role;
    const currentUserId = req.user.id;

    // Only super-admin can delete admins
    if (currentUserRole !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Only super-admins can delete admins' });
    }

    // Cannot delete yourself
    if (currentUserId === parseInt(id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const pool = require('../config/db');
    const [result] = await pool.execute('DELETE FROM admin WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ success: false, message: 'Failed to delete admin' });
  }
}

module.exports = { login, logout, getMe, getAuditLogs, getStudentLogs, getAdminLogs, getCertificateLogs, getVerificationAnalytics, checkStudentAvailability, createStudent, getAllUsers, getCertificates, issueCertificate, updateProfile, changePassword, updateCertificateArtifacts, backfillIssuedCertificateQRCodes, deleteCertificate, revokeCertificate, deleteStudent, updateStudent, forgotPassword, verifyOTP, resetPassword, getAllAdmins, createAdmin, updateAdmin, suspendAdmin, deleteAdmin };

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

async function forgotPassword(req, res) {
  const { name } = req.body;
  
  // Admin must provide their full name
  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Admin name is required' });
  }

  try {
    const pool = require('../config/db');
    
    // Find admin by name (allow both admin and super-admin roles)
    const [rows] = await pool.execute(
      "SELECT id, name, email, role FROM admin WHERE name = ? AND role IN (?, ?)",
      [name.trim(), 'admin', 'super-admin']
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found. Please verify your name is correct.' 
      });
    }

    const admin = rows[0];
    
    // Validate email exists
    if (!admin.email) {
      return res.status(400).json({ 
        success: false, 
        message: 'No email address registered for this admin account.' 
      });
    }
    
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 2 minute expiration
    const otpData = {
      otp,
      adminId: admin.id,
      name: admin.name,
      email: admin.email,
      expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes
      attempts: 0, // Track verification attempts
    };
    otpStore.set(`admin_${name.trim()}`, otpData);

    // Send OTP via email
    try {
      // Use the actual admin role when sending so email templates can vary for super-admins if needed
      await sendOTPEmail({
        to: admin.email,
        name: admin.name,
        otp,
        role: admin.role || 'admin',
        expiryMinutes: 2
      });
    } catch (emailError) {
      // Clean up OTP data if email fails
      otpStore.delete(`admin_${name.trim()}`);
      console.error('Failed to send OTP email:', emailError);
      const normalized = String(emailError?.message || '').toLowerCase();
      const isTimeout = normalized.includes('timeout') || normalized.includes('etimedout') || normalized.includes('econnrefused');
      return res.status(isTimeout ? 503 : 500).json({ 
        success: false,
        code: isTimeout ? 'EMAIL_SERVICE_UNAVAILABLE' : 'EMAIL_SEND_FAILED',
        message: isTimeout
          ? 'Email service is temporarily unavailable. Please try again later.'
          : 'Failed to send OTP email. Please try again or contact support.',
        error: emailError?.message || emailError?.toString() || 'Unknown error'
      });
    }
    
    // Log for debugging (remove in production)
    console.log(`[ADMIN OTP] Generated for ${admin.name}: ${otp} (expires in 2 min)`);
    
    // Mask email for security
    const emailParts = admin.email.split('@');
    const maskedEmail = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`;

    res.json({ 
      success: true, 
      message: 'OTP sent to your registered email address',
      maskedEmail,
    });
  } catch (err) {
    console.error('Error in admin forgotPassword:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
}

async function verifyOTP(req, res) {
  const { name, otp } = req.body;
  
  if (!name || !otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Admin name and OTP are required' 
    });
  }

  try {
    const otpData = otpStore.get(`admin_${name.trim()}`);
    
    if (!otpData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No OTP found or OTP has expired. Please request a new one.' 
      });
    }

    // Check expiration
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(`admin_${name.trim()}`);
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Check attempts limit (prevent brute force)
    if (otpData.attempts >= 5) {
      otpStore.delete(`admin_${name.trim()}`);
      return res.status(429).json({ 
        success: false, 
        message: 'Too many failed attempts. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpData.otp !== otp.trim()) {
      otpData.attempts++;
      otpStore.set(`admin_${name.trim()}`, otpData);
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
    otpStore.set(`admin_${name.trim()}`, otpData);

    console.log(`[ADMIN OTP] Verified successfully for ${name}`);

    res.json({ 
      success: true, 
      message: 'OTP verified successfully. You can now reset your password.',
      resetToken, // Send plain token to client, store hashed version
    });
  } catch (err) {
    console.error('Error in admin verifyOTP:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during OTP verification.' 
    });
  }
}

async function resetPassword(req, res) {
  const { resetToken, newPassword } = req.body;
  
  console.log('[RESET] Request received:', { 
    hasResetToken: !!resetToken, 
    hasNewPassword: !!newPassword,
    otpStoreSize: otpStore.size,
    otpStoreKeys: Array.from(otpStore.keys())
  });
  
  if (!resetToken || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Reset token and new password are required' 
    });
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    console.log('[RESET] Password validation failed');
    return res.status(400).json({ 
      success: false, 
      message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
    });
  }

  try {
    // Hash the received token to match stored version
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    console.log('[RESET] Looking for hashed token:', hashedToken.substring(0, 10) + '...');
    
    // Find the OTP data with this reset token
    let foundData = null;
    let foundKey = null;
    
    for (const [key, data] of otpStore.entries()) {
      console.log('[RESET] Checking key:', key, 'verified:', data.verified, 'hasResetToken:', !!data.resetToken);
      if (data.resetToken === hashedToken && data.verified) {
        foundData = data;
        foundKey = key;
        break;
      }
    }

    if (!foundData) {
      console.log('[RESET] No matching reset token found in otpStore');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid reset token. Please restart the password reset process.' 
      });
    }

    if (Date.now() > foundData.resetTokenExpiry) {
      console.log('[RESET] Reset token expired');
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
      'UPDATE admin SET password_hash = ? WHERE id = ? AND role = ?',
      [passwordHash, foundData.adminId, 'admin']
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin account not found' 
      });
    }

    // Clean up OTP data (single-use token)
    otpStore.delete(foundKey);

    // Send confirmation email (non-blocking)
    sendPasswordResetConfirmation({
      to: foundData.email,
      name: foundData.name,
      role: 'admin'
    }).catch(err => console.error('Failed to send confirmation email:', err));

    console.log(`[ADMIN] Password reset successfully for ${foundData.name}`);

    res.json({ 
      success: true, 
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (err) {
    console.error('Error in admin resetPassword:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during password reset' 
    });
  }
}
