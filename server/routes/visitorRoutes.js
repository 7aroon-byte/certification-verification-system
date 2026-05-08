const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Add unique visitor
router.post('/', async (req, res) => {
  const { visitor_key, user_agent, ip_address } = req.body;
  if (!visitor_key) return res.status(400).json({ message: 'visitor_key required' });

  try {
    await pool.execute(
      `INSERT IGNORE INTO visitor_tracking (visitor_key, user_agent, ip_address) VALUES (?, ?, ?)`,
      [visitor_key, user_agent, ip_address]
    );
    res.json({ message: 'Visitor tracked' });
  } catch (err) {
    res.status(500).json({ message: 'DB error', error: err.message });
  }
});

// Get total unique visitors
router.get('/count', async (req, res) => {
  try {
    const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM visitor_tracking`);
    res.json({ total: rows[0].total });
  } catch (err) {
    res.status(500).json({ message: 'DB error', error: err.message });
  }
});

module.exports = router;
