const pool = require('../config/db');
const crypto = require('crypto');

function getUnknownColumnName(error) {
  const message = String(error?.message || '');
  const match = message.match(/Unknown column '([^']+)'/i);
  return match ? match[1] : null;
}

function buildSchemaErrorMessage(columnName) {
  if (!columnName) {
    return 'Database schema is out of date. Please run the latest migration/setup script.';
  }
  return `Database schema is missing required column: ${columnName}. Please run the latest migration/setup script.`;
}

async function findUserByEmail(email) {
  // Admin accounts live in the admin table (renamed from users)
  const [rows] = await pool.execute('SELECT id, name, email, password_hash as password, role, is_first_login, status FROM admin WHERE email = ?', [email]);
  return rows[0];
}

async function findStudentByEmail(email) {
  try {
    // Students table is the main source
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash as password, enrollment_number, status, is_first_login FROM students WHERE email = ? AND COALESCE(is_deleted, 0) = 0',
      [email]
    );
    if (rows && rows.length > 0) {
      return rows[0];
    }
    // If not found, return null (don't try to fall back to users table)
    return null;
  } catch (err) {
    console.error('Error finding student:', err.message);
    return null;
  }
}

async function findStudentByEmailIncludingDeleted(email) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash as password, enrollment_number, status, is_first_login, COALESCE(is_deleted, 0) AS is_deleted FROM students WHERE email = ?',
    [email]
  );
  return rows && rows.length > 0 ? rows[0] : null;
}

async function findStudentByEnrollmentNumber(enrollmentNumber) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash as password, enrollment_number, status, is_first_login FROM students WHERE enrollment_number = ? AND COALESCE(is_deleted, 0) = 0',
      [enrollmentNumber]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error('Error finding student by enrollment number:', err);
    return null;
  }
}

async function findStudentByEnrollmentNumberIncludingDeleted(enrollmentNumber) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash as password, enrollment_number, status, is_first_login, COALESCE(is_deleted, 0) AS is_deleted FROM students WHERE enrollment_number = ?',
    [enrollmentNumber]
  );
  return rows && rows.length > 0 ? rows[0] : null;
}

async function createUser({ name, email, passwordHash, role }) {
  const [result] = await pool.execute('INSERT INTO admin (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, passwordHash, role]);
  return { id: result.insertId, name, email, role };
}

async function createStudent({
  name,
  email,
  passwordHash,
  contactNumber = null,
  enrollmentNumber,
  enrollmentYear = null,
  graduationYear = null,
  positionHeld = null,
  conduct = null,
  isFirstLogin = true
}) {
  try {
    const [result] = await pool.execute(
      `INSERT INTO students
      (name, email, phone_number, password_hash, enrollment_number, enrollment_year, graduation_year, position_held, conduct, status, is_first_login)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        contactNumber,
        passwordHash,
        enrollmentNumber,
        enrollmentYear,
        graduationYear,
        positionHeld,
        conduct,
        'active',
        isFirstLogin
      ]
    );

    return {
      id: result.insertId,
      name,
      email,
      contactNumber,
      enrollmentNumber,
      enrollmentYear,
      graduationYear,
      positionHeld,
      conduct,
      isFirstLogin
    };
  } catch (error) {
    const isUnknownColumn = error?.code === 'ER_BAD_FIELD_ERROR';
    if (!isUnknownColumn) {
      throw error;
    }

    const missingColumn = getUnknownColumnName(error);
    if (missingColumn && missingColumn !== 'phone_number') {
      throw new Error(buildSchemaErrorMessage(missingColumn));
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO students
        (name, email, password_hash, enrollment_number, enrollment_year, graduation_year, position_held, conduct, status, is_first_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          email,
          passwordHash,
          enrollmentNumber,
          enrollmentYear,
          graduationYear,
          positionHeld,
          conduct,
          'active',
          isFirstLogin
        ]
      );

      return {
        id: result.insertId,
        name,
        email,
        contactNumber,
        enrollmentNumber,
        enrollmentYear,
        graduationYear,
        positionHeld,
        conduct,
        isFirstLogin
      };
    } catch (fallbackError) {
      if (fallbackError?.code === 'ER_BAD_FIELD_ERROR') {
        throw new Error(buildSchemaErrorMessage(getUnknownColumnName(fallbackError)));
      }
      throw fallbackError;
    }
  }
}

async function restoreStudent(id, {
  name,
  email,
  passwordHash,
  contactNumber = null,
  enrollmentNumber,
  enrollmentYear = null,
  graduationYear = null,
  positionHeld = null,
  conduct = null,
  isFirstLogin = true
}) {
  const [result] = await pool.execute(
    `UPDATE students
     SET name = ?,
         email = ?,
         phone_number = ?,
         password_hash = ?,
         enrollment_number = ?,
         enrollment_year = ?,
         graduation_year = ?,
         position_held = ?,
         conduct = ?,
         status = 'active',
         is_first_login = ?,
         is_deleted = 0,
         deleted_at = NULL
     WHERE id = ?`,
    [
      name,
      email,
      contactNumber,
      passwordHash,
      enrollmentNumber,
      enrollmentYear,
      graduationYear,
      positionHeld,
      conduct,
      isFirstLogin,
      id
    ]
  );

  return {
    id,
    name,
    email,
    contactNumber,
    enrollmentNumber,
    enrollmentYear,
    graduationYear,
    positionHeld,
    conduct,
    isFirstLogin,
    affectedRows: result.affectedRows
  };
}

async function getAllUsers() {
  const [rows] = await pool.execute('SELECT id, name, email, role FROM admin');
  return rows;
}

async function getAllStudents() {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, phone_number, enrollment_number, enrollment_year, graduation_year, position_held, conduct, status, created_at
       FROM students
       WHERE COALESCE(is_deleted, 0) = 0`
    );
    return rows;
  } catch (error) {
    if (error?.code !== 'ER_BAD_FIELD_ERROR') {
      throw error;
    }

    const missingColumn = getUnknownColumnName(error);
    if (missingColumn && missingColumn !== 'phone_number') {
      throw new Error(buildSchemaErrorMessage(missingColumn));
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, enrollment_number, enrollment_year, graduation_year, position_held, conduct, status, created_at
       FROM students
       WHERE COALESCE(is_deleted, 0) = 0`
    );
    return rows;
  }
}

async function getCertificatesByStudentId(studentId) {
  try {
    // First try to get certificates by student_id
    const [rows] = await pool.execute(
      `SELECT c.id,
              c.enrollment_number,
              COALESCE(s.name, c.student_name) AS student_name,
              c.start_date,
              c.finished_date,
              c.date_issued,
              c.blockchain_status,
              c.verification_code,
              c.exam_type,
              c.pdf_hash
       FROM certificates c
       LEFT JOIN students s ON s.id = c.student_id AND COALESCE(s.is_deleted, 0) = 0
       WHERE c.student_id = ?
         AND COALESCE(c.is_deleted, 0) = 0`,
      [studentId]
    );
    if (rows && rows.length > 0) {
      return rows;
    }
    
    // If no results, try getting student's enrollment_number and query by that
    const [students] = await pool.execute('SELECT enrollment_number FROM students WHERE id = ?', [studentId]);
    if (students && students.length > 0 && students[0].enrollment_number) {
      const [certRows] = await pool.execute(
        `SELECT c.id,
                c.enrollment_number,
                COALESCE(s.name, c.student_name) AS student_name,
                c.start_date,
                c.finished_date,
                c.date_issued,
                c.blockchain_status,
                c.verification_code,
                c.exam_type,
                c.pdf_hash
         FROM certificates c
         LEFT JOIN students s ON s.id = c.student_id AND COALESCE(s.is_deleted, 0) = 0
         WHERE c.enrollment_number = ?
           AND COALESCE(c.is_deleted, 0) = 0`,
        [students[0].enrollment_number]
      );
      return certRows;
    }
    return [];
  } catch (err) {
    console.error('Error getting certificates:', err);
    return [];
  }
}

async function findCertificateByHashOrTx({ certHash, txHash }) {
  if (certHash) {
    const [rows] = await pool.execute(
      `SELECT c.*, 
              s.name AS current_student_name,
              s.enrollment_number AS current_enrollment_number,
              s.enrollment_year AS current_enrollment_year,
              s.graduation_year AS current_graduation_year
       FROM certificates c
       LEFT JOIN students s ON s.id = c.student_id AND COALESCE(s.is_deleted, 0) = 0
       WHERE c.pdf_hash = ?
         AND COALESCE(c.is_deleted, 0) = 0`,
      [certHash]
    );
    if (rows && rows.length > 0) return rows[0];

    // Fallback to archived certificates
    const [archRows] = await pool.execute(
      `SELECT a.*, 
              s.name AS current_student_name,
              s.enrollment_number AS current_enrollment_number,
              s.enrollment_year AS current_enrollment_year,
              s.graduation_year AS current_graduation_year
       FROM archived_certificates a
       LEFT JOIN students s ON s.id = a.student_id AND COALESCE(s.is_deleted, 0) = 0
       WHERE a.pdf_hash = ?
         AND COALESCE(a.is_deleted, 0) = 0`,
      [certHash]
    );
    if (archRows && archRows.length > 0) {
      archRows[0].is_archived = 1;
      return archRows[0];
    }
    return null;
  }
  if (txHash) {
    const [rows] = await pool.execute(
      `SELECT c.*, 
              s.name AS current_student_name,
              s.enrollment_number AS current_enrollment_number,
              s.enrollment_year AS current_enrollment_year,
              s.graduation_year AS current_graduation_year
       FROM certificates c
       LEFT JOIN students s ON s.id = c.student_id AND COALESCE(s.is_deleted, 0) = 0
       WHERE c.blockchain_tx_hash = ?
         AND COALESCE(c.is_deleted, 0) = 0`,
      [txHash]
    );
    if (rows && rows.length > 0) return rows[0];

    const [archRows] = await pool.execute(
      `SELECT a.*, 
              s.name AS current_student_name,
              s.enrollment_number AS current_enrollment_number,
              s.enrollment_year AS current_enrollment_year,
              s.graduation_year AS current_graduation_year
       FROM archived_certificates a
       LEFT JOIN students s ON s.id = a.student_id AND COALESCE(s.is_deleted, 0) = 0
       WHERE a.blockchain_tx_hash = ?
         AND COALESCE(a.is_deleted, 0) = 0`,
      [txHash]
    );
    if (archRows && archRows.length > 0) {
      archRows[0].is_archived = 1;
      return archRows[0];
    }
    return null;
  }
  return null;
}

async function findCertificateByVerificationCode(code) {
  const [rows] = await pool.execute(
    `SELECT c.*, 
            s.name AS current_student_name,
            s.enrollment_number AS current_enrollment_number,
            s.enrollment_year AS current_enrollment_year,
            s.graduation_year AS current_graduation_year
     FROM certificates c
     LEFT JOIN students s ON s.id = c.student_id AND COALESCE(s.is_deleted, 0) = 0
     WHERE c.verification_code = ?
       AND COALESCE(c.is_deleted, 0) = 0`,
    [code]
  );
  if (rows && rows.length > 0) return rows[0];

  // fallback to archived
  const [archRows] = await pool.execute(
    `SELECT a.*, 
            s.name AS current_student_name,
            s.enrollment_number AS current_enrollment_number,
            s.enrollment_year AS current_enrollment_year,
            s.graduation_year AS current_graduation_year
     FROM archived_certificates a
     LEFT JOIN students s ON s.id = a.student_id AND COALESCE(s.is_deleted, 0) = 0
     WHERE a.verification_code = ?
       AND COALESCE(a.is_deleted, 0) = 0`,
    [code]
  );
  if (archRows && archRows.length > 0) {
    archRows[0].is_archived = 1;
    return archRows[0];
  }
  return null;
}

async function findCertificateForPublicVerify(identifier) {
  const normalized = String(identifier || '').trim();
  if (!normalized) return null;

  const normalizeText = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');

  const normalizedInput = normalizeText(normalized);
  const likeInput = `%${normalized}%`;

  const [rows] = await pool.execute(
    `SELECT c.*, 
            s.name AS current_student_name,
            s.enrollment_number AS current_enrollment_number,
            s.enrollment_year AS current_enrollment_year,
            s.graduation_year AS current_graduation_year
     FROM certificates c
     LEFT JOIN students s ON s.id = c.student_id AND COALESCE(s.is_deleted, 0) = 0
     WHERE COALESCE(c.is_deleted, 0) = 0
       AND (
         c.verification_code = ?
         OR c.enrollment_number = ?
         OR s.enrollment_number = ?
         OR c.student_name LIKE ?
         OR s.name LIKE ?
       )
     ORDER BY c.id DESC
     LIMIT 25`,
    [normalized, normalized, normalized, likeInput, likeInput]
  );

  if (!rows || rows.length === 0) return null;

  const exactMatch = rows.find((row) => {
    const codeMatch = normalizeText(row.verification_code) === normalizedInput;
    const certEnrollmentMatch = normalizeText(row.enrollment_number) === normalizedInput;
    const currentEnrollmentMatch = normalizeText(row.current_enrollment_number) === normalizedInput;
    const certNameMatch = normalizeText(row.student_name) === normalizedInput;
    const currentNameMatch = normalizeText(row.current_student_name) === normalizedInput;

    return codeMatch || certEnrollmentMatch || currentEnrollmentMatch || certNameMatch || currentNameMatch;
  });

  return exactMatch || rows[0];
}

// If not found in active certificates, attempt archived table
async function findCertificateForPublicVerifyWithArchive(identifier) {
  const normalized = String(identifier || '').trim();
  if (!normalized) return null;
  const normalizeText = (value) =>
    String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedInput = normalizeText(normalized);
  const likeInput = `%${normalized}%`;

  const [rows] = await pool.execute(
    `SELECT a.*, 
            s.name AS current_student_name,
            s.enrollment_number AS current_enrollment_number,
            s.enrollment_year AS current_enrollment_year,
            s.graduation_year AS current_graduation_year
     FROM archived_certificates a
     LEFT JOIN students s ON s.id = a.student_id AND COALESCE(s.is_deleted, 0) = 0
     WHERE COALESCE(a.is_deleted, 0) = 0
       AND (
         a.verification_code = ?
         OR a.enrollment_number = ?
         OR s.enrollment_number = ?
         OR a.student_name LIKE ?
         OR s.name LIKE ?
       )
     ORDER BY a.archived_at DESC
     LIMIT 25`,
    [normalized, normalized, normalized, likeInput, likeInput]
  );

  if (!rows || rows.length === 0) return null;

  const exactMatch = rows.find((row) => {
    const codeMatch = normalizeText(row.verification_code) === normalizedInput;
    const certEnrollmentMatch = normalizeText(row.enrollment_number) === normalizedInput;
    const currentEnrollmentMatch = normalizeText(row.current_enrollment_number) === normalizedInput;
    const certNameMatch = normalizeText(row.student_name) === normalizedInput;
    const currentNameMatch = normalizeText(row.current_student_name) === normalizedInput;

    return codeMatch || certEnrollmentMatch || currentEnrollmentMatch || certNameMatch || currentNameMatch;
  });

  const result = exactMatch || rows[0];
  if (result) result.is_archived = 1;
  return result;
}

async function getCertificateById(id, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT c.id,
            c.student_id,
            c.enrollment_number,
            c.student_name,
            c.start_date,
            c.finished_date,
            c.exam_type,
            c.position_held,
            c.conduct,
            c.date_issued,
            c.verification_code,
            c.status,
            c.is_deleted,
            s.name AS current_student_name,
            s.enrollment_number AS current_enrollment_number,
            s.enrollment_year AS current_enrollment_year,
            s.graduation_year AS current_graduation_year
     FROM certificates c
     LEFT JOIN students s ON s.id = c.student_id AND COALESCE(s.is_deleted, 0) = 0
               WHERE c.id = ?
     LIMIT 1`,
    [id]
  );
  if (rows && rows.length > 0) return rows[0];

  // fallback to archived certificates (match by original_certificate_id or archived row id)
  const [archRows] = await executor.execute(
    `SELECT a.id, a.original_certificate_id, a.student_id, a.enrollment_number, a.student_name, a.start_date, a.finished_date, a.exam_type, a.position_held, a.conduct, a.date_issued, a.verification_code, a.status, a.is_deleted,
            s.name AS current_student_name,
            s.enrollment_number AS current_enrollment_number,
            s.enrollment_year AS current_enrollment_year,
            s.graduation_year AS current_graduation_year
     FROM archived_certificates a
     LEFT JOIN students s ON s.id = a.student_id AND COALESCE(s.is_deleted, 0) = 0
     WHERE (a.original_certificate_id = ? OR a.id = ?)
     LIMIT 1`,
    [id, id]
  );
  if (archRows && archRows.length > 0) {
    archRows[0].is_archived = 1;
    return archRows[0];
  }
  return null;
}

async function recalculateStudentStatusFromCertificates({ studentId, enrollmentNumber }, executor = pool) {
  let resolvedStudentId = studentId || null;

  if (!resolvedStudentId && enrollmentNumber) {
    const [studentRows] = await executor.execute(
      `SELECT id
       FROM students
       WHERE enrollment_number = ?
         AND COALESCE(is_deleted, 0) = 0
       LIMIT 1`,
      [enrollmentNumber]
    );
    resolvedStudentId = studentRows?.[0]?.id || null;
  }

  if (!resolvedStudentId) {
    return 0;
  }

  const [issuedRows] = await executor.execute(
    `SELECT COUNT(*) AS issuedCount
     FROM certificates
     WHERE student_id = ?
       AND status = 'issued'
       AND COALESCE(is_deleted, 0) = 0`,
    [resolvedStudentId]
  );

  const issuedCount = Number(issuedRows?.[0]?.issuedCount || 0);
  const nextStatus = issuedCount > 0 ? 'graduated' : 'active';

  const [updateResult] = await executor.execute(
    `UPDATE students
     SET status = ?
     WHERE id = ?
       AND COALESCE(is_deleted, 0) = 0`,
    [nextStatus, resolvedStudentId]
  );

  return updateResult.affectedRows || 0;
}

async function getAllCertificates() {
  const [rows] = await pool.execute(
    `SELECT c.id,
            COALESCE(s.enrollment_number, c.enrollment_number) AS enrollment_number,
            c.student_name,
            s.email AS student_email,
          c.created_at,
            c.start_date,
            c.finished_date,
            c.date_issued,
            c.status,
            c.blockchain_status,
            c.exam_type,
            c.position_held,
            c.conduct,
            c.issuer_wallet,
            c.verification_code,
            c.pdf_hash,
            c.blockchain_tx_hash
     FROM certificates c
     LEFT JOIN students s ON s.id = c.student_id
     WHERE COALESCE(c.is_deleted, 0) = 0
     ORDER BY c.id DESC`
  );
  return rows;
}

async function createCertificate({
  studentId,
  enrollmentNumber,
  studentName,
  startDate,
  finishedDate,
  examType,
  positionHeld,
  conduct,
  issuerWallet
}, executor = pool) {
  const normalizedExamType = String(examType || '').trim().toUpperCase();

  const [existingRows] = await executor.execute(
    `SELECT id
     FROM certificates
     WHERE status = 'issued'
       AND exam_type = ?
       AND (student_id = ? OR enrollment_number = ?)
     ORDER BY id DESC
     LIMIT 1`,
    [normalizedExamType, studentId || null, enrollmentNumber]
  );

  if (existingRows && existingRows.length > 0) {
    const duplicateError = new Error(
      `This student already has an issued ${normalizedExamType} certificate (ID: ${existingRows[0].id}). Re-issuing is not allowed.`
    );
    duplicateError.statusCode = 409;
    throw duplicateError;
  }

  const verificationCode = crypto.randomBytes(16).toString('hex');  
  const dateIssued = new Date().toISOString().split('T')[0];
  const status = 'issued';
  const blockchainStatus = 'issued';

  const [result] = await executor.execute(
    `INSERT INTO certificates 
    (student_id, enrollment_number, student_name, start_date, finished_date, 
     date_issued, issuer_wallet, verification_code, status, blockchain_status, exam_type, position_held, conduct)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId || null,
      enrollmentNumber,
      studentName,
      startDate,
      finishedDate,
      dateIssued,
      issuerWallet || null,
      verificationCode,
      status,
      blockchainStatus,
      normalizedExamType,
      positionHeld,
      conduct
    ]
  );

  return {
    id: result.insertId,
    enrollmentNumber,
    studentName,
    verificationCode,
    dateIssued
  };
}

async function updateCertificateArtifacts(id, { pdfHash, blockchainTxHash, blockchainStatus, issuerWallet }, executor = pool) {
  const fields = [];
  const params = [];

  if (pdfHash !== undefined) {
    fields.push('pdf_hash = ?');
    params.push(pdfHash || null);
  }

  if (blockchainTxHash !== undefined) {
    fields.push('blockchain_tx_hash = ?');
    params.push(blockchainTxHash || null);
  }

  if (blockchainStatus !== undefined) {
    fields.push('blockchain_status = ?');
    params.push(blockchainStatus || null);
  }

  if (issuerWallet !== undefined) {
    fields.push('issuer_wallet = ?');
    params.push(issuerWallet || null);
  }

  if (fields.length === 0) {
    throw new Error('No artifact fields provided');
  }

  params.push(id);

  const [result] = await executor.execute(
    `UPDATE certificates SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  return result.affectedRows;
}

async function deleteCertificate(id) {
  const [result] = await pool.execute(
    'UPDATE certificates SET is_deleted = 1, status = ?, blockchain_status = ? WHERE id = ? AND COALESCE(is_deleted, 0) = 0',
    ['deleted', 'deleted', id]
  );
  return result.affectedRows;
}

async function restoreCertificateFromArchive(archiveId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT * FROM archived_certificates WHERE id = ? LIMIT 1',
      [archiveId]
    );
    if (!rows || rows.length === 0) {
      await connection.rollback();
      return { affectedRows: 0, message: 'Archive row not found' };
    }
    const a = rows[0];

    // Check conflicts: verification_code and enrollment_number
    if (a.verification_code) {
      const [conf] = await connection.execute('SELECT id FROM certificates WHERE verification_code = ? LIMIT 1', [a.verification_code]);
      if (conf && conf.length > 0) {
        await connection.rollback();
        return { affectedRows: 0, message: 'Conflict: verification_code exists in active certificates' };
      }
    }
    if (a.enrollment_number) {
      const [conf2] = await connection.execute('SELECT id FROM certificates WHERE enrollment_number = ? LIMIT 1', [a.enrollment_number]);
      if (conf2 && conf2.length > 0) {
        // It's acceptable for multiple certificates to have same enrollment_number (different exams), so skip strict conflict here.
      }
    }

    const [insertResult] = await connection.execute(
      `INSERT INTO certificates (student_id, enrollment_number, student_name, start_date, finished_date, date_issued, pdf_hash, blockchain_tx_hash, status, blockchain_status, issuer_wallet, verification_code, exam_type, position_held, conduct, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.student_id || null,
        a.enrollment_number || null,
        a.student_name || null,
        a.start_date || null,
        a.finished_date || null,
        a.date_issued || null,
        a.pdf_hash || null,
        a.blockchain_tx_hash || null,
        a.status || 'issued',
        a.blockchain_status || null,
        a.issuer_wallet || null,
        a.verification_code || null,
        a.exam_type || null,
        a.position_held || null,
        a.conduct || null,
        a.is_deleted || 0,
        a.created_at || null,
        a.updated_at || null
      ]
    );

    // Optionally remove from archive (we'll delete the archived row to avoid duplicates)
    await connection.execute('DELETE FROM archived_certificates WHERE id = ?', [archiveId]);

    await connection.commit();
    return { affectedRows: insertResult.affectedRows, insertedId: insertResult.insertId };
  } catch (err) {
    await connection.rollback();
    console.error('Error restoring archived certificate:', err);
    throw err;
  } finally {
    connection.release();
  }
}

async function revokeCertificate(id) {
  const [result] = await pool.execute(
    'UPDATE certificates SET status = ?, blockchain_status = ? WHERE id = ?',
    ['revoked', 'revoked', id]
  );
  return result.affectedRows;
}

async function deleteStudent(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    let deleted = false;

    const [studentRows] = await connection.execute(
      'SELECT enrollment_number, name FROM students WHERE id = ? AND COALESCE(is_deleted, 0) = 0',
      [id]
    );
    if (studentRows && studentRows.length > 0) {
      const enrollmentNumber = studentRows[0].enrollment_number;
      const studentName = studentRows[0].name;

      if (enrollmentNumber) {
        await connection.execute(
          "UPDATE certificates SET is_deleted = 1, status = 'deleted', blockchain_status = 'deleted' WHERE enrollment_number = ? AND COALESCE(is_deleted, 0) = 0",
          [enrollmentNumber]
        );
      }
      if (studentName) {
        await connection.execute(
          "UPDATE certificates SET is_deleted = 1, status = 'deleted', blockchain_status = 'deleted' WHERE student_name = ? AND COALESCE(is_deleted, 0) = 0",
          [studentName]
        );
      }

      const [result] = await connection.execute(
        "UPDATE students SET is_deleted = 1, status = 'inactive' WHERE id = ? AND COALESCE(is_deleted, 0) = 0",
        [id]
      );
      if (result.affectedRows > 0) deleted = true;
    }

    await connection.commit();
    return deleted ? 1 : 0;
  } catch (err) {
    await connection.rollback();
    console.error('Error deleting student:', err);
    throw err;
  } finally {
    connection.release();
  }
}

async function updateStudent(id, {
  name,
  email,
  enrollment_number,
  enrollment_year,
  graduation_year,
  position_held,
  conduct,
  status,
  is_first_login
}) {
  try {
    // Try updating students table first
    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }

    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email);
    }

    if (enrollment_number !== undefined) {
      fields.push('enrollment_number = ?');
      params.push(enrollment_number);
    }

    if (enrollment_year !== undefined) {
      fields.push('enrollment_year = ?');
      params.push(enrollment_year || null);
    }

    if (graduation_year !== undefined) {
      fields.push('graduation_year = ?');
      params.push(graduation_year || null);
    }

    if (position_held !== undefined) {
      fields.push('position_held = ?');
      params.push(position_held || null);
    }

    if (conduct !== undefined) {
      fields.push('conduct = ?');
      params.push(conduct || null);
    }

    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status);
    }

    if (is_first_login !== undefined) {
      fields.push('is_first_login = ?');
      params.push(is_first_login);
    }

    if (fields.length === 0) {
      return 0;
    }

    params.push(id);

    const [result] = await pool.execute(
      `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows > 0) {
      if (name !== undefined) {
        await pool.execute(
          `UPDATE certificates
           SET student_name = ?
           WHERE student_id = ?
             AND COALESCE(is_deleted, 0) = 0`,
          [name || null, id]
        );
      }

      if (enrollment_number !== undefined) {
        await pool.execute(
          `UPDATE certificates
           SET enrollment_number = ?
           WHERE student_id = ?
             AND COALESCE(is_deleted, 0) = 0`,
          [enrollment_number || null, id]
        );
      }
      return result.affectedRows;
    }
  } catch (err) {
    if (err?.code === 'ER_BAD_FIELD_ERROR') {
      throw new Error(buildSchemaErrorMessage(getUnknownColumnName(err)));
    }
    console.log('Students table update failed, trying users table:', err.message);
  }

  // Fall back to users table
  try {
    const [result] = await pool.execute(
      'UPDATE students SET name = ?, email = ? WHERE id = ?',
      [name, email, id]
    );
    return result.affectedRows;
  } catch (err) {
    console.error('Error updating student:', err);
    throw err;
  }
}

module.exports = {
  findUserByEmail,
  findStudentByEmail,
  findStudentByEmailIncludingDeleted,
  findStudentByEnrollmentNumber,
  findStudentByEnrollmentNumberIncludingDeleted,
  createUser,
  createStudent,
  restoreStudent,
  getAllUsers,
  getAllStudents,
  getCertificatesByStudentId,
  findCertificateByHashOrTx,
  getAllCertificates,
  getCertificateById,
  createCertificate,
  updateCertificateArtifacts,
  recalculateStudentStatusFromCertificates,
  findCertificateByVerificationCode,
  findCertificateForPublicVerify,
  deleteCertificate,
  revokeCertificate,
  deleteStudent,
  updateStudent
};
