const db = require('../config/db');
const userService = require('../services/useService');
const { generateCertificatePDF } = require('../services/pdfService');

async function run() {
  const baseUrl = process.env.PUBLIC_BASE_URL || undefined;

  const [rows] = await db.execute(
    `SELECT c.id,
            c.student_id,
            c.student_name,
            c.enrollment_number,
            c.start_date,
            c.finished_date,
            c.exam_type,
            c.position_held,
            c.conduct,
            c.verification_code,
            s.name AS current_student_name
     FROM certificates c
     LEFT JOIN students s ON s.id = c.student_id AND COALESCE(s.is_deleted, 0) = 0
     WHERE COALESCE(c.is_deleted, 0) = 0
     ORDER BY c.id ASC`
  );

  let updated = 0;

  for (const certificate of rows) {
    const resolvedName = certificate.current_student_name || certificate.student_name;

    if (resolvedName && resolvedName !== certificate.student_name) {
      await db.execute(
        `UPDATE certificates
         SET student_name = ?
         WHERE id = ?`,
        [resolvedName, certificate.id]
      );
    }

    const { hashHex } = await generateCertificatePDF({
      certificateId: certificate.id,
      studentName: resolvedName,
      enrollmentNumber: certificate.enrollment_number,
      startDate: certificate.start_date,
      finishedDate: certificate.finished_date,
      examType: certificate.exam_type,
      positionHeld: certificate.position_held,
      conduct: certificate.conduct,
      verificationCode: certificate.verification_code || `legacy-${certificate.id}`,
      baseUrl
    });

    await userService.updateCertificateArtifacts(certificate.id, {
      pdfHash: hashHex
    });

    updated += 1;
  }

  console.log(JSON.stringify({ total: rows.length, updated }, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
