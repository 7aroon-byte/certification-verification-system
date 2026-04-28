const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Missing authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Invalid authorization format' });

  const token = parts[1];
  try {
    const payload = verifyToken(token);

    if (payload && ['admin', 'super-admin'].includes(payload.role)) {
      const [rows] = await pool.execute(
        'SELECT id, name, email, role, is_first_login, status FROM admin WHERE id = ? LIMIT 1',
        [payload.id]
      );

      if (!rows || rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid account' });
      }

      const admin = rows[0];
      if (admin.status === 'suspended') {
        return res.status(403).json({ success: false, message: 'Account suspended. Contact super-admin.' });
      }

      req.user = {
        ...payload,
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isFirstLogin: admin.is_first_login === true || admin.is_first_login === 1,
        status: admin.status
      };

      const isAdminApi = req.originalUrl.startsWith('/api/admin');
      const isAllowedDuringFirstLogin = /^\/api\/admin\/(me|password|logout)(\?|$)/.test(req.originalUrl);

      if (isAdminApi && req.user.isFirstLogin && !isAllowedDuringFirstLogin) {
        return res.status(403).json({
          success: false,
          code: 'FIRST_LOGIN_PASSWORD_RESET_REQUIRED',
          message: 'You must change your default password before accessing other admin modules.'
        });
      }

      return next();
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const userRole = req.user.role;
    const allowedRoles = role === 'admin' ? ['admin', 'super-admin'] : [role];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Forbidden - insufficient role' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
