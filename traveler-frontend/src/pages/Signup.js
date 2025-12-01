import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhone = (phone) => {
    // Remove all non-digits
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First name and last name are required');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.phone && !validatePhone(formData.phone)) {
      setError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    // Check if email already exists
    const storedUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    if (storedUsers.find(u => u.email === formData.email)) {
      setError('An account with this email already exists. Please login instead.');
      setLoading(false);
      return;
    }

    // Create new user
    const userId = 'USR-' + Date.now();
    const newUser = {
      user_id: userId,
      email: formData.email,
      password: formData.password, // In production, this would be hashed
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone.replace(/\D/g, ''), // Store only digits
      created_at: new Date().toISOString(),
    };

    // Save to localStorage
    storedUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(storedUsers));

    // Initialize empty bookings for this user
    const userBookings = JSON.parse(localStorage.getItem('userBookings') || '{}');
    userBookings[userId] = [];
    localStorage.setItem('userBookings', JSON.stringify(userBookings));

    // Login the new user
    const userData = {
      user_id: userId,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
      phone: newUser.phone,
    };
    login(userData, 'token-' + userId);
    
    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  const formatPhoneNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    const limited = digits.slice(0, 10);
    // Format as (XXX) XXX-XXXX
    if (limited.length >= 6) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
    } else if (limited.length >= 3) {
      return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
    }
    return limited;
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 6, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <PersonAdd sx={{ fontSize: 40, mr: 1, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight={600}>
              Create Account
            </Typography>
          </Box>

          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Join Kayak and start booking your adventures
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  error={error.includes('name')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  error={error.includes('name')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  error={error.includes('email')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                  placeholder="(555) 123-4567"
                  helperText="Must be 10 digits"
                  error={error.includes('Phone')}
                  inputProps={{ maxLength: 14 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  helperText="Minimum 6 characters"
                  error={error.includes('Password') || error.includes('password')}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  error={error.includes('match')}
                />
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <Typography align="center" sx={{ mt: 3 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#ff6b35', fontWeight: 600 }}>
              Sign In
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;
