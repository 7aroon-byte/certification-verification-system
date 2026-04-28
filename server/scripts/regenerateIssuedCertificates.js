const db = require('../config/db');
const { generateCertificatePDF } = require('../services/pdfService');

async function run() {
  const [rows] = await db.execute(
    `SELECT id, student_name, enrollment_number, start_date, finished_date,
            exam_type, position_held, conduct, verification_code
     FROM certificates
     WHERE COALESCE(is_deleted, 0) = 0
     ORDER BY id ASC`
  );

  let updated = 0;
  for (const certificate of rows) {
    await generateCertificatePDF({
      certificateId: certificate.id,
      studentName: certificate.student_name,
      enrollmentNumber: certificate.enrollment_number,
      startDate: certificate.start_date,
      finishedDate: certificate.finished_date,
      examType: certificate.exam_type,
      positionHeld: certificate.position_held,
      conduct: certificate.conduct,
      verificationCode: certificate.verification_code || `legacy-${certificate.id}`,
      baseUrl: process.env.PUBLIC_BASE_URL || undefined
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
