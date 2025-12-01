const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateLogin, validateAdminRegistration } = require('../middleware/validation');

// Public routes
router.post('/login', validateLogin, authController.login);

// Public signup (for demo purposes - in production, this should be protected)
router.post('/register', validateAdminRegistration, authController.register);

// Alternative: Protected admin creation (super_admin only)
router.post('/create-admin', authenticate, authorize('super_admin'), validateAdminRegistration, authController.register);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/verify', authenticate, authController.verifyToken);

module.exports = router;
