const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function upsertAdmin({ name, email, password, role = 'admin' }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [rows] = await pool.execute('SELECT id FROM admin WHERE email = ?', [email]);
  if (rows && rows.length > 0) {
    const id = rows[0].id;
    await pool.execute('UPDATE admin SET name = ?, password_hash = ?, role = ? WHERE id = ?', [name, passwordHash, role, id]);
    console.log(`Updated admin ${email} (id=${id})`);
    return id;
  }
  const [result] = await pool.execute('INSERT INTO admin (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [name, email, passwordHash, role]);
  console.log(`Inserted admin ${email} (id=${result.insertId})`);
  return result.insertId;
}

async function main() {
  const name = process.env.SEED_ADMIN_NAME || 'Miko';
  const email = process.env.SEED_ADMIN_EMAIL || 'miko@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 's7afiu7aroon@gmail.com';
  await upsertAdmin({ name, email, password, role: 'admin' });
  if (superAdminEmail && superAdminEmail.toLowerCase() !== email.toLowerCase()) {
    await upsertAdmin({ name: 'Super Admin', email: superAdminEmail, password, role: 'super-admin' });
  }
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
