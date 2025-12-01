const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Data files
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const FLIGHTS_FILE = path.join(DATA_DIR, 'flights.json');
const HOTELS_FILE = path.join(DATA_DIR, 'hotels.json');
const CARS_FILE = path.join(DATA_DIR, 'cars.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Initialize data files
const initFile = (file, defaultData = []) => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
  }
};

initFile(FLIGHTS_FILE);
initFile(HOTELS_FILE);
initFile(CARS_FILE);
initFile(USERS_FILE);

// Helper functions
const readData = (file) => {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
};

const writeData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${file}:`, error);
    return false;
  }
};

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Simple backend is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// FLIGHTS ENDPOINTS
// ============================================

// Get all flights
app.get('/api/admin/listings/flights', (req, res) => {
  const flights = readData(FLIGHTS_FILE);
  res.json({ success: true, data: flights });
});

// Add flight
app.post('/api/admin/listings/flight', (req, res) => {
  const flights = readData(FLIGHTS_FILE);
  const newFlight = {
    ...req.body,
    created_at: new Date().toISOString(),
    is_active: true
  };
  flights.push(newFlight);
  
  if (writeData(FLIGHTS_FILE, flights)) {
    res.status(201).json({
      success: true,
      message: 'Flight added successfully',
      flight_id: newFlight.flight_id
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to save flight'
    });
  }
});

// Delete flight
app.delete('/api/admin/listings/flight/:id', (req, res) => {
  const flights = readData(FLIGHTS_FILE);
  const filtered = flights.filter(f => f.flight_id !== req.params.id);
  
  if (writeData(FLIGHTS_FILE, filtered)) {
    res.json({ success: true, message: 'Flight deleted' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete flight' });
  }
});

// ============================================
// HOTELS ENDPOINTS
// ============================================

// Get all hotels
app.get('/api/admin/listings/hotels', (req, res) => {
  const hotels = readData(HOTELS_FILE);
  res.json({ success: true, data: hotels });
});

// Add hotel
app.post('/api/admin/listings/hotel', (req, res) => {
  const hotels = readData(HOTELS_FILE);
  const newHotel = {
    ...req.body,
    created_at: new Date().toISOString(),
    is_active: true
  };
  hotels.push(newHotel);
  
  if (writeData(HOTELS_FILE, hotels)) {
    res.status(201).json({
      success: true,
      message: 'Hotel added successfully',
      hotel_id: newHotel.hotel_id
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to save hotel'
    });
  }
});

// Delete hotel
app.delete('/api/admin/listings/hotel/:id', (req, res) => {
  const hotels = readData(HOTELS_FILE);
  const filtered = hotels.filter(h => h.hotel_id !== req.params.id);
  
  if (writeData(HOTELS_FILE, filtered)) {
    res.json({ success: true, message: 'Hotel deleted' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete hotel' });
  }
});

// ============================================
// CARS ENDPOINTS
// ============================================

// Get all cars
app.get('/api/admin/listings/cars', (req, res) => {
  const cars = readData(CARS_FILE);
  res.json({ success: true, data: cars });
});

// Add car
app.post('/api/admin/listings/car', (req, res) => {
  const cars = readData(CARS_FILE);
  const newCar = {
    ...req.body,
    created_at: new Date().toISOString(),
    is_active: true
  };
  cars.push(newCar);
  
  if (writeData(CARS_FILE, cars)) {
    res.status(201).json({
      success: true,
      message: 'Car added successfully',
      car_id: newCar.car_id
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to save car'
    });
  }
});

// Delete car
app.delete('/api/admin/listings/car/:id', (req, res) => {
  const cars = readData(CARS_FILE);
  const filtered = cars.filter(c => c.car_id !== req.params.id);
  
  if (writeData(CARS_FILE, filtered)) {
    res.json({ success: true, message: 'Car deleted' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete car' });
  }
});

// ============================================
// USERS ENDPOINTS (for admin dashboard)
// ============================================

// Get all users
app.get('/api/admin/users', (req, res) => {
  const users = readData(USERS_FILE);
  res.json({
    success: true,
    data: {
      users: users,
      pagination: {
        page: 1,
        limit: 50,
        total: users.length,
        totalPages: 1
      }
    }
  });
});

// Add user (from traveler registration)
app.post('/api/users/register', (req, res) => {
  const users = readData(USERS_FILE);
  const newUser = {
    ...req.body,
    user_id: req.body.user_id || `USER-${Date.now()}`,
    created_at: new Date().toISOString(),
    is_active: true
  };
  users.push(newUser);
  
  if (writeData(USERS_FILE, users)) {
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user_id: newUser.user_id
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Simple Backend running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log('========================================');
  console.log('Available endpoints:');
  console.log('  GET  /api/admin/listings/flights');
  console.log('  POST /api/admin/listings/flight');
  console.log('  GET  /api/admin/listings/hotels');
  console.log('  POST /api/admin/listings/hotel');
  console.log('  GET  /api/admin/listings/cars');
  console.log('  POST /api/admin/listings/car');
  console.log('  GET  /api/admin/users');
  console.log('========================================');
});

module.exports = app;

