import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Flight,
  Hotel,
  DirectionsCar,
  CalendarMonth,
  LocationOn,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const mockBookings = [
  {
    id: 'BK001',
    type: 'flight',
    status: 'confirmed',
    name: 'United Airlines',
    from: 'San Jose',
    to: 'New York',
    date: 'Dec 15, 2025',
    price: 329,
  },
  {
    id: 'BK002',
    type: 'hotel',
    status: 'confirmed',
    name: 'Grand Hyatt',
    location: 'New York, NY',
    checkIn: 'Dec 15, 2025',
    checkOut: 'Dec 18, 2025',
    price: 867,
  },
  {
    id: 'BK003',
    type: 'car',
    status: 'completed',
    name: 'Toyota Camry',
    company: 'Hertz',
    pickup: 'Dec 10, 2025',
    dropoff: 'Dec 12, 2025',
    price: 195,
  },
];

const MyBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>Please sign in to view your bookings</Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>Sign In</Button>
      </Container>
    );
  }

  const getIcon = (type) => {
    if (type === 'flight') return <Flight sx={{ color: 'primary.main' }} />;
    if (type === 'hotel') return <Hotel sx={{ color: 'primary.main' }} />;
    return <DirectionsCar sx={{ color: 'primary.main' }} />;
  };

  const getStatusColor = (status) => {
    if (status === 'confirmed') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'completed') return 'default';
    return 'error';
  };

  const filteredBookings = tabValue === 0 
    ? mockBookings 
    : mockBookings.filter(b => 
        tabValue === 1 ? b.status === 'confirmed' : b.status === 'completed'
      );

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
          My Bookings
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          View and manage your travel reservations
        </Typography>

        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 4 }}>
          <Tab label="All Bookings" />
          <Tab label="Upcoming" />
          <Tab label="Past" />
        </Tabs>

        {filteredBookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">No bookings found</Typography>
            <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
              Start Booking
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredBookings.map((booking) => (
              <Grid item xs={12} key={booking.id}>
                <Card className="card-hover">
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={1}>
                        {getIcon(booking.type)}
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" fontWeight={600}>
                          {booking.name}
                        </Typography>
                        {booking.type === 'flight' && (
                          <Typography color="text.secondary">
                            {booking.from} → {booking.to}
                          </Typography>
                        )}
                        {booking.type === 'hotel' && (
                          <Typography color="text.secondary">
                            {booking.location}
                          </Typography>
                        )}
                        {booking.type === 'car' && (
                          <Typography color="text.secondary">
                            {booking.company}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarMonth fontSize="small" color="action" />
                          <Typography variant="body2">
                            {booking.date || booking.checkIn || booking.pickup}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Chip
                          label={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          color={getStatusColor(booking.status)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={2} sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={600} color="primary.main">
                          ${booking.price}
                        </Typography>
                        <Button size="small" sx={{ mt: 1 }}>View Details</Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default MyBookings;

