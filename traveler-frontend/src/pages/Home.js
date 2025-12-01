import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Paper,
  Card,
  CardContent,
  CardMedia,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Flight,
  Hotel,
  DirectionsCar,
  Search,
  LocationOn,
  CalendarMonth,
  Person,
  SwapHoriz,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const popularCities = [
  'New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Miami',
  'Las Vegas', 'Seattle', 'Boston', 'Denver', 'Austin',
  'San Jose', 'Dallas', 'Atlanta', 'Phoenix', 'Orlando'
];

const popularDestinations = [
  { city: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400', price: 199 },
  { city: 'Los Angeles', image: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=400', price: 249 },
  { city: 'Miami', image: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400', price: 179 },
  { city: 'Las Vegas', image: 'https://images.unsplash.com/photo-1605833556294-ea5c7a74f57d?w=400', price: 159 },
];

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'flights';
  
  const [activeTab, setActiveTab] = useState(
    initialTab === 'hotels' ? 1 : initialTab === 'cars' ? 2 : 0
  );
  
  // Flight search state
  const [flightSearch, setFlightSearch] = useState({
    from: '',
    to: '',
    departDate: null,
    returnDate: null,
    passengers: 1,
  });

  // Hotel search state
  const [hotelSearch, setHotelSearch] = useState({
    destination: '',
    checkIn: null,
    checkOut: null,
    guests: 1,
    rooms: 1,
  });

  // Car search state
  const [carSearch, setCarSearch] = useState({
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: null,
    dropoffDate: null,
  });

  const handleSearch = () => {
    let searchQuery = '';
    
    if (activeTab === 0) {
      searchQuery = `type=flights&from=${flightSearch.from}&to=${flightSearch.to}&date=${flightSearch.departDate?.toISOString() || ''}&passengers=${flightSearch.passengers}`;
    } else if (activeTab === 1) {
      searchQuery = `type=hotels&destination=${hotelSearch.destination}&checkIn=${hotelSearch.checkIn?.toISOString() || ''}&checkOut=${hotelSearch.checkOut?.toISOString() || ''}&guests=${hotelSearch.guests}`;
    } else {
      searchQuery = `type=cars&pickup=${carSearch.pickupLocation}&dropoff=${carSearch.dropoffLocation}&pickupDate=${carSearch.pickupDate?.toISOString() || ''}&dropoffDate=${carSearch.dropoffDate?.toISOString() || ''}`;
    }
    
    navigate(`/search?${searchQuery}`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            color: 'white',
            py: { xs: 6, md: 10 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h2"
              align="center"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '2rem', md: '3rem' },
              }}
            >
              Find Your Perfect Trip
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{ opacity: 0.8, mb: 4, fontWeight: 400 }}
            >
              Search hundreds of travel sites at once
            </Typography>

            {/* Search Box */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                maxWidth: 1000,
                mx: 'auto',
              }}
            >
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{ mb: 3 }}
                TabIndicatorProps={{
                  sx: { backgroundColor: 'primary.main', height: 3, borderRadius: 2 },
                }}
              >
                <Tab icon={<Flight />} label="Flights" iconPosition="start" />
                <Tab icon={<Hotel />} label="Hotels" iconPosition="start" />
                <Tab icon={<DirectionsCar />} label="Cars" iconPosition="start" />
              </Tabs>

              {/* Flight Search */}
              {activeTab === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={popularCities}
                      value={flightSearch.from}
                      onChange={(e, v) => setFlightSearch({ ...flightSearch, from: v || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="From"
                          placeholder="Departure city"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <LocationOn color="action" sx={{ ml: 1 }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={popularCities}
                      value={flightSearch.to}
                      onChange={(e, v) => setFlightSearch({ ...flightSearch, to: v || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="To"
                          placeholder="Arrival city"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <LocationOn color="action" sx={{ ml: 1 }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="Depart"
                      value={flightSearch.departDate}
                      onChange={(date) => setFlightSearch({ ...flightSearch, departDate: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="Return"
                      value={flightSearch.returnDate}
                      onChange={(date) => setFlightSearch({ ...flightSearch, returnDate: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<Search />}
                      onClick={handleSearch}
                      sx={{ height: 56 }}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              )}

              {/* Hotel Search */}
              {activeTab === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={popularCities}
                      value={hotelSearch.destination}
                      onChange={(e, v) => setHotelSearch({ ...hotelSearch, destination: v || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Destination"
                          placeholder="Where are you going?"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <LocationOn color="action" sx={{ ml: 1 }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="Check-in"
                      value={hotelSearch.checkIn}
                      onChange={(date) => setHotelSearch({ ...hotelSearch, checkIn: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="Check-out"
                      value={hotelSearch.checkOut}
                      onChange={(date) => setHotelSearch({ ...hotelSearch, checkOut: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <TextField
                      fullWidth
                      label="Guests"
                      type="number"
                      value={hotelSearch.guests}
                      onChange={(e) => setHotelSearch({ ...hotelSearch, guests: e.target.value })}
                      InputProps={{
                        startAdornment: <Person color="action" sx={{ mr: 1 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<Search />}
                      onClick={handleSearch}
                      sx={{ height: 56 }}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              )}

              {/* Car Search */}
              {activeTab === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={popularCities}
                      value={carSearch.pickupLocation}
                      onChange={(e, v) => setCarSearch({ ...carSearch, pickupLocation: v || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Pick-up Location"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <LocationOn color="action" sx={{ ml: 1 }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      options={popularCities}
                      value={carSearch.dropoffLocation}
                      onChange={(e, v) => setCarSearch({ ...carSearch, dropoffLocation: v || '' })}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Drop-off Location"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: <LocationOn color="action" sx={{ ml: 1 }} />,
                          }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="Pick-up Date"
                      value={carSearch.pickupDate}
                      onChange={(date) => setCarSearch({ ...carSearch, pickupDate: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={2}>
                    <DatePicker
                      label="Drop-off Date"
                      value={carSearch.dropoffDate}
                      onChange={(date) => setCarSearch({ ...carSearch, dropoffDate: date })}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<Search />}
                      onClick={handleSearch}
                      sx={{ height: 56 }}
                    >
                      Search
                    </Button>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Container>
        </Box>

        {/* Popular Destinations */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
            Popular Destinations
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Explore trending destinations and find the best deals
          </Typography>

          <Grid container spacing={3}>
            {popularDestinations.map((dest, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  className="card-hover"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/search?type=flights&to=${dest.city}`)}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={dest.image}
                    alt={dest.city}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="h6" fontWeight={600}>
                      {dest.city}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Flights from
                    </Typography>
                    <Typography variant="h6" color="primary.main" fontWeight={700}>
                      ${dest.price}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* Features Section */}
        <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" fontWeight={600} align="center" sx={{ mb: 6 }}>
              Why Choose Kayak?
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <Search sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Search Hundreds of Sites
                  </Typography>
                  <Typography color="text.secondary">
                    Compare prices from hundreds of travel sites with one search
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <SwapHoriz sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Best Price Guarantee
                  </Typography>
                  <Typography color="text.secondary">
                    Find the lowest prices on flights, hotels, and car rentals
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <CalendarMonth sx={{ fontSize: 40, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Flexible Booking
                  </Typography>
                  <Typography color="text.secondary">
                    Free cancellation and flexible date options available
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default Home;

