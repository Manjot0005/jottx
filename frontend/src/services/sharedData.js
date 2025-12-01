/**
 * Shared Data Service
 * Syncs data between Admin and Traveler frontends via localStorage
 */

// Use the same keys as traveler frontend for seamless sync
const STORAGE_KEYS = {
  USERS: 'registeredUsers',  // Same as traveler frontend
  FLIGHTS: 'flightsInventory',  // Same as traveler frontend
  HOTELS: 'hotelsInventory',  // Same as traveler frontend
  CARS: 'carsInventory',  // Same as traveler frontend
  BOOKINGS: 'userBookings',  // Same as traveler frontend
  BILLING: 'kayak_billing',
  ANALYTICS: 'kayak_analytics',
};

// ============================================
// USERS
// ============================================
export const usersStore = {
  getAll: () => {
    // Get users from shared storage (same as traveler frontend)
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return users.map(u => ({
      user_id: u.user_id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone_number: u.phone || u.phone_number || '',
      city: u.city || '',
      state: u.state || '',
      zip_code: u.zip_code || '',
      is_active: u.is_active !== false,
      created_at: u.created_at || new Date().toISOString(),
    }));
  },
  
  add: (user) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const newUser = {
      ...user,
      user_id: user.user_id || 'USR-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },
  
  update: (userId, data) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const index = users.findIndex(u => u.user_id === userId || u.email === data.email);
    if (index >= 0) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      return users[index];
    }
    return null;
  },
  
  delete: (userId) => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const filtered = users.filter(u => u.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
  },
};

// ============================================
// FLIGHTS
// ============================================
export const flightsStore = {
  getAll: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.FLIGHTS) || '[]');
  },
  
  add: (flight) => {
    const flights = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLIGHTS) || '[]');
    
    // Format departure/arrival times
    let departTime = '08:00';
    let arriveTime = '12:00';
    if (flight.departure_datetime) {
      const depDate = new Date(flight.departure_datetime);
      departTime = depDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (flight.arrival_datetime) {
      const arrDate = new Date(flight.arrival_datetime);
      arriveTime = arrDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    
    // Calculate duration string
    const durationMins = parseInt(flight.duration) || 120;
    const durationStr = `${Math.floor(durationMins / 60)}h ${durationMins % 60}m`;
    
    // Create flight in traveler-compatible format
    const newFlight = {
      id: flight.flight_id,
      flightNumber: flight.flight_id,
      airline: flight.airline_name,
      from: flight.departure_airport,
      to: flight.arrival_airport,
      departTime: departTime,
      arriveTime: arriveTime,
      duration: durationStr,
      stops: 0,
      seatsAvailable: parseInt(flight.available_seats) || parseInt(flight.total_seats) || 100,
      providers: [
        { name: 'Kayak Direct', price: parseFloat(flight.ticket_price) || 100 },
        { name: 'Expedia', price: Math.round((parseFloat(flight.ticket_price) || 100) * 1.05) },
        { name: 'Priceline', price: Math.round((parseFloat(flight.ticket_price) || 100) * 1.1) },
      ],
      // Keep original admin data too
      flight_id: flight.flight_id,
      airline_name: flight.airline_name,
      departure_airport: flight.departure_airport,
      arrival_airport: flight.arrival_airport,
      ticket_price: flight.ticket_price,
      total_seats: flight.total_seats,
      available_seats: flight.available_seats,
      created_at: new Date().toISOString(),
    };
    
    flights.push(newFlight);
    localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(flights));
    return newFlight;
  },
  
  getById: (id) => {
    return flightsStore.getAll().find(f => f.flight_id === id || f.id === id);
  },
  
  update: (id, data) => {
    const flights = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLIGHTS) || '[]');
    const index = flights.findIndex(f => f.flight_id === id || f.id === id);
    if (index >= 0) {
      flights[index] = { ...flights[index], ...data };
      localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(flights));
    }
    return flights[index];
  },
  
  delete: (id) => {
    const flights = JSON.parse(localStorage.getItem(STORAGE_KEYS.FLIGHTS) || '[]');
    const filtered = flights.filter(f => f.flight_id !== id && f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(filtered));
  },
};

// ============================================
// HOTELS
// ============================================
export const hotelsStore = {
  getAll: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOTELS) || '[]');
  },
  
  add: (hotel) => {
    const hotels = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOTELS) || '[]');
    
    // Create hotel in traveler-compatible format
    const newHotel = {
      id: hotel.hotel_id,
      name: hotel.hotel_name,
      city: hotel.city,
      location: `${hotel.city}, ${hotel.state}`,
      rating: parseFloat(hotel.star_rating) || 4,
      reviews: Math.floor(Math.random() * 1000) + 100,
      stars: parseInt(hotel.star_rating) || 4,
      roomsAvailable: parseInt(hotel.available_rooms) || parseInt(hotel.total_rooms) || 50,
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities : (hotel.amenities || 'WiFi').split(',').map(a => a.trim()),
      providers: [
        { name: 'Booking.com', price: parseFloat(hotel.price_per_night) || 100 },
        { name: 'Hotels.com', price: Math.round((parseFloat(hotel.price_per_night) || 100) * 1.05) },
        { name: 'Expedia', price: Math.round((parseFloat(hotel.price_per_night) || 100) * 1.1) },
      ],
      // Keep original admin data
      hotel_id: hotel.hotel_id,
      hotel_name: hotel.hotel_name,
      address: hotel.address,
      state: hotel.state,
      zip_code: hotel.zip_code,
      star_rating: hotel.star_rating,
      total_rooms: hotel.total_rooms,
      available_rooms: hotel.available_rooms,
      room_type: hotel.room_type,
      price_per_night: hotel.price_per_night,
      created_at: new Date().toISOString(),
    };
    
    hotels.push(newHotel);
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
    return newHotel;
  },
  
  update: (id, data) => {
    const hotels = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOTELS) || '[]');
    const index = hotels.findIndex(h => h.hotel_id === id || h.id === id);
    if (index >= 0) {
      hotels[index] = { ...hotels[index], ...data };
      localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
    }
    return hotels[index];
  },
  
  delete: (id) => {
    const hotels = JSON.parse(localStorage.getItem(STORAGE_KEYS.HOTELS) || '[]');
    const filtered = hotels.filter(h => h.hotel_id !== id && h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(filtered));
  },
};

// ============================================
// CARS
// ============================================
export const carsStore = {
  getAll: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CARS) || '[]');
  },
  
  add: (car) => {
    const cars = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARS) || '[]');
    
    // Create car in traveler-compatible format
    const newCar = {
      id: car.car_id,
      type: car.car_type,
      model: `${car.model} ${car.year || ''}`.trim(),
      passengerCapacity: parseInt(car.seats) || 5,
      bags: Math.ceil((parseInt(car.seats) || 5) / 2),
      transmission: car.transmission_type || 'Automatic',
      carsAvailable: car.availability_status === 'AVAILABLE' ? 10 : 0,
      cities: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Denver', 'Seattle'],
      providers: [
        { name: car.company_name, price: parseFloat(car.daily_rental_price) || 50 },
        { name: 'Enterprise', price: Math.round((parseFloat(car.daily_rental_price) || 50) * 1.05) },
        { name: 'Budget', price: Math.round((parseFloat(car.daily_rental_price) || 50) * 0.95) },
      ],
      // Keep original admin data
      car_id: car.car_id,
      car_type: car.car_type,
      company_name: car.company_name,
      year: car.year,
      seats: car.seats,
      daily_rental_price: car.daily_rental_price,
      transmission_type: car.transmission_type,
      availability_status: car.availability_status,
      created_at: new Date().toISOString(),
    };
    
    cars.push(newCar);
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
    return newCar;
  },
  
  update: (id, data) => {
    const cars = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARS) || '[]');
    const index = cars.findIndex(c => c.car_id === id || c.id === id);
    if (index >= 0) {
      cars[index] = { ...cars[index], ...data };
      localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
    }
    return cars[index];
  },
  
  delete: (id) => {
    const cars = JSON.parse(localStorage.getItem(STORAGE_KEYS.CARS) || '[]');
    const filtered = cars.filter(c => c.car_id !== id && c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(filtered));
  },
};

// ============================================
// BOOKINGS
// ============================================
export const bookingsStore = {
  getAll: () => {
    // userBookings is stored as { "user@email.com": [bookings...] }
    const userBookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '{}');
    
    // Flatten user bookings into array
    const allBookings = [];
    Object.entries(userBookings).forEach(([userId, bookings]) => {
      if (Array.isArray(bookings)) {
        bookings.forEach(b => {
          allBookings.push({ ...b, user_id: userId });
        });
      }
    });
    
    return allBookings;
  },
  
  getByUser: (userId) => {
    const userBookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '{}');
    return userBookings[userId] || [];
  },
};

// ============================================
// BILLING
// ============================================
export const billingStore = {
  getAll: () => {
    const billing = JSON.parse(localStorage.getItem(STORAGE_KEYS.BILLING) || '[]');
    
    // Also generate billing from bookings
    const bookings = bookingsStore.getAll();
    const bookingBills = bookings.map(b => ({
      billing_id: 'BIL-' + (b.id || b.booking_id || Date.now()),
      user_id: b.user_id,
      booking_type: (b.type || b.booking_type || 'UNKNOWN').toUpperCase(),
      booking_id: b.id || b.booking_id || b.confirmationNumber,
      transaction_date: b.createdAt || b.created_at || new Date().toISOString(),
      total_amount: b.totalPrice || b.total_price || 0,
      payment_method: 'Credit Card',
      transaction_status: b.status === 'confirmed' ? 'COMPLETED' : 'PENDING',
    }));
    
    // Merge and dedupe
    const allBilling = [...billing];
    bookingBills.forEach(bb => {
      if (!allBilling.find(b => b.booking_id === bb.booking_id)) {
        allBilling.push(bb);
      }
    });
    
    return allBilling;
  },
  
  search: (filters = {}) => {
    let bills = billingStore.getAll();
    
    if (filters.startDate) {
      bills = bills.filter(b => new Date(b.transaction_date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      bills = bills.filter(b => new Date(b.transaction_date) <= new Date(filters.endDate));
    }
    if (filters.booking_type) {
      bills = bills.filter(b => b.booking_type === filters.booking_type);
    }
    
    return bills;
  },
};

// ============================================
// ANALYTICS
// ============================================
export const analyticsStore = {
  getStats: () => {
    const users = usersStore.getAll();
    const flights = flightsStore.getAll();
    const hotels = hotelsStore.getAll();
    const cars = carsStore.getAll();
    const bookings = bookingsStore.getAll();
    const billing = billingStore.getAll();
    
    const totalRevenue = billing.reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);
    
    return {
      totalUsers: users.length,
      totalListings: flights.length + hotels.length + cars.length,
      totalFlights: flights.length,
      totalHotels: hotels.length,
      totalCars: cars.length,
      totalBookings: bookings.length,
      totalRevenue: totalRevenue,
      pendingBookings: bookings.filter(b => b.status === 'pending' || b.status === 'PENDING').length,
      completedBookings: bookings.filter(b => b.status === 'confirmed' || b.status === 'COMPLETED').length,
    };
  },
  
  getRevenueByType: () => {
    const billing = billingStore.getAll();
    const byType = {};
    
    billing.forEach(b => {
      const type = b.booking_type || 'OTHER';
      byType[type] = (byType[type] || 0) + (parseFloat(b.total_amount) || 0);
    });
    
    return Object.entries(byType).map(([type, revenue]) => ({ type, revenue }));
  },
  
  getBookingsOverTime: () => {
    const bookings = bookingsStore.getAll();
    const byDate = {};
    
    bookings.forEach(b => {
      const date = new Date(b.createdAt || b.created_at || Date.now()).toLocaleDateString();
      byDate[date] = (byDate[date] || 0) + 1;
    });
    
    return Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Last 30 days
  },
  
  getTopCities: () => {
    const hotels = hotelsStore.getAll();
    const byCIty = {};
    
    hotels.forEach(h => {
      const city = h.city || 'Unknown';
      byCIty[city] = (byCIty[city] || 0) + 1;
    });
    
    return Object.entries(byCIty)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },
};

// Export all stores
export default {
  users: usersStore,
  flights: flightsStore,
  hotels: hotelsStore,
  cars: carsStore,
  bookings: bookingsStore,
  billing: billingStore,
  analytics: analyticsStore,
};

