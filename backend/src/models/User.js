/**
 * User Model - MySQL
 * Handles user data with SSN format validation
 */
const { mysqlPool } = require('../config/database');
const bcrypt = require('bcryptjs');

// SSN Format Validation: XXX-XX-XXXX
const SSN_REGEX = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;

// Valid US State Abbreviations
const VALID_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// ZIP Code Validation: ##### or #####-####
const ZIP_REGEX = /^[0-9]{5}(-[0-9]{4})?$/;

class User {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(11) PRIMARY KEY COMMENT 'SSN Format: XXX-XX-XXXX',
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        profile_image VARCHAR(500),
        credit_card_last_four VARCHAR(4),
        credit_card_type VARCHAR(20),
        payment_method VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_active (is_active),
        INDEX idx_city_state (city, state)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await mysqlPool.execute(query);
  }

  static validateSSN(userId) {
    if (!SSN_REGEX.test(userId)) {
      throw new Error('invalid_user_id: User ID must match SSN format XXX-XX-XXXX');
    }
    return true;
  }

  static validateState(state) {
    if (state && !VALID_STATES.includes(state.toUpperCase())) {
      throw new Error('malformed_state: Invalid US state abbreviation');
    }
    return true;
  }

  static validateZipCode(zipCode) {
    if (zipCode && !ZIP_REGEX.test(zipCode)) {
      throw new Error('malformed_zip_code: ZIP code must be ##### or #####-####');
    }
    return true;
  }

  static async create(userData) {
    // Validate required fields
    this.validateSSN(userData.user_id);
    this.validateState(userData.state);
    this.validateZipCode(userData.zip_code);

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const query = `
      INSERT INTO users (
        user_id, first_name, last_name, email, password,
        phone_number, address, city, state, zip_code,
        profile_image, credit_card_last_four, credit_card_type, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await mysqlPool.execute(query, [
        userData.user_id,
        userData.first_name,
        userData.last_name,
        userData.email,
        hashedPassword,
        userData.phone_number || null,
        userData.address || null,
        userData.city || null,
        userData.state?.toUpperCase() || null,
        userData.zip_code || null,
        userData.profile_image || null,
        userData.credit_card_last_four || null,
        userData.credit_card_type || null,
        userData.payment_method || null
      ]);
      return result;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('duplicate_user: A user with this ID or email already exists');
      }
      throw error;
    }
  }

  static async findById(userId) {
    this.validateSSN(userId);
    const query = 'SELECT * FROM users WHERE user_id = ? AND is_active = true';
    const [rows] = await mysqlPool.execute(query, [userId]);
    return rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ? AND is_active = true';
    const [rows] = await mysqlPool.execute(query, [email]);
    return rows[0];
  }

  static async update(userId, updateData) {
    this.validateSSN(userId);
    if (updateData.state) this.validateState(updateData.state);
    if (updateData.zip_code) this.validateZipCode(updateData.zip_code);

    const fields = [];
    const values = [];
    
    const allowedFields = [
      'first_name', 'last_name', 'phone_number', 'address', 
      'city', 'state', 'zip_code', 'profile_image',
      'credit_card_last_four', 'credit_card_type', 'payment_method'
    ];
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'state' ? updateData[field]?.toUpperCase() : updateData[field]);
      }
    }
    
    if (fields.length === 0) return null;
    
    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;
    const [result] = await mysqlPool.execute(query, values);
    return result;
  }

  static async delete(userId) {
    this.validateSSN(userId);
    // Soft delete
    const query = 'UPDATE users SET is_active = false WHERE user_id = ?';
    const [result] = await mysqlPool.execute(query, [userId]);
    return result;
  }

  static async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT user_id, first_name, last_name, email, phone_number, 
             city, state, zip_code, profile_image, created_at 
      FROM users WHERE is_active = true 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await mysqlPool.execute(query, [limit.toString(), offset.toString()]);
    return rows;
  }

  static async search(searchTerm, filters = {}) {
    let query = 'SELECT * FROM users WHERE is_active = true';
    const params = [];

    if (searchTerm) {
      query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
      const term = `%${searchTerm}%`;
      params.push(term, term, term);
    }

    if (filters.city) {
      query += ' AND city = ?';
      params.push(filters.city);
    }

    if (filters.state) {
      this.validateState(filters.state);
      query += ' AND state = ?';
      params.push(filters.state.toUpperCase());
    }

    query += ' LIMIT 100';
    const [rows] = await mysqlPool.execute(query, params);
    return rows;
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;

