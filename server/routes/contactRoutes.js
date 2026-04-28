const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Public route - Submit contact message
router.post('/submit', contactController.submitContactMessage);

// Admin routes - Require authentication and admin authorization
router.get('/messages', authMiddleware, requireRole('admin'), contactController.getAllContactMessages);
router.get('/messages/:id', authMiddleware, requireRole('admin'), contactController.getContactMessage);
router.put('/messages/:id/status', authMiddleware, requireRole('admin'), contactController.updateContactMessageStatus);
router.delete('/messages/:id', authMiddleware, requireRole('admin'), contactController.deleteContactMessage);
router.get('/unread-count', authMiddleware, requireRole('admin'), contactController.getUnreadCount);

module.exports = router;
