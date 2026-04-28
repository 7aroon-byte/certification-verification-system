const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'sql212.infinityfree.com',
  user: process.env.DB_USER || 'if0_41754029',
  password: process.env.DB_PASSWORD || 'Abba2308',
  database: process.env.DB_NAME || 'if0_41754029_certificate_system',
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
