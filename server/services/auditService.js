const pool = require('../config/db');

async function logAuditEvent({ actorId, actorRole, actorName, actionType, targetType = null, targetId = null, details = null, ipAddress = null, userAgent = null }) {
  const actorEmail = (details && details.email) || actorName || null;

  try {
    if (actionType === 'STUDENT_LOGIN') {
      await pool.execute('INSERT INTO student_log (email, login, logout) VALUES (?, NOW(), NULL)', [actorEmail]);
      return;
    }

    if (actionType === 'STUDENT_LOGOUT') {
      const [result] = await pool.execute(
        `UPDATE student_log
         SET logout = NOW()
         WHERE email = ? AND logout IS NULL
         ORDER BY id DESC
         LIMIT 1`,
        [actorEmail]
      );

      if (!result || result.affectedRows === 0) {
        await pool.execute('INSERT INTO student_log (email, login, logout) VALUES (?, NULL, NOW())', [actorEmail]);
      }
      return;
    }

    if (actionType === 'ADMIN_LOGIN') {
      await pool.execute('INSERT INTO admin_log (email, login, logout) VALUES (?, NOW(), NULL)', [actorEmail]);
      return;
    }

    if (actionType === 'ADMIN_LOGOUT') {
      const [result] = await pool.execute(
        `UPDATE admin_log
         SET logout = NOW()
         WHERE email = ? AND logout IS NULL
         ORDER BY id DESC
         LIMIT 1`,
        [actorEmail]
      );

      if (!result || result.affectedRows === 0) {
        await pool.execute('INSERT INTO admin_log (email, login, logout) VALUES (?, NULL, NOW())', [actorEmail]);
      }
      return;
    }

    if (
      actionType === 'CERTIFICATE_ISSUED' ||
      actionType === 'CERTIFICATE_REVOKED' ||
      actionType === 'CERTIFICATE_DELETED'
    ) {
      await pool.execute(
        `INSERT INTO certificate_log
         (userid, userrole, email, action, status, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          actorId || null,
          actorRole || null,
          actorEmail,
          actionType,
          'success',
        ]
      );
      return;
    }

    console.warn(`[Audit] Unknown action type, log not persisted: ${actionType}`);
  } catch (error) {
    console.error('[Audit] Failed to persist log:', error?.message || error);
  }
}

async function getAuditLogs({ limit = 200, offset = 0, actionType = null }) {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
  const safeOffset = Math.max(parseInt(offset, 10) || 0, 0);

  let query = `
    SELECT *
    FROM (
      SELECT
        id,
        NULL AS actor_id,
        'student' AS actor_role,
        email AS actor_name,
        CASE WHEN logout IS NOT NULL THEN 'STUDENT_LOGOUT' ELSE 'STUDENT_LOGIN' END AS action_type,
        'student' AS target_type,
        NULL AS target_id,
        NULL AS details,
        NULL AS ip_address,
        NULL AS user_agent,
        COALESCE(logout, login) AS created_at,
        'student_log' AS source_table
      FROM student_log
      UNION ALL
      SELECT
        id,
        NULL AS actor_id,
        'admin' AS actor_role,
        email AS actor_name,
        CASE WHEN logout IS NOT NULL THEN 'ADMIN_LOGOUT' ELSE 'ADMIN_LOGIN' END AS action_type,
        'admin' AS target_type,
        NULL AS target_id,
        NULL AS details,
        NULL AS ip_address,
        NULL AS user_agent,
        COALESCE(logout, login) AS created_at,
        'admin_log' AS source_table
      FROM admin_log
      UNION ALL
      SELECT id, userid AS actor_id, userrole AS actor_role, email AS actor_name, action AS action_type, 'certificate' AS target_type, NULL AS target_id, status AS details, NULL AS ip_address, NULL AS user_agent, created_at AS created_at, 'certificate_log' AS source_table
      FROM certificate_log
    ) AS combined_logs
  `;

  const params = [];
  if (actionType) {
    query += ' WHERE action_type = ?';
    params.push(actionType);
  }

  query += ' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?';
  params.push(safeLimit, safeOffset);

  const [rows] = await pool.execute(query, params);

  const data = rows.map((row) => ({
    ...row,
    details: row.details ? (() => {
      try { return JSON.parse(row.details); } catch { return row.details; }
    })() : null,
  }));

  return data;
}

function toSafePagination({ limit = 200, offset = 0 }) {
  return {
    safeLimit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500),
    safeOffset: Math.max(parseInt(offset, 10) || 0, 0),
  };
}

async function getStudentLogs({ limit = 200, offset = 0 }) {
  const { safeLimit, safeOffset } = toSafePagination({ limit, offset });
  const [rows] = await pool.execute(
    `SELECT id, email, login, logout
     FROM student_log
     ORDER BY COALESCE(logout, login) DESC, id DESC
     LIMIT ? OFFSET ?`,
    [safeLimit, safeOffset]
  );
  return rows;
}

async function getAdminLogs({ limit = 200, offset = 0 }) {
  const { safeLimit, safeOffset } = toSafePagination({ limit, offset });
  const [rows] = await pool.execute(
    `SELECT id, email, login, logout
     FROM admin_log
     ORDER BY COALESCE(logout, login) DESC, id DESC
     LIMIT ? OFFSET ?`,
    [safeLimit, safeOffset]
  );
  return rows;
}

async function getCertificateLogs({ limit = 200, offset = 0 }) {
  const { safeLimit, safeOffset } = toSafePagination({ limit, offset });
  const [rows] = await pool.execute(
    `SELECT id, userid, userrole, email, action, status, created_at
     FROM certificate_log
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [safeLimit, safeOffset]
  );
  return rows;
}

module.exports = {
  logAuditEvent,
  getAuditLogs,
  getStudentLogs,
  getAdminLogs,
  getCertificateLogs,
};
