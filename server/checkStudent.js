const pool = require('./config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkStudent() {
  try {
    console.log('Checking student data in database...\n');
    
    const [student] = await pool.execute(
      'SELECT id, name, email, password_hash, enrollment_number, status, is_first_login FROM students WHERE email = ?',
      ['abdullbbj340@gmail.com']
    );

    if (student && student.length > 0) {
      const s = student[0];
      console.log('✓ Student found:');
      console.log(`  ID: ${s.id}`);
      console.log(`  Name: ${s.name}`);
      console.log(`  Email: ${s.email}`);
      console.log(`  Password Hash: ${s.password_hash?.substring(0, 20)}...`);
      console.log(`  Enrollment: ${s.enrollment_number}`);
      console.log(`  Status: ${s.status}`);
      console.log(`  First Login: ${s.is_first_login}`);
      console.log(`  Hash Length: ${s.password_hash?.length}`);
    } else {
      console.log('✗ Student not found');
    }

    // Check all students count
    const [allStudents] = await pool.execute('SELECT COUNT(*) as count FROM students');
    console.log(`\nTotal students in database: ${allStudents[0].count}`);

    const [first5] = await pool.execute('SELECT id, name, email FROM students LIMIT 5');
    console.log('\nFirst 5 students:');
    first5.forEach((s, i) => {
      console.log(`  ${i+1}. ${s.name} (${s.email})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkStudent();
