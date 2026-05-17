require('dotenv').config();
const { getStudentLogs } = require('../services/auditService');

(async () => {
  try {
    console.log('Running local check: getStudentLogs');
    const rows = await getStudentLogs({ limit: 10, offset: 0 });
    console.log('Success: returned rows count =', rows.length);
    console.log(rows.slice(0,10));
    process.exit(0);
  } catch (err) {
    console.error('Error in getStudentLogs:', err);
    if (err && err.stack) console.error(err.stack);
    process.exit(2);
  }
})();
