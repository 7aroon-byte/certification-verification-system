/*
  Archive old certificates into `archived_certificates`.
  - Moves certificates with date_issued older than retentionPeriodYears into archive table.
  - Runs in batches, uses transactions for safety.
  - Intended to be scheduled (cron / systemd timer) or run manually.
*/

require('dotenv').config();
const db = require('../config/db');

const retentionPeriodYears = Number(process.env.CERTIFICATE_RETENTION_YEARS || 5);
const batchSize = Number(process.env.ARCHIVE_BATCH_SIZE || 500);

async function archiveBatch() {
  const cutoff = `DATE_SUB(CURDATE(), INTERVAL ${retentionPeriodYears} YEAR)`;

  // Some MySQL/MariaDB servers do not support binding LIMIT via prepared parameters.
  // Embed batchSize directly into the query as an integer.
  const [rows] = await db.execute(
    `SELECT id
     FROM certificates
     WHERE COALESCE(is_deleted, 0) = 0
       AND date_issued IS NOT NULL
       AND date_issued < ${cutoff}
     ORDER BY id ASC
     LIMIT ${Number(batchSize)}`
  );

  if (!rows || rows.length === 0) {
    return 0;
  }

  let moved = 0;

  for (const r of rows) {
    const id = r.id;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insert into archive (copy columns)
      await connection.execute(
        `INSERT INTO archived_certificates (original_certificate_id, student_id, enrollment_number, student_name, start_date, finished_date, date_issued, status, blockchain_status, exam_type, position_held, conduct, issuer_wallet, verification_code, pdf_hash, blockchain_tx_hash, is_deleted, created_at, updated_at)
         SELECT id, student_id, enrollment_number, student_name, start_date, finished_date, date_issued, status, blockchain_status, exam_type, position_held, conduct, issuer_wallet, verification_code, pdf_hash, blockchain_tx_hash, is_deleted, created_at, updated_at
         FROM certificates
         WHERE id = ? LIMIT 1`,
        [id]
      );

      // Delete from active certificates (or mark deleted if you prefer)
      await connection.execute(
        'DELETE FROM certificates WHERE id = ? LIMIT 1',
        [id]
      );

      await connection.commit();
      moved += 1;
    } catch (err) {
      await connection.rollback();
      console.error('Failed to archive certificate id', id, err.message || err);
    } finally {
      connection.release();
    }
  }

  return moved;
}

async function run() {
  console.log(`Starting archive job. Retention: ${retentionPeriodYears} years. Batch: ${batchSize}`);
  let total = 0;
  while (true) {
    const n = await archiveBatch();
    total += n;
    console.log(`Moved ${n} certificates this batch`);
    if (n === 0) break;
    // Small pause to avoid DB overload
    await new Promise((r) => setTimeout(r, 200));
  }
  console.log(`Archiving complete. Total moved: ${total}`);
}

if (require.main === module) {
  run().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
}

module.exports = { run };
