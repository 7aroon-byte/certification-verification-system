const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL server');

    const dbName = process.env.DB_NAME || 'certificatesystem';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✓ Database ${dbName} created or already exists`);

    await connection.changeUser({ database: dbName });
    console.log(`✓ Switched to database ${dbName}`);

    const schemaPath = path.join(__dirname, 'sql', 'init_database.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await connection.execute(statement);
      } catch (err) {
        if (!err.message.includes('already exists') && 
            !err.message.includes('Duplicate') &&
            !err.message.includes('key constraint')) {
          console.error('Error executing statement:', statement.substring(0, 50), err.message);
        }
      }
    }
    console.log('✓ Database schema initialized');

    // Seed default admin account
    const adminName = process.env.SEED_ADMIN_NAME || 'Admin';
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 's7afiu7aroon@gmail.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 's7afiu7aroon@gmail.com';
    try {
      await connection.execute("ALTER TABLE admin ADD COLUMN is_first_login BOOLEAN DEFAULT FALSE");
    } catch (err) {
      if (!String(err.message || '').toLowerCase().includes('duplicate column')) {
        console.warn('Schema patch warning (is_first_login):', err.message);
      }
    }

    try {
      await connection.execute("ALTER TABLE admin ADD COLUMN created_by INT NULL");
    } catch (err) {
      if (!String(err.message || '').toLowerCase().includes('duplicate column')) {
        console.warn('Schema patch warning (created_by):', err.message);
      }
    }

    try {
      await connection.execute("ALTER TABLE admin ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
    } catch (err) {
      if (!String(err.message || '').toLowerCase().includes('duplicate column')) {
        console.warn('Schema patch warning (status):', err.message);
      }
    }

    try {
      await connection.execute("UPDATE admin SET status = 'active' WHERE status IS NULL OR status = ''");
    } catch (err) {
      console.warn('Schema patch warning (status backfill):', err.message);
    }

    try {
      await connection.execute("ALTER TABLE students ADD COLUMN enrollment_year VARCHAR(4) NULL");
    } catch (err) {
      if (!String(err.message || '').toLowerCase().includes('duplicate column')) {
        console.warn('Schema patch warning (students.enrollment_year):', err.message);
      }
    }

    try {
      await connection.execute("ALTER TABLE students ADD COLUMN graduation_year VARCHAR(4) NULL");
    } catch (err) {
      if (!String(err.message || '').toLowerCase().includes('duplicate column')) {
        console.warn('Schema patch warning (students.graduation_year):', err.message);
      }
    }

    try {
      await connection.execute("ALTER TABLE students ADD COLUMN position_held VARCHAR(255) NULL");
    } catch (err) {
      if (!String(err.message || '').toLowerCase().includes('duplicate column')) {
        console.warn('Schema patch warning (students.position_held):', err.message);
      }
    }

    try {
      await connection.execute("ALTER TABLE students ADD COLUMN conduct VARCHAR(50) NULL");
    } catch (err) {
      if (!String(err.message || '').toLowerCase().includes('duplicate column')) {
        console.warn('Schema patch warning (students.conduct):', err.message);
      }
    }

    try {
      await connection.execute("ALTER TABLE students ADD COLUMN phone_number VARCHAR(30) NULL");
    } catch (err) {
      if (!String(err.message || '').toLowerCase().includes('duplicate column')) {
        console.warn('Schema patch warning (students.phone_number):', err.message);
      }
    }

    try {
      await connection.execute("ALTER TABLE students MODIFY COLUMN status ENUM('active','inactive','graduated','suspended','deleted') DEFAULT 'active'");
    } catch (err) {
      console.warn('Schema patch warning (students.status enum):', err.message);
    }


    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const [adminRows] = await connection.execute(
      'SELECT id FROM admin WHERE email = ?',
      [adminEmail]
    );

    if (adminRows && adminRows.length > 0) {
      await connection.execute(
        'UPDATE admin SET name = ?, password_hash = ?, role = ? WHERE email = ?',
        [adminName, passwordHash, 'admin', adminEmail]
      );
      console.log(`✓ Admin account updated: ${adminEmail}`);
    } else {
      await connection.execute(
        'INSERT INTO admin (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [adminName, adminEmail, passwordHash, 'admin']
      );
      console.log(`✓ Admin account created: ${adminEmail}`);
    }

    await connection.execute(
      'UPDATE admin SET role = ? WHERE LOWER(email) = LOWER(?)',
      ['super-admin', superAdminEmail]
    );
    console.log(`✓ Super-admin ensured: ${superAdminEmail}`);

    console.log('\n=== Database Setup Complete ===');
    console.log(`Admin Email: ${adminEmail}`);
    console.log(`Admin Password: ${adminPassword}`);
    console.log('\nIMPORTANT: Change the admin password after first login!');

  } catch (err) {
    console.error('✗ Setup error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Connection closed');
    }
  }
}

setupDatabase().then(() => {
  console.log('Setup completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
