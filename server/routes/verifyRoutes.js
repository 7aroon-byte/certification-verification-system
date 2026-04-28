const express = require('express');
const router = express.Router();
const { publicVerify, publicVerifyByHash } = require('../controllers/verifierController');

// Public verification endpoint: /api/verify?code=...
router.get('/', publicVerify);
router.post('/hash', publicVerifyByHash);

module.exports = router;
