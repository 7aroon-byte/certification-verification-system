const crypto = require('crypto');
const pool = require('../config/db');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

function toVisitorKey(req) {
  const ip = getClientIp(req) || 'unknown-ip';
  const userAgent = String(req.get('user-agent') || 'unknown-ua');
  return crypto.createHash('sha1').update(`${ip}|${userAgent}`).digest('hex');
}

async function trackVerificationEvent({ req, mode, queryInput = null, certificate = null, verified = false, verdict = null, statusCode = 200 }) {
  try {
    const visitorKey = toVisitorKey(req);
    const ipAddress = getClientIp(req);
    const userAgent = String(req.get('user-agent') || '').slice(0, 1000);

    await pool.execute(
      `INSERT INTO visitor_tracking (visitor_key, ip_address, user_agent, visited_at)
       VALUES (?, ?, ?, NOW())`,
      [visitorKey, ipAddress, userAgent]
    );

    const certificateId = certificate?.id || null;
    const serialNumber = certificate?.verification_code || certificate?.verificationCode || null;

    let normalizedResult = 'invalid';
    if (String(verdict || '').trim()) {
      normalizedResult = String(verdict).trim().toLowerCase();
    } else if (verified) {
      normalizedResult = 'valid';
    } else if (statusCode === 404) {
      normalizedResult = 'not_found';
    }

    await pool.execute(
      `INSERT INTO verification_logs (
         visitor_key,
         query_mode,
         query_input,
         certificate_id,
         serial_number,
         result_status,
         is_valid,
         http_status,
         created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        visitorKey,
        String(mode || 'search').slice(0, 20),
        String(queryInput || '').slice(0, 255),
        certificateId,
        serialNumber,
        String(normalizedResult).slice(0, 30),
        verified ? 1 : 0,
        Number(statusCode) || 200,
      ]
    );
  } catch (error) {
    console.warn('[Analytics] trackVerificationEvent skipped:', error.message);
  }
}

async function getVerificationInsights() {
  const [verificationStatsRows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS verificationsToday,
       SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) AS verificationsMonth,
       SUM(CASE WHEN result_status = 'valid' THEN 1 ELSE 0 END) AS validAttempts,
       SUM(CASE WHEN result_status <> 'valid' THEN 1 ELSE 0 END) AS invalidAttempts
     FROM verification_logs`
  );

  const [visitorStatsRows] = await pool.execute(
    `SELECT
       COUNT(*) AS totalVisitors,
       SUM(CASE WHEN DATE(visited_at) = CURDATE() THEN 1 ELSE 0 END) AS visitorsToday,
       SUM(CASE WHEN YEAR(visited_at) = YEAR(CURDATE()) AND MONTH(visited_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) AS visitorsMonth,
       COUNT(DISTINCT CASE WHEN DATE(visited_at) = CURDATE() THEN visitor_key END) AS uniqueVisitorsToday,
       COUNT(DISTINCT CASE WHEN YEAR(visited_at) = YEAR(CURDATE()) AND MONTH(visited_at) = MONTH(CURDATE()) THEN visitor_key END) AS uniqueVisitorsMonth
     FROM visitor_tracking`
  );

  const [mostVerifiedRows] = await pool.execute(
    `SELECT serial_number, COUNT(*) AS verificationCount
     FROM verification_logs
     WHERE serial_number IS NOT NULL
       AND serial_number <> ''
     GROUP BY serial_number
     ORDER BY verificationCount DESC
     LIMIT 1`
  );

  const verificationStats = verificationStatsRows?.[0] || {};
  const visitorStats = visitorStatsRows?.[0] || {};
  const mostVerified = mostVerifiedRows?.[0] || null;

  return {
    verificationsToday: Number(verificationStats.verificationsToday || 0),
    verificationsMonth: Number(verificationStats.verificationsMonth || 0),
    validAttempts: Number(verificationStats.validAttempts || 0),
    invalidAttempts: Number(verificationStats.invalidAttempts || 0),
    totalVisitors: Number(visitorStats.totalVisitors || 0),
    visitorsToday: Number(visitorStats.visitorsToday || 0),
    visitorsMonth: Number(visitorStats.visitorsMonth || 0),
    uniqueVisitorsToday: Number(visitorStats.uniqueVisitorsToday || 0),
    uniqueVisitorsMonth: Number(visitorStats.uniqueVisitorsMonth || 0),
    mostVerifiedCertificate: mostVerified
      ? {
          serialNumber: mostVerified.serial_number,
          count: Number(mostVerified.verificationCount || 0),
        }
      : null,
  };
}

module.exports = {
  trackVerificationEvent,
  getVerificationInsights,
};
