const pool = require('../config/db');

async function createSession({ jti, userId, role, expiresAt }) {
  try {
    await pool.execute(
      `INSERT INTO sessions (jti, user_id, role, created_at, last_activity, expires_at, revoked)
       VALUES (?, ?, ?, NOW(), NOW(), FROM_UNIXTIME(? / 1000), 0)`,
      [jti, userId, role, expiresAt || null]
    );
    return true;
  } catch (error) {
    console.error('Failed to create session:', error.message || error);
    throw error;
  }
}

async function getSessionByJti(jti) {
  const [rows] = await pool.execute(
    'SELECT id, jti, user_id, role, created_at, last_activity, expires_at, revoked FROM sessions WHERE jti = ? LIMIT 1',
    [jti]
  );
  return rows && rows[0] ? rows[0] : null;
}

async function revokeSession(jti) {
  const [result] = await pool.execute(
    'UPDATE sessions SET revoked = 1 WHERE jti = ?',
    [jti]
  );
  return result.affectedRows > 0;
}

async function touchSession(jti) {
  const [result] = await pool.execute(
    'UPDATE sessions SET last_activity = NOW() WHERE jti = ? AND revoked = 0',
    [jti]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createSession,
  getSessionByJti,
  revokeSession,
  touchSession
};
