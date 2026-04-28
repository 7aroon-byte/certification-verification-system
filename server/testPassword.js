const bcrypt = require('bcrypt');
const pool = require('./config/db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testPassword() {
  try {
    const testPassword = 'Student123!';
    
    const [rows] = await pool.execute(
      'SELECT password_hash FROM students WHERE email = ?',
      ['abdullbbj340@gmail.com']
    );

    if (!rows || rows.length === 0) {
      console.log('Student not found');
      process.exit(1);
    }

    const passwordHash = rows[0].password_hash;
    console.log('Testing password...');
    console.log(`Password to test: "${testPassword}"`);
    console.log(`Hash from DB: ${passwordHash}\n`);

    const match = await bcrypt.compare(testPassword, passwordHash);
    console.log(`bcrypt.compare result: ${match}`);

    if (match) {
      console.log('✓ Password MATCHES!');
    } else {
      console.log('✗ Password does NOT match');
      console.log('\nDebugging info:');
      console.log(`  Password length: ${testPassword.length}`);
      console.log(`  Hash length: ${passwordHash.length}`);
      
      const commonPasswords = [
        'Student123!',
        ' Student123!',
        'Student123! ',
        'student123!',
        'Abdulbbj340',
        'Abdulbbj$$'
      ];
      
      console.log('\nTrying other passwords:');
      for (const pwd of commonPasswords) {
        const m = await bcrypt.compare(pwd, passwordHash);
        console.log(`  "${pwd}": ${m}`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testPassword();
