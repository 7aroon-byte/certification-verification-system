const bcrypt = require('bcrypt');
const pool = require('./config/db');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function resetStudentPasswords() {
  try {
    const newPassword = 'Student123!';
    const passwordHash = await bcrypt.hash(newPassword, 10);

    console.log('Resetting all student passwords...');
    
    // Get all students first
    const [students] = await pool.execute('SELECT id, email, name FROM students');
    
    if (!students || students.length === 0) {
      console.log('No students found in database');
      process.exit(0);
    }

    console.log(`Found ${students.length} student(s)\n`);

    // Update all students
    await pool.execute('UPDATE students SET password_hash = ?', [passwordHash]);
    
    console.log(`✓ Successfully updated all ${students.length} student passwords\n`);
    console.log('Student Accounts:');
    console.log('='.repeat(50));
    
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Password: ${newPassword}`);
      console.log('');
    });

    console.log('='.repeat(50));
    console.log(`\nAll ${students.length} students can now login with password: ${newPassword}`);

    process.exit(0);
  } catch (err) {
    console.error('Error resetting passwords:', err.message);
    process.exit(1);
  }
}

resetStudentPasswords();
