const express = require('express');
const router = express.Router();
const listingsController = require('../controllers/listingsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public GET routes (for traveler frontend)
router.get('/flights', listingsController.getAllFlights);
router.get('/hotels', listingsController.getAllHotels);
router.get('/cars', listingsController.getAllCars);

// Protected POST routes (for admin only)
router.post('/flight', authenticate, authorize('super_admin', 'admin'), listingsController.addFlight);
router.post('/hotel', authenticate, authorize('super_admin', 'admin'), listingsController.addHotel);
router.post('/car', authenticate, authorize('super_admin', 'admin'), listingsController.addCar);

module.exports = router;
