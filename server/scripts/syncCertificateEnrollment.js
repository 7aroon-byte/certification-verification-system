require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [result] = await connection.execute(
    `UPDATE certificates c
     INNER JOIN students s ON s.id = c.student_id
     SET c.enrollment_number = s.enrollment_number
     WHERE COALESCE(c.is_deleted, 0) = 0
       AND COALESCE(s.is_deleted, 0) = 0
       AND COALESCE(c.enrollment_number, '') <> COALESCE(s.enrollment_number, '')`
  );

  console.log('UPDATED_ROWS:', result.affectedRows);

  const [rows] = await connection.execute(
    `SELECT c.id, c.student_name, c.enrollment_number AS cert_enrollment, s.enrollment_number AS student_enrollment
     FROM certificates c
     LEFT JOIN students s ON s.id = c.student_id
     WHERE COALESCE(c.is_deleted, 0) = 0
     ORDER BY c.id DESC
     LIMIT 10`
  );

  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
