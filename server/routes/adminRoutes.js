const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.post('/login', adminController.login);
router.post('/forgot-password', adminController.forgotPassword);
router.post('/verify-otp', adminController.verifyOTP);
router.post('/reset-password', adminController.resetPassword);
router.post('/check-availability', authMiddleware, requireRole('admin'), adminController.checkStudentAvailability);
router.get('/me', authMiddleware, requireRole('admin'), adminController.getMe);
router.post('/logout', authMiddleware, requireRole('admin'), adminController.logout);
router.post('/students', authMiddleware, requireRole('admin'), adminController.createStudent);
router.get('/users', authMiddleware, requireRole('admin'), adminController.getAllUsers);
router.get('/students', authMiddleware, requireRole('admin'), adminController.getAllUsers);
router.put('/students/:id', authMiddleware, requireRole('admin'), adminController.updateStudent);
router.delete('/students/:id', authMiddleware, requireRole('admin'), adminController.deleteStudent);
router.get('/certificates', authMiddleware, requireRole('admin'), adminController.getCertificates);
router.post('/certificates', authMiddleware, requireRole('admin'), adminController.issueCertificate);
router.post('/certificates/backfill-qr', authMiddleware, requireRole('admin'), adminController.backfillIssuedCertificateQRCodes);
router.patch('/certificates/:id/artifacts', authMiddleware, requireRole('admin'), adminController.updateCertificateArtifacts);
router.patch('/certificates/:id/revoke', authMiddleware, requireRole('admin'), adminController.revokeCertificate);
router.delete('/certificates/:id', authMiddleware, requireRole('admin'), adminController.deleteCertificate);
router.put('/profile', authMiddleware, requireRole('admin'), adminController.updateProfile);
router.put('/password', authMiddleware, requireRole('admin'), adminController.changePassword);

// Admin Management Routes (super-admin only)
router.get('/admins', authMiddleware, requireRole('super-admin'), adminController.getAllAdmins);
router.get('/audit-logs', authMiddleware, requireRole('super-admin'), adminController.getAuditLogs);
router.get('/student-logs', authMiddleware, requireRole('super-admin'), adminController.getStudentLogs);
router.get('/admin-logs', authMiddleware, requireRole('super-admin'), adminController.getAdminLogs);
router.get('/certificate-logs', authMiddleware, requireRole('super-admin'), adminController.getCertificateLogs);
router.get('/verification-analytics', authMiddleware, requireRole('admin'), adminController.getVerificationAnalytics);
router.post('/admins', authMiddleware, requireRole('super-admin'), adminController.createAdmin);
router.put('/admins/:id', authMiddleware, requireRole('super-admin'), adminController.updateAdmin);
router.patch('/admins/:id/suspend', authMiddleware, requireRole('super-admin'), adminController.suspendAdmin);
router.delete('/admins/:id', authMiddleware, requireRole('super-admin'), adminController.deleteAdmin);

module.exports = router;
