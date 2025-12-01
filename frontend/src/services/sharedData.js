/**
 * Shared Data Service
 * Syncs data between Admin and Traveler frontends via localStorage
 */

const STORAGE_KEYS = {
  USERS: 'kayak_users',
  FLIGHTS: 'kayak_flights',
  HOTELS: 'kayak_hotels',
  CARS: 'kayak_cars',
  BOOKINGS: 'kayak_bookings',
  BILLING: 'kayak_billing',
  ANALYTICS: 'kayak_analytics',
};

// ============================================
// USERS
// ============================================
export const usersStore = {
  getAll: () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    // Also get travelers from traveler-frontend
    const travelers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    // Merge and dedupe by email
    const allUsers = [...users];
    travelers.forEach(t => {
      if (!allUsers.find(u => u.email === t.email)) {
        allUsers.push({
          user_id: t.user_id,
          first_name: t.first_name,
          last_name: t.last_name,
          email: t.email,
          phone_number: t.phone,
          city: t.city || '',
          state: t.state || '',
          zip_code: t.zip_code || '',
          is_active: true,
          created_at: t.created_at || new Date().toISOString(),
        });
      }
    });
    return allUsers;
  },
  
  add: (user) => {
    const users = usersStore.getAll();
    users.push({
      ...user,
      user_id: user.user_id || 'USR-' + Date.now(),
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return user;
  },
  
  update: (userId, data) => {
    const users = usersStore.getAll();
    const index = users.findIndex(u => u.user_id === userId);
    if (index >= 0) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
    return users[index];
  },
  
  delete: (userId) => {
    const users = usersStore.getAll().filter(u => u.user_id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
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
    const flights = flightsStore.getAll();
    const newFlight = {
      ...flight,
      id: flight.flight_id,
      created_at: new Date().toISOString(),
      seatsAvailable: parseInt(flight.available_seats) || parseInt(flight.total_seats) || 100,
      providers: [
        { name: 'Kayak Direct', price: parseFloat(flight.ticket_price) },
        { name: 'Expedia', price: parseFloat(flight.ticket_price) * 1.05 },
        { name: 'Priceline', price: parseFloat(flight.ticket_price) * 1.1 },
      ],
    };
    flights.push(newFlight);
    localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(flights));
    
    // Also sync to traveler frontend inventory
    syncFlightsToTraveler(flights);
    return newFlight;
  },
  
  getById: (id) => {
    return flightsStore.getAll().find(f => f.flight_id === id || f.id === id);
  },
  
  update: (id, data) => {
    const flights = flightsStore.getAll();
    const index = flights.findIndex(f => f.flight_id === id || f.id === id);
    if (index >= 0) {
      flights[index] = { ...flights[index], ...data };
      localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(flights));
      syncFlightsToTraveler(flights);
    }
    return flights[index];
  },
  
  delete: (id) => {
    const flights = flightsStore.getAll().filter(f => f.flight_id !== id && f.id !== id);
    localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(flights));
    syncFlightsToTraveler(flights);
  },
};

// Sync flights to traveler frontend format
const syncFlightsToTraveler = (flights) => {
  const travelerFlights = flights.map(f => ({
    id: f.flight_id || f.id,
    flightNumber: f.flight_id,
    airline: f.airline_name,
    from: f.departure_airport,
    to: f.arrival_airport,
    departTime: f.departure_datetime ? new Date(f.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '00:00',
    arriveTime: f.arrival_datetime ? new Date(f.arrival_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '00:00',
    duration: `${Math.floor((f.duration || 120) / 60)}h ${(f.duration || 120) % 60}m`,
    stops: 0,
    seatsAvailable: parseInt(f.available_seats) || parseInt(f.total_seats) || 100,
    providers: f.providers || [
      { name: 'Kayak Direct', price: parseFloat(f.ticket_price) || 100 },
      { name: 'Expedia', price: (parseFloat(f.ticket_price) || 100) * 1.05 },
    ],
  }));
  
  // Merge with existing traveler inventory
  const existing = JSON.parse(localStorage.getItem('flightsInventory') || '[]');
  const merged = [...existing.filter(e => !travelerFlights.find(t => t.id === e.id)), ...travelerFlights];
  localStorage.setItem('flightsInventory', JSON.stringify(merged));
};

// ============================================
// HOTELS
// ============================================
export const hotelsStore = {
  getAll: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.HOTELS) || '[]');
  },
  
  add: (hotel) => {
    const hotels = hotelsStore.getAll();
    const newHotel = {
      ...hotel,
      id: hotel.hotel_id,
      created_at: new Date().toISOString(),
      roomsAvailable: parseInt(hotel.available_rooms) || parseInt(hotel.total_rooms) || 50,
      providers: [
        { name: 'Booking.com', price: parseFloat(hotel.price_per_night) },
        { name: 'Hotels.com', price: parseFloat(hotel.price_per_night) * 1.05 },
        { name: 'Expedia', price: parseFloat(hotel.price_per_night) * 1.1 },
      ],
    };
    hotels.push(newHotel);
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
    
    // Sync to traveler
    syncHotelsToTraveler(hotels);
    return newHotel;
  },
  
  update: (id, data) => {
    const hotels = hotelsStore.getAll();
    const index = hotels.findIndex(h => h.hotel_id === id || h.id === id);
    if (index >= 0) {
      hotels[index] = { ...hotels[index], ...data };
      localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
      syncHotelsToTraveler(hotels);
    }
    return hotels[index];
  },
  
  delete: (id) => {
    const hotels = hotelsStore.getAll().filter(h => h.hotel_id !== id && h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
    syncHotelsToTraveler(hotels);
  },
};

const syncHotelsToTraveler = (hotels) => {
  const travelerHotels = hotels.map(h => ({
    id: h.hotel_id || h.id,
    name: h.hotel_name,
    city: h.city,
    location: `${h.city}, ${h.state}`,
    rating: parseFloat(h.star_rating) || 4,
    reviews: Math.floor(Math.random() * 1000) + 100,
    stars: parseInt(h.star_rating) || 4,
    roomsAvailable: parseInt(h.available_rooms) || parseInt(h.total_rooms) || 50,
    amenities: Array.isArray(h.amenities) ? h.amenities : (h.amenities || 'WiFi').split(',').map(a => a.trim()),
    providers: h.providers || [
      { name: 'Booking.com', price: parseFloat(h.price_per_night) || 100 },
      { name: 'Hotels.com', price: (parseFloat(h.price_per_night) || 100) * 1.05 },
    ],
  }));
  
  const existing = JSON.parse(localStorage.getItem('hotelsInventory') || '[]');
  const merged = [...existing.filter(e => !travelerHotels.find(t => t.id === e.id)), ...travelerHotels];
  localStorage.setItem('hotelsInventory', JSON.stringify(merged));
};

// ============================================
// CARS
// ============================================
export const carsStore = {
  getAll: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CARS) || '[]');
  },
  
  add: (car) => {
    const cars = carsStore.getAll();
    const newCar = {
      ...car,
      id: car.car_id,
      created_at: new Date().toISOString(),
      carsAvailable: car.availability_status === 'AVAILABLE' ? 10 : 0,
      providers: [
        { name: car.company_name, price: parseFloat(car.daily_rental_price) },
        { name: 'Enterprise', price: parseFloat(car.daily_rental_price) * 1.05 },
        { name: 'Budget', price: parseFloat(car.daily_rental_price) * 0.95 },
      ],
    };
    cars.push(newCar);
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
    
    // Sync to traveler
    syncCarsToTraveler(cars);
    return newCar;
  },
  
  update: (id, data) => {
    const cars = carsStore.getAll();
    const index = cars.findIndex(c => c.car_id === id || c.id === id);
    if (index >= 0) {
      cars[index] = { ...cars[index], ...data };
      localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
      syncCarsToTraveler(cars);
    }
    return cars[index];
  },
  
  delete: (id) => {
    const cars = carsStore.getAll().filter(c => c.car_id !== id && c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
    syncCarsToTraveler(cars);
  },
};

const syncCarsToTraveler = (cars) => {
  const travelerCars = cars.map(c => ({
    id: c.car_id || c.id,
    type: c.car_type,
    model: `${c.model} ${c.year || ''}`.trim(),
    passengerCapacity: parseInt(c.seats) || 5,
    bags: Math.ceil((parseInt(c.seats) || 5) / 2),
    transmission: c.transmission_type || 'Automatic',
    carsAvailable: c.availability_status === 'AVAILABLE' ? 10 : 0,
    cities: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'],
    providers: c.providers || [
      { name: c.company_name, price: parseFloat(c.daily_rental_price) || 50 },
      { name: 'Enterprise', price: (parseFloat(c.daily_rental_price) || 50) * 1.05 },
    ],
  }));
  
  const existing = JSON.parse(localStorage.getItem('carsInventory') || '[]');
  const merged = [...existing.filter(e => !travelerCars.find(t => t.id === e.id)), ...travelerCars];
  localStorage.setItem('carsInventory', JSON.stringify(merged));
};

// ============================================
// BOOKINGS
// ============================================
export const bookingsStore = {
  getAll: () => {
    // Get from both sources
    const adminBookings = JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');
    const userBookings = JSON.parse(localStorage.getItem('userBookings') || '{}');
    
    // Flatten user bookings
    const allUserBookings = Object.entries(userBookings).flatMap(([userId, bookings]) => 
      bookings.map(b => ({ ...b, user_id: userId }))
    );
    
    return [...adminBookings, ...allUserBookings];
  },
  
  getByUser: (userId) => {
    return bookingsStore.getAll().filter(b => b.user_id === userId);
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

