const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const pool = require('./config/db');

// Load env variables from .env file in server directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const verifierRoutes = require('./routes/verifierRoutes');
const contactRoutes = require('./routes/contactRoutes');
const verifyRoutes = require('./routes/verifyRoutes');

async function reconcilePendingBlockchainCertificates() {
  try {
    const { registerOnChain, verifyOnChain, checkBlockchainConnection } = require('./services/blockchainService');

    const connectionCheck = await checkBlockchainConnection();
    if (!connectionCheck.ok) {
      console.warn(`[Blockchain Reconcile] Skipped: ${connectionCheck.error}`);
      return;
    }

    const [pendingCertificates] = await pool.execute(
      `SELECT id, enrollment_number, pdf_hash, blockchain_status, blockchain_tx_hash
       FROM certificates
       WHERE status = 'issued'
         AND COALESCE(is_deleted, 0) = 0
         AND pdf_hash IS NOT NULL
         AND pdf_hash <> ''
         AND (blockchain_status IS NULL OR blockchain_status = '' OR blockchain_status = 'pending' OR blockchain_status = 'issued')
       ORDER BY id ASC`
    );

    if (!pendingCertificates || pendingCertificates.length === 0) {
      console.log('[Blockchain Reconcile] No pending certificates found.');
      return;
    }

    console.log(`[Blockchain Reconcile] Found ${pendingCertificates.length} certificate(s) to reconcile.`);

    for (const certificate of pendingCertificates) {
      try {
        const verify = await verifyOnChain({ pdfHashHex: certificate.pdf_hash });
        if (verify?.registered) {
          await pool.execute(
            `UPDATE certificates
             SET blockchain_status = 'onchain'
             WHERE id = ?`,
            [certificate.id]
          );
          console.log(`[Blockchain Reconcile] Certificate ${certificate.id} already on-chain. Status updated.`);
          continue;
        }

        const onChain = await registerOnChain({
          pdfHashHex: certificate.pdf_hash,
          enrollmentNumber: certificate.enrollment_number
        });

        const chainStatus = onChain.status === 1 ? 'onchain' : 'pending';

        await pool.execute(
          `UPDATE certificates
           SET blockchain_tx_hash = ?,
               blockchain_status = ?
           WHERE id = ?`,
          [onChain.txHash || null, chainStatus, certificate.id]
        );

        console.log(`[Blockchain Reconcile] Certificate ${certificate.id} processed. Status: ${chainStatus}.`);
      } catch (itemError) {
        console.warn(`[Blockchain Reconcile] Certificate ${certificate.id} retry failed:`, itemError.message);
      }
    }
  } catch (error) {
    console.warn('[Blockchain Reconcile] Startup reconciliation skipped:', error.message);
  }
}

const app = express();
const port = process.env.PORT || 5000;

async function ensureBlockchainStatusSchema() {
  try {
    await pool.execute(
      "ALTER TABLE certificates MODIFY COLUMN blockchain_status VARCHAR(50) NULL DEFAULT 'pending'"
    );

    await pool.execute(
      `UPDATE certificates
       SET blockchain_status = 'onchain'
       WHERE blockchain_tx_hash IS NOT NULL
         AND blockchain_tx_hash <> ''
         AND (blockchain_status IS NULL OR blockchain_status = '' OR blockchain_status = 'issued')`
    );

    console.log('Blockchain status schema check complete');
  } catch (error) {
    console.warn('Blockchain status schema check skipped:', error.message);
  }
}

async function ensureAdminSecuritySchema() {
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 's7afiu7aroon@gmail.com';

  try {
    await pool.execute("ALTER TABLE admin ADD COLUMN is_first_login BOOLEAN DEFAULT FALSE");
  } catch (error) {
    if (!String(error.message || '').toLowerCase().includes('duplicate column')) {
      console.warn('Admin schema update skipped (is_first_login):', error.message);
    }
  }

  try {
    await pool.execute("ALTER TABLE admin ADD COLUMN created_by INT NULL");
  } catch (error) {
    if (!String(error.message || '').toLowerCase().includes('duplicate column')) {
      console.warn('Admin schema update skipped (created_by):', error.message);
    }
  }

  try {
    await pool.execute("ALTER TABLE admin ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
  } catch (error) {
    if (!String(error.message || '').toLowerCase().includes('duplicate column')) {
      console.warn('Admin schema update skipped (status):', error.message);
    }
  }

  try {
    await pool.execute("UPDATE admin SET status = 'active' WHERE status IS NULL OR status = ''");
  } catch (error) {
    console.warn('Admin status backfill skipped:', error.message);
  }

  try {
    await pool.execute(
      'UPDATE admin SET role = ? WHERE LOWER(email) = LOWER(?)',
      ['super-admin', superAdminEmail]
    );
    console.log(`Super-admin role ensured for: ${superAdminEmail}`);
  } catch (error) {
    console.warn('Super-admin role update skipped:', error.message);
  }
}

async function ensureDedicatedLogSchemas() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS student_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        login DATETIME NULL,
        logout DATETIME NULL,
        INDEX idx_student_log_email (email),
        INDEX idx_student_log_login (login),
        INDEX idx_student_log_logout (logout)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        login DATETIME NULL,
        logout DATETIME NULL,
        INDEX idx_admin_log_email (email),
        INDEX idx_admin_log_login (login),
        INDEX idx_admin_log_logout (logout)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute('DROP TABLE IF EXISTS certificate_log');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS certificate_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        userid INT NULL,
        userrole VARCHAR(50) NULL,
        email VARCHAR(255) NULL,
        action VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_certificate_log_user (userid, userrole),
        INDEX idx_certificate_log_email (email),
        INDEX idx_certificate_log_action (action),
        INDEX idx_certificate_log_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute('DROP TABLE IF EXISTS audit_logs');
  } catch (error) {
    console.warn('Dedicated log schema check skipped:', error.message);
  }
}

async function ensureSoftDeleteSchema() {
  try {
    await pool.execute('ALTER TABLE students ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0');
  } catch (error) {
    if (!String(error.message || '').toLowerCase().includes('duplicate column')) {
      console.warn('Students soft-delete schema update skipped:', error.message);
    }
  }

  try {
    await pool.execute('ALTER TABLE certificates ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0');
  } catch (error) {
    if (!String(error.message || '').toLowerCase().includes('duplicate column')) {
      console.warn('Certificates soft-delete schema update skipped:', error.message);
    }
  }

  try {
    await pool.execute('UPDATE students SET is_deleted = 0 WHERE is_deleted IS NULL');
    await pool.execute('UPDATE certificates SET is_deleted = 0 WHERE is_deleted IS NULL');
  } catch (error) {
    console.warn('Soft-delete backfill skipped:', error.message);
  }
}

async function ensureVerificationAnalyticsSchema() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS visitor_tracking (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        visitor_key VARCHAR(64) NOT NULL,
        ip_address VARCHAR(64) NULL,
        user_agent VARCHAR(1000) NULL,
        visited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_visitor_tracking_visited_at (visited_at),
        INDEX idx_visitor_tracking_visitor_key (visitor_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS verification_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        visitor_key VARCHAR(64) NULL,
        query_mode VARCHAR(20) NOT NULL,
        query_input VARCHAR(255) NULL,
        certificate_id INT NULL,
        serial_number VARCHAR(255) NULL,
        result_status VARCHAR(30) NOT NULL,
        is_valid TINYINT(1) NOT NULL DEFAULT 0,
        http_status INT NOT NULL DEFAULT 200,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_verification_logs_created_at (created_at),
        INDEX idx_verification_logs_result_status (result_status),
        INDEX idx_verification_logs_serial_number (serial_number),
        INDEX idx_verification_logs_mode (query_mode)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (error) {
    console.warn('Verification analytics schema check skipped:', error.message);
  }
}

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// Serve public assets like generated certificates
app.use('/public', express.static(require('path').join(__dirname, 'public')));

// Use modular routes
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/verifier', verifierRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/verify', verifyRoutes);

// --- Check server ---
app.get("/", (req, res) => {
  res.send("Backend server running!");
});

Promise.allSettled([
  ensureBlockchainStatusSchema(),
  ensureAdminSecuritySchema(),
  ensureDedicatedLogSchemas(),
  ensureSoftDeleteSchema(),
  ensureVerificationAnalyticsSchema(),
]).finally(() => {
  reconcilePendingBlockchainCertificates();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});
