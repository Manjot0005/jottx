import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Demo admin accounts
const DEMO_ADMINS = [
  {
    email: 'superadmin@kayak.com',
    password: 'Admin@123',
    admin_id: 'ADM-001',
    first_name: 'Super',
    last_name: 'Admin',
    access_level: 'super_admin'
  },
  {
    email: 'admin@kayak.com',
    password: 'Admin@123',
    admin_id: 'ADM-002',
    first_name: 'Admin',
    last_name: 'User',
    access_level: 'admin'
  },
  {
    email: 'manager@kayak.com',
    password: 'Admin@123',
    admin_id: 'ADM-003',
    first_name: 'Manager',
    last_name: 'User',
    access_level: 'manager'
  }
];

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const adminData = localStorage.getItem('adminUser');
      if (adminData) {
        setAdmin(JSON.parse(adminData));
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const { email, password } = credentials;

      // Check against demo accounts
      const foundAdmin = DEMO_ADMINS.find(
        a => a.email === email && a.password === password
      );

      if (foundAdmin) {
        // Remove password before storing
        const { password: _, ...adminWithoutPassword } = foundAdmin;
        
        // Store in localStorage
        localStorage.setItem('adminUser', JSON.stringify(adminWithoutPassword));
        localStorage.setItem('adminToken', 'demo-token-' + Date.now());
        
        setAdmin(adminWithoutPassword);
        
        return { 
          success: true,
          message: 'Login successful' 
        };
      } else {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Login failed. Please try again.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
