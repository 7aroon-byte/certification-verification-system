const express = require('express');
const router = express.Router();
// Verifier routes are intentionally disabled: verifier login/page removed.
// Keep endpoints returning 410 via controller stubs.
const verifierController = require('../controllers/verifierController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.post('/login', verifierController.login);
router.post('/verify', authMiddleware, requireRole('verifier'), verifierController.verifyCertificate);

module.exports = router;
