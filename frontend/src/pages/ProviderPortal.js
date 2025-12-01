import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Alert,
  Card,
  CardContent,
  MenuItem,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Flight,
  Hotel,
  DirectionsCar,
  Add,
  Business,
  Analytics,
} from '@mui/icons-material';

/**
 * PROVIDER PORTAL
 * 
 * This is where PROVIDERS (airlines, hotels, car rental companies) 
 * can login and add their listings to Kayak.
 * 
 * Separate from Admin Panel which is for system administrators.
 */

const ProviderPortal = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [providerType, setProviderType] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [providerInfo, setProviderInfo] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    companyName: '',
  });

  // Flight listing form
  const [flightForm, setFlightForm] = useState({
    flightNumber: '',
    airline: '',
    departureAirport: '',
    arrivalAirport: '',
    departureTime: '',
    arrivalTime: '',
    duration: '',
    flightClass: 'Economy',
    ticketPrice: '',
    availableSeats: '',
  });

  // Hotel listing form
  const [hotelForm, setHotelForm] = useState({
    hotelName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    starRating: 3,
    roomType: 'Standard',
    pricePerNight: '',
    amenities: [],
    totalRooms: '',
  });

  // Car listing form
  const [carForm, setCarForm] = useState({
    carType: 'Sedan',
    model: '',
    year: new Date().getFullYear(),
    transmission: 'Automatic',
    seats: 5,
    dailyPrice: '',
    availableUnits: '',
  });

  const [myListings, setMyListings] = useState([]);

  const handleProviderLogin = () => {
    if (!loginForm.email || !loginForm.password || !loginForm.companyName || !providerType) {
      setError('Please fill all fields and select provider type');
      return;
    }

    // Simulate login
    setProviderInfo({
      id: 'PRV-' + Date.now(),
      email: loginForm.email,
      companyName: loginForm.companyName,
      type: providerType,
    });
    setIsLoggedIn(true);
    setError('');
  };

  const handleAddFlight = () => {
    if (!flightForm.flightNumber || !flightForm.ticketPrice) {
      setError('Please fill required fields');
      return;
    }

    const newListing = {
      id: 'FLT-' + Date.now(),
      type: 'flight',
      ...flightForm,
      provider: providerInfo.companyName,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    setMyListings([...myListings, newListing]);
    setSuccess('Flight listing added successfully!');
    setFlightForm({
      flightNumber: '',
      airline: providerInfo.companyName,
      departureAirport: '',
      arrivalAirport: '',
      departureTime: '',
      arrivalTime: '',
      duration: '',
      flightClass: 'Economy',
      ticketPrice: '',
      availableSeats: '',
    });

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddHotel = () => {
    if (!hotelForm.hotelName || !hotelForm.pricePerNight) {
      setError('Please fill required fields');
      return;
    }

    const newListing = {
      id: 'HTL-' + Date.now(),
      type: 'hotel',
      ...hotelForm,
      provider: providerInfo.companyName,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    setMyListings([...myListings, newListing]);
    setSuccess('Hotel listing added successfully!');

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddCar = () => {
    if (!carForm.model || !carForm.dailyPrice) {
      setError('Please fill required fields');
      return;
    }

    const newListing = {
      id: 'CAR-' + Date.now(),
      type: 'car',
      ...carForm,
      provider: providerInfo.companyName,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    setMyListings([...myListings, newListing]);
    setSuccess('Car listing added successfully!');

    setTimeout(() => setSuccess(''), 3000);
  };

  // Provider Login Form
  if (!isLoggedIn) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
              <Business sx={{ fontSize: 40, mr: 1, color: 'primary.main' }} />
              <Typography variant="h4" fontWeight={600}>
                Provider Portal
              </Typography>
            </Box>

            <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
              Airlines, Hotels & Car Rental Companies - Login to manage your listings
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Provider Type"
                  value={providerType}
                  onChange={(e) => setProviderType(e.target.value)}
                  required
                >
                  <MenuItem value="airline">✈️ Airline</MenuItem>
                  <MenuItem value="hotel">🏨 Hotel Chain</MenuItem>
                  <MenuItem value="car_rental">🚗 Car Rental Company</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={loginForm.companyName}
                  onChange={(e) => setLoginForm({ ...loginForm, companyName: e.target.value })}
                  placeholder="e.g., United Airlines, Hilton, Hertz"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleProviderLogin}
                >
                  Login to Provider Portal
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Alert severity="info">
              <strong>Providers:</strong> This portal is for businesses (airlines, hotels, car rentals) to add their listings to Kayak. If you're a system administrator, go to the <a href="/login">Admin Panel</a>.
            </Alert>
          </Paper>
        </Box>
      </Container>
    );
  }

  // Provider Dashboard
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            {providerInfo.companyName}
          </Typography>
          <Chip 
            label={providerType === 'airline' ? '✈️ Airline' : providerType === 'hotel' ? '🏨 Hotel' : '🚗 Car Rental'} 
            color="primary" 
            sx={{ mt: 1 }}
          />
        </Box>
        <Button variant="outlined" onClick={() => setIsLoggedIn(false)}>
          Logout
        </Button>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<Add />} label="Add Listing" />
        <Tab icon={<Analytics />} label="My Listings" />
      </Tabs>

      {/* Add Listing Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 4 }}>
          {/* Airline Form */}
          {providerType === 'airline' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Flight color="primary" />
                <Typography variant="h5" fontWeight={600}>Add New Flight</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Flight Number"
                    value={flightForm.flightNumber}
                    onChange={(e) => setFlightForm({ ...flightForm, flightNumber: e.target.value })}
                    placeholder="UA-123"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Airline Name"
                    value={flightForm.airline || providerInfo.companyName}
                    onChange={(e) => setFlightForm({ ...flightForm, airline: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Departure Airport"
                    value={flightForm.departureAirport}
                    onChange={(e) => setFlightForm({ ...flightForm, departureAirport: e.target.value })}
                    placeholder="SJC"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Arrival Airport"
                    value={flightForm.arrivalAirport}
                    onChange={(e) => setFlightForm({ ...flightForm, arrivalAirport: e.target.value })}
                    placeholder="JFK"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Departure Time"
                    type="time"
                    value={flightForm.departureTime}
                    onChange={(e) => setFlightForm({ ...flightForm, departureTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Arrival Time"
                    type="time"
                    value={flightForm.arrivalTime}
                    onChange={(e) => setFlightForm({ ...flightForm, arrivalTime: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Duration"
                    value={flightForm.duration}
                    onChange={(e) => setFlightForm({ ...flightForm, duration: e.target.value })}
                    placeholder="5h 30m"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Flight Class"
                    value={flightForm.flightClass}
                    onChange={(e) => setFlightForm({ ...flightForm, flightClass: e.target.value })}
                  >
                    <MenuItem value="Economy">Economy</MenuItem>
                    <MenuItem value="Business">Business</MenuItem>
                    <MenuItem value="First">First Class</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Ticket Price ($)"
                    type="number"
                    value={flightForm.ticketPrice}
                    onChange={(e) => setFlightForm({ ...flightForm, ticketPrice: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Available Seats"
                    type="number"
                    value={flightForm.availableSeats}
                    onChange={(e) => setFlightForm({ ...flightForm, availableSeats: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" size="large" onClick={handleAddFlight}>
                    Add Flight Listing
                  </Button>
                </Grid>
              </Grid>
            </>
          )}

          {/* Hotel Form */}
          {providerType === 'hotel' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Hotel color="primary" />
                <Typography variant="h5" fontWeight={600}>Add New Hotel</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Hotel Name"
                    value={hotelForm.hotelName}
                    onChange={(e) => setHotelForm({ ...hotelForm, hotelName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={hotelForm.address}
                    onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={hotelForm.city}
                    onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={hotelForm.state}
                    onChange={(e) => setHotelForm({ ...hotelForm, state: e.target.value })}
                    placeholder="CA"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={hotelForm.zipCode}
                    onChange={(e) => setHotelForm({ ...hotelForm, zipCode: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Star Rating"
                    value={hotelForm.starRating}
                    onChange={(e) => setHotelForm({ ...hotelForm, starRating: e.target.value })}
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <MenuItem key={n} value={n}>{'⭐'.repeat(n)}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Price Per Night ($)"
                    type="number"
                    value={hotelForm.pricePerNight}
                    onChange={(e) => setHotelForm({ ...hotelForm, pricePerNight: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Total Rooms"
                    type="number"
                    value={hotelForm.totalRooms}
                    onChange={(e) => setHotelForm({ ...hotelForm, totalRooms: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" size="large" onClick={handleAddHotel}>
                    Add Hotel Listing
                  </Button>
                </Grid>
              </Grid>
            </>
          )}

          {/* Car Rental Form */}
          {providerType === 'car_rental' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <DirectionsCar color="primary" />
                <Typography variant="h5" fontWeight={600}>Add New Car</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Car Type"
                    value={carForm.carType}
                    onChange={(e) => setCarForm({ ...carForm, carType: e.target.value })}
                  >
                    <MenuItem value="Economy">Economy</MenuItem>
                    <MenuItem value="Compact">Compact</MenuItem>
                    <MenuItem value="Sedan">Sedan</MenuItem>
                    <MenuItem value="SUV">SUV</MenuItem>
                    <MenuItem value="Luxury">Luxury</MenuItem>
                    <MenuItem value="Van">Van</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Model"
                    value={carForm.model}
                    onChange={(e) => setCarForm({ ...carForm, model: e.target.value })}
                    placeholder="Toyota Camry"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Year"
                    type="number"
                    value={carForm.year}
                    onChange={(e) => setCarForm({ ...carForm, year: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="Transmission"
                    value={carForm.transmission}
                    onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value })}
                  >
                    <MenuItem value="Automatic">Automatic</MenuItem>
                    <MenuItem value="Manual">Manual</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Seats"
                    type="number"
                    value={carForm.seats}
                    onChange={(e) => setCarForm({ ...carForm, seats: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Daily Price ($)"
                    type="number"
                    value={carForm.dailyPrice}
                    onChange={(e) => setCarForm({ ...carForm, dailyPrice: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Available Units"
                    type="number"
                    value={carForm.availableUnits}
                    onChange={(e) => setCarForm({ ...carForm, availableUnits: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" size="large" onClick={handleAddCar}>
                    Add Car Listing
                  </Button>
                </Grid>
              </Grid>
            </>
          )}
        </Paper>
      )}

      {/* My Listings Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            My Listings ({myListings.length})
          </Typography>

          {myListings.length === 0 ? (
            <Alert severity="info">No listings yet. Add your first listing!</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>{listing.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={listing.type} 
                        size="small" 
                        color={listing.type === 'flight' ? 'primary' : listing.type === 'hotel' ? 'secondary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {listing.type === 'flight' && `${listing.flightNumber}: ${listing.departureAirport} → ${listing.arrivalAirport}`}
                      {listing.type === 'hotel' && `${listing.hotelName}, ${listing.city}`}
                      {listing.type === 'car' && `${listing.carType} - ${listing.model}`}
                    </TableCell>
                    <TableCell>
                      ${listing.ticketPrice || listing.pricePerNight || listing.dailyPrice}
                      {listing.type === 'hotel' && '/night'}
                      {listing.type === 'car' && '/day'}
                    </TableCell>
                    <TableCell>
                      <Chip label={listing.status} color="success" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default ProviderPortal;

