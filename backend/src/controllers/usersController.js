const { mysqlPool } = require('../config/database');
const ActivityLog = require('../models/ActivityLog');
const { cacheHelper } = require('../config/redis');
const bcrypt = require('bcryptjs');

const usersController = {
  // Get all users with optional search
  getAllUsers: async (req, res) => {
    try {
      const { page = 1, limit = 50, search = '' } = req.query;
      const offset = (page - 1) * limit;

      const cacheKey = `users:all:${page}:${limit}:${search}`;
      const cached = await cacheHelper.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          message: 'Users retrieved from cache',
          data: cached,
          cached: true
        });
      }

      let whereClause = '';
      let queryParams = [];
      
      if (search) {
        whereClause = `WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone_number LIKE ?`;
        const searchTerm = `%${search}%`;
        queryParams = [searchTerm, searchTerm, searchTerm, searchTerm];
      }

      const [users] = await mysqlPool.query(
        `SELECT user_id, first_name, last_name, email, city, state, country, zipcode, phone_number, is_active, created_at 
         FROM users 
         ${whereClause}
         ORDER BY created_at DESC 
         LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
        queryParams
      );

      const [countResult] = await mysqlPool.query(
        `SELECT COUNT(*) as total FROM users ${whereClause}`,
        queryParams
      );
      const total = countResult[0].total;

      const result = {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

      // Cache results
      await cacheHelper.set(cacheKey, result);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error.message
      });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      const { 
        first_name, 
        last_name, 
        email, 
        password, 
        phone_number, 
        city, 
        state, 
        country, 
        zipcode,
        is_active = true 
      } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'First name, last name, email, and password are required'
        });
      }

      // Check if email already exists
      const [existing] = await connection.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [result] = await connection.execute(
        `INSERT INTO users (first_name, last_name, email, password, phone_number, city, state, country, zipcode, is_active, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [first_name, last_name, email, hashedPassword, phone_number || null, city || null, state || null, country || null, zipcode || null, is_active ? 1 : 0]
      );

      await connection.commit();

      // Invalidate cache
      await cacheHelper.delPattern('users:all:*');

      // Log activity
      await ActivityLog.create({
        admin_id: req.admin.admin_id,
        action: 'CREATE_USER',
        entity_type: 'USER',
        entity_id: result.insertId,
        details: { email, first_name, last_name },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'SUCCESS'
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user_id: result.insertId }
      });
    } catch (error) {
      await connection.rollback();
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;

      const cacheKey = `user:${id}`;
      const cached = await cacheHelper.get(cacheKey);
      
      if (cached) {
        return res.json({
          success: true,
          message: 'User retrieved from cache',
          data: cached,
          cached: true
        });
      }

      const [users] = await mysqlPool.execute(
        'SELECT * FROM users WHERE user_id = ?',
        [id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Cache result
      await cacheHelper.set(cacheKey, users[0]);

      // Log activity
      await ActivityLog.create({
        admin_id: req.admin.admin_id,
        action: 'VIEW_USER',
        entity_type: 'USER',
        entity_id: id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'SUCCESS'
      });

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: users[0]
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: error.message
      });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;
      const updates = req.body;

      // Check if user exists
      const [existing] = await connection.execute(
        'SELECT * FROM users WHERE user_id = ?',
        [id]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Build update query
      const allowedFields = ['first_name', 'last_name', 'phone_number', 'address', 'city', 'state', 'country', 'zipcode', 'is_active'];
      const updateFields = [];
      const values = [];
      
      // Handle password separately
      if (updates.password) {
        const hashedPassword = await require('bcryptjs').hash(updates.password, 10);
        updateFields.push('password = ?');
        values.push(hashedPassword);
      }

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      }

      if (updateFields.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      values.push(id);
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
      
      await connection.execute(query, values);
      await connection.commit();

      // Invalidate cache
      await cacheHelper.del(`user:${id}`);
      await cacheHelper.delPattern('users:all:*');

      // Log activity
      await ActivityLog.create({
        admin_id: req.admin.admin_id,
        action: 'UPDATE_USER',
        entity_type: 'USER',
        entity_id: id,
        details: updates,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'SUCCESS'
      });

      res.json({
        success: true,
        message: 'User updated successfully'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    } finally {
      connection.release();
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();

      const { id } = req.params;

      // Check if user exists
      const [existing] = await connection.execute(
        'SELECT * FROM users WHERE user_id = ?',
        [id]
      );

      if (existing.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Soft delete - mark as inactive
      await connection.execute(
        'UPDATE users SET is_active = false WHERE user_id = ?',
        [id]
      );

      await connection.commit();

      // Invalidate cache
      await cacheHelper.del(`user:${id}`);
      await cacheHelper.delPattern('users:all:*');

      // Log activity
      await ActivityLog.create({
        admin_id: req.admin.admin_id,
        action: 'DELETE_USER',
        entity_type: 'USER',
        entity_id: id,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'SUCCESS'
      });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    } finally {
      connection.release();
    }
  }
};

module.exports = usersController;
