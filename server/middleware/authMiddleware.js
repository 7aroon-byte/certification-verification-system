const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');
const sessionService = require('../services/sessionService');

const SESSION_IDLE_TIMEOUT_MS = parseInt(process.env.SESSION_IDLE_TIMEOUT_MS || String(30 * 60 * 1000), 10); // 30 minutes default

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Missing authorization header' });

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Invalid authorization format' });

  const token = parts[1];
  try {
    const payload = verifyToken(token);

    // Enforce server-side session validation when JWT contains a jti
    if (payload && payload.jti) {
      const session = await sessionService.getSessionByJti(payload.jti);
      if (!session || session.revoked === 1) {
        return res.status(401).json({ success: false, message: 'Session is not active' });
      }

      // Check expiry recorded in sessions table
      if (session.expires_at && new Date(session.expires_at).getTime() <= Date.now()) {
        await sessionService.revokeSession(payload.jti).catch(() => {});
        return res.status(401).json({ success: false, message: 'Session expired' });
      }

      // Check idle timeout
      if (SESSION_IDLE_TIMEOUT_MS > 0 && session.last_activity) {
        const lastActivityMs = new Date(session.last_activity).getTime();
        if (Date.now() - lastActivityMs > SESSION_IDLE_TIMEOUT_MS) {
          await sessionService.revokeSession(payload.jti).catch(() => {});
          return res.status(401).json({ success: false, message: 'Session expired due to inactivity' });
        }
      }

      // Update last_activity to keep session alive
      await sessionService.touchSession(payload.jti).catch(() => {});
    }

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
