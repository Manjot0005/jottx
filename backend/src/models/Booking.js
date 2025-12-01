/**
 * Booking Model - MySQL
 * Handles all booking types (flight, hotel, car)
 */
const { mysqlPool } = require('../config/database');

// SSN Format Validation: XXX-XX-XXXX
const SSN_REGEX = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;

class Booking {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS bookings (
        booking_id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(11) NOT NULL COMMENT 'SSN Format',
        booking_type ENUM('FLIGHT', 'HOTEL', 'CAR') NOT NULL,
        reference_id VARCHAR(50) NOT NULL COMMENT 'Flight/Hotel/Car ID',
        provider_name VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE,
        quantity INT DEFAULT 1 COMMENT 'Passengers/Rooms/Days',
        unit_price DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
        payment_status ENUM('PENDING', 'PAID', 'REFUNDED') DEFAULT 'PENDING',
        traveler_details JSON COMMENT 'Array of traveler info',
        special_requests TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user (user_id),
        INDEX idx_type (booking_type),
        INDEX idx_status (status),
        INDEX idx_date (start_date),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await mysqlPool.execute(query);
  }

  static validateUserId(userId) {
    if (!SSN_REGEX.test(userId)) {
      throw new Error('invalid_user_id: User ID must match SSN format XXX-XX-XXXX');
    }
    return true;
  }

  static async create(bookingData) {
    this.validateUserId(bookingData.user_id);

    const bookingId = 'BK-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const query = `
      INSERT INTO bookings (
        booking_id, user_id, booking_type, reference_id, provider_name,
        start_date, end_date, quantity, unit_price, total_price,
        status, payment_status, traveler_details, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const travelerJson = typeof bookingData.traveler_details === 'string' 
      ? bookingData.traveler_details 
      : JSON.stringify(bookingData.traveler_details || []);

    const [result] = await mysqlPool.execute(query, [
      bookingId,
      bookingData.user_id,
      bookingData.booking_type,
      bookingData.reference_id,
      bookingData.provider_name || null,
      bookingData.start_date,
      bookingData.end_date || null,
      bookingData.quantity || 1,
      bookingData.unit_price,
      bookingData.total_price,
      bookingData.status || 'PENDING',
      bookingData.payment_status || 'PENDING',
      travelerJson,
      bookingData.special_requests || null
    ]);

    return { ...result, booking_id: bookingId };
  }

  static async findById(bookingId) {
    const query = 'SELECT * FROM bookings WHERE booking_id = ?';
    const [rows] = await mysqlPool.execute(query, [bookingId]);
    if (rows[0]) {
      rows[0].traveler_details = typeof rows[0].traveler_details === 'string' 
        ? JSON.parse(rows[0].traveler_details) 
        : rows[0].traveler_details;
    }
    return rows[0];
  }

  static async getByUser(userId, status = null, type = null) {
    this.validateUserId(userId);
    
    let query = 'SELECT * FROM bookings WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND booking_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await mysqlPool.execute(query, params);
    return rows.map(b => ({
      ...b,
      traveler_details: typeof b.traveler_details === 'string' 
        ? JSON.parse(b.traveler_details) 
        : b.traveler_details
    }));
  }

  // Get past, current, and future bookings
  static async getBookingsByTimeframe(userId) {
    this.validateUserId(userId);
    
    const today = new Date().toISOString().split('T')[0];
    
    const [past] = await mysqlPool.execute(
      'SELECT * FROM bookings WHERE user_id = ? AND end_date < ? ORDER BY end_date DESC',
      [userId, today]
    );
    
    const [current] = await mysqlPool.execute(
      'SELECT * FROM bookings WHERE user_id = ? AND start_date <= ? AND (end_date >= ? OR end_date IS NULL) ORDER BY start_date',
      [userId, today, today]
    );
    
    const [future] = await mysqlPool.execute(
      'SELECT * FROM bookings WHERE user_id = ? AND start_date > ? ORDER BY start_date',
      [userId, today]
    );

    return { past, current, future };
  }

  static async updateStatus(bookingId, status) {
    if (!['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      throw new Error('Invalid booking status');
    }
    const query = 'UPDATE bookings SET status = ? WHERE booking_id = ?';
    await mysqlPool.execute(query, [status, bookingId]);
  }

  static async cancel(bookingId) {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Get booking details
      const [rows] = await connection.execute(
        'SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE',
        [bookingId]
      );
      
      if (!rows[0]) throw new Error('Booking not found');
      if (rows[0].status === 'CANCELLED') throw new Error('Booking already cancelled');
      
      // Update booking status
      await connection.execute(
        'UPDATE bookings SET status = "CANCELLED" WHERE booking_id = ?',
        [bookingId]
      );
      
      // Restore inventory based on booking type
      const booking = rows[0];
      if (booking.booking_type === 'FLIGHT') {
        await connection.execute(
          'UPDATE flights SET available_seats = available_seats + ? WHERE flight_id = ?',
          [booking.quantity, booking.reference_id]
        );
      } else if (booking.booking_type === 'HOTEL') {
        await connection.execute(
          'UPDATE hotels SET available_rooms = available_rooms + ? WHERE hotel_id = ?',
          [booking.quantity, booking.reference_id]
        );
      } else if (booking.booking_type === 'CAR') {
        await connection.execute(
          'UPDATE cars SET availability_status = "AVAILABLE" WHERE car_id = ?',
          [booking.reference_id]
        );
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async search(filters = {}) {
    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (filters.user_id) {
      this.validateUserId(filters.user_id);
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }
    if (filters.booking_type) {
      query += ' AND booking_type = ?';
      params.push(filters.booking_type);
    }
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.start_date) {
      query += ' AND start_date >= ?';
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      query += ' AND start_date <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';
    const [rows] = await mysqlPool.execute(query, params);
    return rows;
  }
}

module.exports = Booking;

