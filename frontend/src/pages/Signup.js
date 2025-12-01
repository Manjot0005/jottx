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
  MenuItem,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import axios from 'axios';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    admin_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    address: '',
    city: '',
    state: 'CA',
    zip_code: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!formData.admin_id || formData.admin_id.length < 3) {
      setError('Admin ID must be at least 3 characters (e.g., ADM-004)');
      setLoading(false);
      return;
    }

    if (!formData.first_name || formData.first_name.length < 2) {
      setError('First name must be at least 2 characters');
      setLoading(false);
      return;
    }

    if (!formData.last_name || formData.last_name.length < 2) {
      setError('Last name must be at least 2 characters');
      setLoading(false);
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
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

    try {
      const { confirmPassword, ...signupData } = formData;
      // Always set access_level to 'admin' for new registrations
      signupData.access_level = 'admin';
      
      await axios.post('http://localhost:5001/api/admin/auth/register', signupData);
      
      setSuccess('Admin registered successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Registration failed';
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        setError(errors.map(e => e.msg).join('. '));
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonAdd sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography component="h1" variant="h4">
              Register New Admin
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Admin ID"
                  name="admin_id"
                  placeholder="ADM-004"
                  value={formData.admin_id}
                  onChange={handleChange}
                  helperText="Min 3 characters (e.g., ADM-004)"
                  error={formData.admin_id.length > 0 && formData.admin_id.length < 3}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  helperText="Min 2 characters"
                  error={formData.first_name.length > 0 && formData.first_name.length < 2}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  helperText="Min 2 characters"
                  error={formData.last_name.length > 0 && formData.last_name.length < 2}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  helperText="Min 6 characters"
                  error={formData.password.length > 0 && formData.password.length < 6}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword}
                  helperText={formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword ? "Passwords don't match" : ""}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone_number"
                  placeholder="4151234567"
                  value={formData.phone_number}
                  onChange={handleChange}
                  helperText="10 digits, no dashes"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  select
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                >
                  {US_STATES.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  name="zip_code"
                  placeholder="95112"
                  value={formData.zip_code}
                  onChange={handleChange}
                  helperText="5 digits (e.g., 95112)"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? 'Registering...' : 'Register Admin'}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2">
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#ff6b35' }}>
                      Sign In
                    </Link>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Signup;
