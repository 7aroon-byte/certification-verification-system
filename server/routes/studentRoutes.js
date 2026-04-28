const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.post('/login', studentController.login);
router.post('/forgot-password', studentController.forgotPassword);
router.post('/verify-otp', studentController.verifyOTP);
router.post('/reset-password', studentController.resetPassword);
router.post('/logout', authMiddleware, requireRole('student'), studentController.logout);
router.post('/change-password', authMiddleware, requireRole('student'), studentController.changePassword);
router.get('/certificates', authMiddleware, requireRole('student'), studentController.getMyCertificates);
router.put('/profile', authMiddleware, requireRole('student'), studentController.updateProfile);
router.get('/me', authMiddleware, requireRole('student'), studentController.getMe);

module.exports = router;
