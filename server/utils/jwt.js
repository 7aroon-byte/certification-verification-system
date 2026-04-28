const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret_in_production';
const JWT_EXPIRES_IN = '8h';

function signToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    isFirstLogin: !!user.isFirstLogin
  };

  if (user.enrollment_number !== undefined) {
    payload.enrollment_number = user.enrollment_number;
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
