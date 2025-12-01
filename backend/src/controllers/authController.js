const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');

const authController = {
  // Admin Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find admin by email
      const admin = await Admin.findByEmail(email);
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isPasswordValid = await Admin.comparePassword(password, admin.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Update last login
      await Admin.updateLastLogin(admin.admin_id);

      // Generate JWT token
      const token = jwt.sign(
        { 
          admin_id: admin.admin_id,
          email: admin.email,
          access_level: admin.access_level
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
      );

      // Log activity
      await ActivityLog.create({
        admin_id: admin.admin_id,
        action: 'LOGIN',
        entity_type: 'SYSTEM',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'SUCCESS'
      });

      // Remove password from response
      const { password: _, ...adminData } = admin;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          admin: adminData,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  },

  // Admin Logout
  logout: async (req, res) => {
    try {
      // Log activity
      await ActivityLog.create({
        admin_id: req.admin.admin_id,
        action: 'LOGOUT',
        entity_type: 'SYSTEM',
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'SUCCESS'
      });

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  },

  // Verify Token
  verifyToken: async (req, res) => {
    try {
      res.json({
        success: true,
        message: 'Token is valid',
        data: {
          admin: req.admin
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Token verification failed',
        error: error.message
      });
    }
  },

  // Register Admin (Public for demo, protected in production)
  register: async (req, res) => {
    try {
      const adminData = req.body;

      // Set default access level if not provided
      if (!adminData.access_level) {
        adminData.access_level = 'admin';
      }

      // Create admin
      await Admin.create(adminData);

      // Log activity (req.admin may not exist for public signup)
      try {
      await ActivityLog.create({
          admin_id: req.admin?.admin_id || adminData.admin_id,
        action: 'CREATE_ADMIN',
        entity_type: 'SYSTEM',
        entity_id: adminData.admin_id,
        details: {
          new_admin_email: adminData.email,
          access_level: adminData.access_level
        },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status: 'SUCCESS'
      });
      } catch (logError) {
        console.log('Activity log skipped:', logError.message);
      }

      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: {
          admin_id: adminData.admin_id,
          email: adminData.email
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Check for duplicate email
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Email or Admin ID already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }
};

module.exports = authController;
