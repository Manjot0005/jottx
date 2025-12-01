import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
} from '@mui/material';
import {
  Flight,
  Hotel,
  DirectionsCar,
  AccessTime,
  Star,
  FilterList,
} from '@mui/icons-material';

// Mock data for demo
const mockFlights = [
  { id: 1, airline: 'United Airlines', from: 'San Jose', to: 'New York', departTime: '08:00', arriveTime: '16:30', duration: '5h 30m', price: 299, stops: 0 },
  { id: 2, airline: 'Delta', from: 'San Jose', to: 'New York', departTime: '10:15', arriveTime: '19:00', duration: '5h 45m', price: 279, stops: 1 },
  { id: 3, airline: 'American Airlines', from: 'San Jose', to: 'New York', departTime: '14:00', arriveTime: '22:15', duration: '5h 15m', price: 329, stops: 0 },
  { id: 4, airline: 'JetBlue', from: 'San Jose', to: 'New York', departTime: '06:30', arriveTime: '15:00', duration: '5h 30m', price: 259, stops: 0 },
  { id: 5, airline: 'Southwest', from: 'San Jose', to: 'New York', departTime: '12:00', arriveTime: '21:30', duration: '6h 30m', price: 199, stops: 2 },
];

const mockHotels = [
  { id: 1, name: 'Grand Hyatt', location: 'New York, NY', rating: 4.8, reviews: 2341, price: 289, amenities: ['WiFi', 'Pool', 'Gym'] },
  { id: 2, name: 'Marriott Times Square', location: 'New York, NY', rating: 4.5, reviews: 1892, price: 259, amenities: ['WiFi', 'Restaurant', 'Spa'] },
  { id: 3, name: 'Hilton Midtown', location: 'New York, NY', rating: 4.6, reviews: 3102, price: 319, amenities: ['WiFi', 'Pool', 'Business Center'] },
  { id: 4, name: 'Holiday Inn Express', location: 'New York, NY', rating: 4.2, reviews: 1567, price: 149, amenities: ['WiFi', 'Breakfast'] },
  { id: 5, name: 'The Plaza', location: 'New York, NY', rating: 4.9, reviews: 4521, price: 599, amenities: ['WiFi', 'Spa', 'Fine Dining', 'Concierge'] },
];

const mockCars = [
  { id: 1, name: 'Economy', model: 'Toyota Corolla', company: 'Hertz', price: 45, seats: 5, bags: 2 },
  { id: 2, name: 'Compact', model: 'Honda Civic', company: 'Enterprise', price: 52, seats: 5, bags: 2 },
  { id: 3, name: 'Midsize', model: 'Toyota Camry', company: 'National', price: 65, seats: 5, bags: 3 },
  { id: 4, name: 'SUV', model: 'Ford Explorer', company: 'Avis', price: 89, seats: 7, bags: 4 },
  { id: 5, name: 'Luxury', model: 'BMW 5 Series', company: 'Budget', price: 129, seats: 5, bags: 3 },
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'flights';
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('price');

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      if (type === 'flights') setResults(mockFlights);
      else if (type === 'hotels') setResults(mockHotels);
      else setResults(mockCars);
      setLoading(false);
    }, 1000);
  }, [type]);

  const handleBooking = (item) => {
    navigate(`/booking/${type}/${item.id}`);
  };

  const renderFlightCard = (flight) => (
    <Card key={flight.id} sx={{ mb: 2 }} className="card-hover">
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Typography variant="subtitle2" color="text.secondary">
              {flight.airline}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="h5" fontWeight={600}>{flight.departTime}</Typography>
              <Flight sx={{ color: 'primary.main', transform: 'rotate(90deg)' }} />
              <Typography variant="h5" fontWeight={600}>{flight.arriveTime}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {flight.from} → {flight.to}
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Duration</Typography>
              <Typography fontWeight={500}>{flight.duration}</Typography>
              <Chip 
                label={flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`} 
                size="small" 
                color={flight.stops === 0 ? 'success' : 'default'}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="h4" color="primary.main" fontWeight={700} align="right">
              ${flight.price}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="right">
              per person
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => handleBooking(flight)}
            >
              Select
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderHotelCard = (hotel) => (
    <Card key={hotel.id} sx={{ mb: 2 }} className="card-hover">
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600}>{hotel.name}</Typography>
            <Typography variant="body2" color="text.secondary">{hotel.location}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              <Star sx={{ color: '#ffc107', fontSize: 18 }} />
              <Typography fontWeight={500}>{hotel.rating}</Typography>
              <Typography variant="body2" color="text.secondary">
                ({hotel.reviews} reviews)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {hotel.amenities.map((amenity, idx) => (
                <Chip key={idx} label={amenity} size="small" variant="outlined" />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h4" color="primary.main" fontWeight={700} align="right">
              ${hotel.price}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="right">
              per night
            </Typography>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => handleBooking(hotel)}
            >
              Book
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderCarCard = (car) => (
    <Card key={car.id} sx={{ mb: 2 }} className="card-hover">
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <Typography variant="h6" fontWeight={600}>{car.name}</Typography>
            <Typography variant="body2" color="text.secondary">{car.model}</Typography>
            <Typography variant="body2" color="text.secondary">{car.company}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Chip label={`${car.seats} seats`} size="small" variant="outlined" />
              <Chip label={`${car.bags} bags`} size="small" variant="outlined" />
            </Box>
          </Grid>
          <Grid item xs={12} md={2}>
            <Typography variant="h4" color="primary.main" fontWeight={700} align="right">
              ${car.price}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="right">
              per day
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={() => handleBooking(car)}
            >
              Reserve
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <FilterList />
                <Typography variant="h6" fontWeight={600}>Filters</Typography>
              </Box>

              <Typography gutterBottom>Price Range</Typography>
              <Slider
                value={priceRange}
                onChange={(e, v) => setPriceRange(v)}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                sx={{ mb: 3 }}
              />

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="price">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="duration">Duration</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Results */}
          <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={600}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Results
              </Typography>
              <Typography color="text.secondary">
                {results.length} options found
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {type === 'flights' && results.map(renderFlightCard)}
                {type === 'hotels' && results.map(renderHotelCard)}
                {type === 'cars' && results.map(renderCarCard)}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default SearchResults;

