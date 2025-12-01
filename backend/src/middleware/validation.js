const { body, param, query, validationResult } = require('express-validator');

// ============================================
// VALIDATION CONSTANTS
// ============================================

// Valid US State Abbreviations
const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// SSN Format: XXX-XX-XXXX
const SSN_REGEX = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;

// ZIP Code: ##### or #####-####
const ZIP_REGEX = /^[0-9]{5}(-[0-9]{4})?$/;

// ============================================
// ERROR HANDLER
// ============================================
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

// ============================================
// CUSTOM VALIDATORS
// ============================================

// SSN Format Validator
const isValidSSN = (value) => {
  if (!SSN_REGEX.test(value)) {
    throw new Error('invalid_user_id: Must match SSN format XXX-XX-XXXX');
  }
  return true;
};

// State Validator
const isValidState = (value) => {
  if (value && !VALID_STATES.includes(value.toUpperCase())) {
    throw new Error('malformed_state: Invalid US state abbreviation');
  }
  return true;
};

// ZIP Code Validator
const isValidZipCode = (value) => {
  if (value && !ZIP_REGEX.test(value)) {
    throw new Error('malformed_zip_code: Must be ##### or #####-####');
  }
  return true;
};

// Phone Number Validator (10 digits)
const isValidPhone = (value) => {
  if (value) {
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10) {
      throw new Error('Phone number must be exactly 10 digits');
    }
  }
  return true;
};

// ============================================
// USER VALIDATION RULES
// ============================================
const validateUserRegistration = [
  body('user_id')
    .trim()
    .custom(isValidSSN)
    .withMessage('User ID must be in SSN format: XXX-XX-XXXX'),
  body('first_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required (max 100 characters)'),
  body('last_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required (max 100 characters)'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('phone_number')
    .optional()
    .custom(isValidPhone),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Address too long (max 500 characters)'),
  body('city')
    .optional()
    .isLength({ max: 100 }),
  body('state')
    .optional()
    .custom(isValidState),
  body('zip_code')
    .optional()
    .custom(isValidZipCode),
  handleValidationErrors
];

const validateUserUpdate = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }),
  body('phone_number')
    .optional()
    .custom(isValidPhone),
  body('address')
    .optional()
    .isLength({ max: 500 }),
  body('city')
    .optional()
    .isLength({ max: 100 }),
  body('state')
    .optional()
    .custom(isValidState),
  body('zip_code')
    .optional()
    .custom(isValidZipCode),
  handleValidationErrors
];

const validateUserIdParam = [
  param('id')
    .custom(isValidSSN)
    .withMessage('User ID must be in SSN format: XXX-XX-XXXX'),
  handleValidationErrors
];

// ============================================
// ADMIN VALIDATION RULES
// ============================================
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
    .withMessage('Password must be at least 6 characters'),
  body('phone_number')
    .optional()
    .custom(isValidPhone),
  body('state')
    .optional()
    .custom(isValidState),
  body('zip_code')
    .optional()
    .custom(isValidZipCode),
  body('access_level')
    .optional()
    .isIn(['admin', 'manager', 'super_admin'])
    .withMessage('Access level must be admin, manager, or super_admin'),
  handleValidationErrors
];

// ============================================
// LISTING VALIDATION RULES
// ============================================
const validateFlightListing = [
  body('flight_id')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Flight ID required'),
  body('airline_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Airline name required'),
  body('departure_airport')
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage('Valid departure airport code required'),
  body('arrival_airport')
    .trim()
    .isLength({ min: 3, max: 10 })
    .withMessage('Valid arrival airport code required'),
  body('departure_datetime')
    .isISO8601()
    .withMessage('Valid departure datetime required'),
  body('arrival_datetime')
    .isISO8601()
    .withMessage('Valid arrival datetime required'),
  body('ticket_price')
    .isFloat({ min: 0 })
    .withMessage('Ticket price must be a positive number'),
  body('total_seats')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total seats must be at least 1'),
  body('flight_class')
    .optional()
    .isIn(['Economy', 'Premium Economy', 'Business', 'First'])
    .withMessage('Invalid flight class'),
  handleValidationErrors
];

const validateHotelListing = [
  body('hotel_id')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Hotel ID required'),
  body('hotel_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Hotel name required'),
  body('address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Address required'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('City required'),
  body('state')
    .trim()
    .custom(isValidState),
  body('zip_code')
    .optional()
    .custom(isValidZipCode),
  body('star_rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Star rating must be 1-5'),
  body('price_per_night')
    .isFloat({ min: 0 })
    .withMessage('Price per night must be a positive number'),
  body('total_rooms')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total rooms must be at least 1'),
  body('room_type')
    .optional()
    .isIn(['Standard', 'Single', 'Double', 'Suite', 'Deluxe', 'Penthouse'])
    .withMessage('Invalid room type'),
  handleValidationErrors
];

const validateCarListing = [
  body('car_id')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Car ID required'),
  body('car_type')
    .trim()
    .isIn(['Economy', 'Compact', 'Midsize', 'Full-size', 'SUV', 'Luxury', 'Minivan', 'Convertible'])
    .withMessage('Invalid car type'),
  body('company_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Company name required'),
  body('model')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Model required'),
  body('year')
    .optional()
    .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
    .withMessage('Invalid year'),
  body('daily_rental_price')
    .isFloat({ min: 0 })
    .withMessage('Daily rental price must be a positive number'),
  body('seats')
    .optional()
    .isInt({ min: 2, max: 15 })
    .withMessage('Seats must be between 2 and 15'),
  body('transmission_type')
    .optional()
    .isIn(['Automatic', 'Manual'])
    .withMessage('Transmission must be Automatic or Manual'),
  handleValidationErrors
];

const validateListing = [
  body('listing_type')
    .optional()
    .isIn(['FLIGHT', 'HOTEL', 'CAR'])
    .withMessage('Listing type must be FLIGHT, HOTEL, or CAR'),
  handleValidationErrors
];

// ============================================
// BOOKING VALIDATION RULES
// ============================================
const validateBooking = [
  body('user_id')
    .custom(isValidSSN)
    .withMessage('User ID must be in SSN format: XXX-XX-XXXX'),
  body('booking_type')
    .isIn(['FLIGHT', 'HOTEL', 'CAR'])
    .withMessage('Booking type must be FLIGHT, HOTEL, or CAR'),
  body('reference_id')
    .trim()
    .notEmpty()
    .withMessage('Reference ID (flight/hotel/car ID) required'),
  body('start_date')
    .isISO8601()
    .withMessage('Valid start date required'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO date'),
  body('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  handleValidationErrors
];

// ============================================
// BILLING VALIDATION RULES
// ============================================
const validateBilling = [
  body('user_id')
    .custom(isValidSSN)
    .withMessage('User ID must be in SSN format: XXX-XX-XXXX'),
  body('booking_type')
    .isIn(['FLIGHT', 'HOTEL', 'CAR'])
    .withMessage('Booking type required'),
  body('booking_id')
    .trim()
    .notEmpty()
    .withMessage('Booking ID required'),
  body('total_amount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('payment_method')
    .isIn(['credit_card', 'debit_card', 'paypal', 'stripe'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

// ============================================
// REVIEW VALIDATION RULES
// ============================================
const validateReview = [
  body('user_id')
    .custom(isValidSSN)
    .withMessage('User ID must be in SSN format: XXX-XX-XXXX'),
  body('listing_type')
    .isIn(['FLIGHT', 'HOTEL', 'CAR'])
    .withMessage('Listing type must be FLIGHT, HOTEL, or CAR'),
  body('listing_id')
    .trim()
    .notEmpty()
    .withMessage('Listing ID required'),
  body('booking_id')
    .trim()
    .notEmpty()
    .withMessage('Booking ID required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review_text')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Review must be between 10 and 2000 characters'),
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

// User ID validation - simplified (for non-SSN systems)
const validateUserId = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required'),
  handleValidationErrors
];

module.exports = {
  // Constants
  VALID_STATES,
  SSN_REGEX,
  ZIP_REGEX,
  // Custom validators
  isValidSSN,
  isValidState,
  isValidZipCode,
  isValidPhone,
  // Middleware
  handleValidationErrors,
  // User validations
  validateUserRegistration,
  validateUserUpdate,
  validateUserIdParam,
  // Admin validations
  validateAdminRegistration,
  validateLogin,
  // Listing validations
  validateListing,
  validateFlightListing,
  validateHotelListing,
  validateCarListing,
  // Booking validations
  validateBooking,
  // Billing validations
  validateBilling,
  // Review validations
  validateReview,
  // Legacy
  validateUserId
};
