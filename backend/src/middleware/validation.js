const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Admin validation rules - Simplified for demo
const validateAdminRegistration = [
  body('admin_id')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Admin ID must be between 3 and 50 characters'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone_number')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be 10-15 characters'),
  body('state')
    .optional(),
  body('zip_code')
    .optional(),
  body('access_level')
    .optional()
    .isIn(['admin', 'manager', 'super_admin'])
    .withMessage('Access level must be admin, manager, or super_admin'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Listing validation
const validateListing = [
  body('listing_type')
    .optional()
    .isIn(['FLIGHT', 'HOTEL', 'CAR'])
    .withMessage('Listing type must be FLIGHT, HOTEL, or CAR'),
  handleValidationErrors
];

// User ID validation - simplified
const validateUserId = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required'),
  handleValidationErrors
];

module.exports = {
  validateAdminRegistration,
  validateLogin,
  validateListing,
  validateUserId,
  handleValidationErrors
};
