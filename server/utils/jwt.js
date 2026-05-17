const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

function parseExpiresInToMs(expiresIn) {
  if (!expiresIn) return 0;
  if (/^\d+$/.test(String(expiresIn))) return parseInt(expiresIn, 10);
  const m = String(expiresIn).match(/^(\d+)([smhd])$/i);
  if (!m) return 0;
  const v = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit === 's') return v * 1000;
  if (unit === 'm') return v * 60 * 1000;
  if (unit === 'h') return v * 60 * 60 * 1000;
  if (unit === 'd') return v * 24 * 60 * 60 * 1000;
  return 0;
}

function signToken(user) {
  const jti = crypto.randomBytes(16).toString('hex');

  const payload = {
    jti,
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    isFirstLogin: !!user.isFirstLogin
  };

  if (user.enrollment_number !== undefined) {
    payload.enrollment_number = user.enrollment_number;
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const expiresMs = parseExpiresInToMs(JWT_EXPIRES_IN);
  const expiresAt = expiresMs > 0 ? Date.now() + expiresMs : null;

  return { token, jti, expiresAt };
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_EXPIRES_IN };
