import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  People,
  Flight,
  Hotel,
  DirectionsCar,
  AttachMoney,
  TrendingUp,
  BookOnline,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { analyticsStore, usersStore, bookingsStore, billingStore, flightsStore, hotelsStore, carsStore } from '../services/sharedData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={600}>{value}</Typography>
          {subtitle && (
            <Typography variant="caption" color="success.main">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            bgcolor: color,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalBookings: 0,
    totalListings: 0,
    totalFlights: 0,
    totalHotels: 0,
    totalCars: 0,
    pendingBookings: 0,
    completedBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueByType, setRevenueByType] = useState([]);
  const [bookingsOverTime, setBookingsOverTime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Set up interval to refresh data
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchStats = () => {
    try {
      // Get stats from shared data store
      const analyticsStats = analyticsStore.getStats();
      setStats(analyticsStats);
      
      // Get recent bookings
      const allBookings = bookingsStore.getAll();
      const recent = allBookings
        .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
        .slice(0, 5);
      setRecentBookings(recent);
      
      // Get revenue by type for pie chart
      const revenueData = analyticsStore.getRevenueByType();
      setRevenueByType(revenueData);
      
      // Get bookings over time for bar chart
      const timeData = analyticsStore.getBookingsOverTime();
      setBookingsOverTime(timeData);
      
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
        Dashboard
      </Typography>
        <Chip 
          icon={<TrendingUp />} 
          label="Live Data" 
          color="success" 
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={loading ? '...' : stats.totalUsers.toLocaleString()}
            icon={<People sx={{ color: 'white', fontSize: 32 }} />}
            color="primary.main"
            subtitle="Registered travelers"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={loading ? '...' : formatCurrency(stats.totalRevenue)}
            icon={<AttachMoney sx={{ color: 'white', fontSize: 32 }} />}
            color="success.main"
            subtitle="From all bookings"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={loading ? '...' : stats.totalBookings.toLocaleString()}
            icon={<BookOnline sx={{ color: 'white', fontSize: 32 }} />}
            color="info.main"
            subtitle={`${stats.completedBookings} completed`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Listings"
            value={loading ? '...' : stats.totalListings.toLocaleString()}
            icon={<Hotel sx={{ color: 'white', fontSize: 32 }} />}
            color="warning.main"
            subtitle={`${stats.totalFlights} flights, ${stats.totalHotels} hotels, ${stats.totalCars} cars`}
          />
        </Grid>
      </Grid>

      {/* Listings Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Flight color="primary" />
                <Box>
                  <Typography variant="h5" fontWeight={600}>{stats.totalFlights}</Typography>
                  <Typography variant="body2" color="textSecondary">Flights</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Hotel color="secondary" />
                <Box>
                  <Typography variant="h5" fontWeight={600}>{stats.totalHotels}</Typography>
                  <Typography variant="body2" color="textSecondary">Hotels</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DirectionsCar color="success" />
                <Box>
                  <Typography variant="h5" fontWeight={600}>{stats.totalCars}</Typography>
                  <Typography variant="body2" color="textSecondary">Cars</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue by Type Pie Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Revenue by Booking Type</Typography>
            {revenueByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={revenueByType}
                    dataKey="revenue"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ type, revenue }) => `${type}: ${formatCurrency(revenue)}`}
                  >
                    {revenueByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                <Typography color="textSecondary">No revenue data yet. Make some bookings!</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Bookings Over Time Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 350 }}>
            <Typography variant="h6" gutterBottom>Bookings Over Time</Typography>
            {bookingsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bookingsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}>
                <Typography color="textSecondary">No booking data yet. Make some bookings!</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        </Grid>

      {/* Recent Bookings */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Bookings</Typography>
            <Divider sx={{ mb: 2 }} />
            {recentBookings.length > 0 ? (
              <List>
                {recentBookings.map((booking, index) => (
                  <ListItem key={index} divider={index < recentBookings.length - 1}>
                    <ListItemIcon>
                      {booking.type === 'flights' || booking.booking_type === 'FLIGHT' ? (
                        <Flight color="primary" />
                      ) : booking.type === 'hotels' || booking.booking_type === 'HOTEL' ? (
                        <Hotel color="secondary" />
                      ) : (
                        <DirectionsCar color="success" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={booking.name || booking.confirmationNumber || `Booking ${index + 1}`}
                      secondary={`User: ${booking.user_id || 'N/A'} • ${new Date(booking.createdAt || booking.created_at).toLocaleDateString()}`}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1" fontWeight={600}>
                        {formatCurrency(booking.totalPrice || booking.total_price || 0)}
            </Typography>
                      <Chip
                        size="small"
                        label={booking.status || 'confirmed'}
                        color={booking.status === 'confirmed' || booking.status === 'COMPLETED' ? 'success' : 'warning'}
                        icon={booking.status === 'confirmed' ? <CheckCircle /> : <Pending />}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  No bookings yet. Bookings made on the traveler site (port 3001) will appear here!
            </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
