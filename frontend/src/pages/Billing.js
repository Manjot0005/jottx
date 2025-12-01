import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  TextField,
  Grid,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  InputAdornment,
} from '@mui/material';
import { Search, Refresh, Receipt, AttachMoney, TrendingUp } from '@mui/icons-material';
import { billingStore, analyticsStore } from '../services/sharedData';

const Billing = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [stats, setStats] = useState({ totalRevenue: 0, totalBookings: 0 });
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingType, setBookingType] = useState('');

  useEffect(() => {
    fetchBilling();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchBilling, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBilling = () => {
    setLoading(true);
    try {
      const allBills = billingStore.getAll();
      setBills(allBills);
      
      const analyticsStats = analyticsStore.getStats();
      setStats({
        totalRevenue: analyticsStats.totalRevenue,
        totalBookings: analyticsStats.totalBookings,
      });
    } catch (error) {
      console.error('Error fetching billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const filtered = billingStore.search({
      startDate,
      endDate,
      booking_type: bookingType || undefined,
    });
    setBills(filtered);
  };

  const handleReset = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setBookingType('');
    fetchBilling();
  };

  // Filter bills based on search query
  const filteredBills = bills.filter(bill => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (bill.user_id || '').toLowerCase().includes(query) ||
      (bill.booking_id || '').toLowerCase().includes(query) ||
      (bill.booking_type || '').toLowerCase().includes(query)
    );
  });

  const paginatedBills = filteredBills.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      case 'REFUNDED': return 'info';
      default: return 'default';
    }
  };

  const getTypeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'FLIGHT': return 'primary';
      case 'HOTEL': return 'secondary';
      case 'CAR': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={600}>
          Billing & Transactions
        </Typography>
        <Button startIcon={<Refresh />} onClick={fetchBilling} variant="outlined">
          Refresh
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Showing billing records from bookings made on the traveler site (port 3001)
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">Total Revenue</Typography>
                  <Typography variant="h4" fontWeight={600}>{formatCurrency(stats.totalRevenue)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Receipt color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">Total Transactions</Typography>
                  <Typography variant="h4" fontWeight={600}>{bills.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">Avg Transaction</Typography>
                  <Typography variant="h4" fontWeight={600}>
                    {formatCurrency(bills.length > 0 ? stats.totalRevenue / bills.length : 0)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Search & Filter</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by user ID, booking ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Booking Type"
              value={bookingType}
              onChange={(e) => setBookingType(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="">All Types</option>
              <option value="FLIGHT">Flights</option>
              <option value="HOTEL">Hotels</option>
              <option value="CAR">Cars</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSearch}>Search</Button>
              <Button variant="outlined" onClick={handleReset}>Reset</Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Billing Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>Billing ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    No billing records yet. Make bookings on the traveler site to see transactions here!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedBills.map((bill, index) => (
                <TableRow key={bill.billing_id || index} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {bill.billing_id || `BIL-${index + 1}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {bill.user_id || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={bill.booking_type || 'N/A'}
                      color={getTypeColor(bill.booking_type)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {bill.booking_id || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(bill.transaction_date)}</TableCell>
                  <TableCell>
                    <Typography fontWeight={600} color="success.main">
                      {formatCurrency(bill.total_amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>{bill.payment_method || 'Credit Card'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={bill.transaction_status || 'COMPLETED'}
                      color={getStatusColor(bill.transaction_status)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredBills.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Container>
  );
};

export default Billing;
