require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await conn.execute(
    "ALTER TABLE students MODIFY COLUMN status ENUM('active','inactive','graduated','suspended','deleted') DEFAULT 'active'"
  );

  await conn.execute(
    "UPDATE students SET status='active' WHERE (status IS NULL OR status='') AND COALESCE(is_deleted,0)=0"
  );

  await conn.execute(
    "UPDATE students s SET s.status='graduated' WHERE COALESCE(s.is_deleted,0)=0 AND EXISTS (SELECT 1 FROM certificates c WHERE c.student_id=s.id AND COALESCE(c.is_deleted,0)=0 AND c.status='issued')"
  );

  await conn.execute(
    "UPDATE students s SET s.status='active' WHERE COALESCE(s.is_deleted,0)=0 AND s.status='graduated' AND NOT EXISTS (SELECT 1 FROM certificates c WHERE c.student_id=s.id AND COALESCE(c.is_deleted,0)=0 AND c.status='issued')"
  );

  await conn.execute(
    "UPDATE students SET status='inactive' WHERE status='suspended' AND COALESCE(is_deleted,0)=0"
  );

  const [rows] = await conn.execute(
    "SELECT status, COUNT(*) as count FROM students WHERE COALESCE(is_deleted,0)=0 GROUP BY status ORDER BY status"
  );

  console.log(JSON.stringify(rows, null, 2));
  await conn.end();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
