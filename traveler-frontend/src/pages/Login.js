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
  Divider,
} from '@mui/material';
import { Login as LoginIcon, Google, Facebook } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Demo login - accept any credentials
    setTimeout(() => {
      const userData = {
        user_id: 'USR-001',
        email: formData.email,
        first_name: formData.email.split('@')[0],
        last_name: 'User',
      };
      login(userData, 'demo-token-123');
      navigate('/');
    }, 1000);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <LoginIcon sx={{ fontSize: 40, mr: 1, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight={600}>
              Sign In
            </Typography>
          </Box>

          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            Welcome back! Sign in to access your bookings.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Divider sx={{ my: 3 }}>or continue with</Divider>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button fullWidth variant="outlined" startIcon={<Google />}>
              Google
            </Button>
            <Button fullWidth variant="outlined" startIcon={<Facebook />}>
              Facebook
            </Button>
          </Box>

          <Typography align="center" sx={{ mt: 3 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#ff6b35', fontWeight: 600 }}>
              Sign Up
            </Link>
          </Typography>

          <Alert severity="info" sx={{ mt: 3 }}>
            <strong>Demo:</strong> Enter any email and password to login
          </Alert>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;

