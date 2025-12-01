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
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import {
  Flight,
  Hotel,
  DirectionsCar,
  Star,
  FilterList,
  ExpandMore,
  CompareArrows,
  LocalOffer,
} from '@mui/icons-material';

// KAYAK STYLE - Multiple providers for SAME listing
const mockFlights = [
  { 
    id: 1, 
    flightNumber: 'UA-789',
    airline: 'United Airlines', 
    from: 'San Jose', 
    to: 'New York', 
    departTime: '08:00', 
    arriveTime: '16:30', 
    duration: '5h 30m', 
    stops: 0,
    // Multiple providers offering THIS SAME FLIGHT
    providers: [
      { name: 'Expedia', price: 299, logo: '🅴' },
      { name: 'Kayak Direct', price: 289, logo: '🅺' },
      { name: 'Priceline', price: 309, logo: '🅿' },
      { name: 'Orbitz', price: 295, logo: '🅾' },
    ]
  },
  { 
    id: 2, 
    flightNumber: 'DL-456',
    airline: 'Delta', 
    from: 'San Jose', 
    to: 'New York', 
    departTime: '10:15', 
    arriveTime: '19:00', 
    duration: '5h 45m', 
    stops: 1,
    providers: [
      { name: 'Delta.com', price: 259, logo: '🔺' },
      { name: 'Expedia', price: 279, logo: '🅴' },
      { name: 'Google Flights', price: 269, logo: '🅶' },
    ]
  },
  { 
    id: 3, 
    flightNumber: 'AA-123',
    airline: 'American Airlines', 
    from: 'San Jose', 
    to: 'New York', 
    departTime: '14:00', 
    arriveTime: '22:15', 
    duration: '5h 15m', 
    stops: 0,
    providers: [
      { name: 'AA.com', price: 319, logo: '🅰' },
      { name: 'CheapOair', price: 329, logo: '🅲' },
      { name: 'Kayak Direct', price: 339, logo: '🅺' },
    ]
  },
];

const mockHotels = [
  { 
    id: 1, 
    name: 'Grand Hyatt New York', 
    location: 'New York, NY', 
    rating: 4.8, 
    reviews: 2341,
    stars: 5,
    amenities: ['WiFi', 'Pool', 'Gym', 'Spa'],
    providers: [
      { name: 'Booking.com', price: 289, logo: '🅱' },
      { name: 'Hotels.com', price: 299, logo: '🅷' },
      { name: 'Expedia', price: 279, logo: '🅴' },
      { name: 'Hyatt.com', price: 309, logo: '🅷' },
    ]
  },
  { 
    id: 2, 
    name: 'Marriott Times Square', 
    location: 'New York, NY', 
    rating: 4.5, 
    reviews: 1892,
    stars: 4,
    amenities: ['WiFi', 'Restaurant', 'Spa'],
    providers: [
      { name: 'Marriott.com', price: 249, logo: '🅼' },
      { name: 'Booking.com', price: 259, logo: '🅱' },
      { name: 'Priceline', price: 239, logo: '🅿' },
    ]
  },
];

const mockCars = [
  { 
    id: 1, 
    type: 'Midsize', 
    model: 'Toyota Camry or similar',
    seats: 5, 
    bags: 3,
    transmission: 'Automatic',
    providers: [
      { name: 'Hertz', price: 65, logo: '🚗' },
      { name: 'Enterprise', price: 59, logo: '🚙' },
      { name: 'Avis', price: 69, logo: '🚘' },
      { name: 'Budget', price: 55, logo: '🚕' },
    ]
  },
  { 
    id: 2, 
    type: 'SUV', 
    model: 'Ford Explorer or similar',
    seats: 7, 
    bags: 4,
    transmission: 'Automatic',
    providers: [
      { name: 'National', price: 89, logo: '🚗' },
      { name: 'Hertz', price: 95, logo: '🚙' },
      { name: 'Alamo', price: 85, logo: '🚘' },
    ]
  },
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get('type') || 'flights';
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('price');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Simulate API call with Kafka message queue
    setTimeout(() => {
      if (type === 'flights') setResults(mockFlights);
      else if (type === 'hotels') setResults(mockHotels);
      else setResults(mockCars);
      setLoading(false);
    }, 1000);
  }, [type]);

  const handleBooking = (item, provider) => {
    // Store selected provider info
    const bookingData = {
      ...item,
      selectedProvider: provider,
      finalPrice: provider.price,
    };
    localStorage.setItem('currentBooking', JSON.stringify(bookingData));
    navigate(`/booking/${type}/${item.id}?provider=${provider.name}&price=${provider.price}`);
  };

  const getBestPrice = (providers) => {
    return Math.min(...providers.map(p => p.price));
  };

  const renderFlightCard = (flight) => (
    <Card key={flight.id} sx={{ mb: 2 }} className="card-hover">
      <CardContent>
        {/* Flight Info Header */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.secondary">
              {flight.airline} • {flight.flightNumber}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Typography variant="h5" fontWeight={600}>{flight.departTime}</Typography>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 1 }}>
                <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300' }} />
                <Flight sx={{ color: 'primary.main', mx: 1, transform: 'rotate(90deg)' }} />
                <Box sx={{ flex: 1, height: 2, bgcolor: 'grey.300' }} />
              </Box>
              <Typography variant="h5" fontWeight={600}>{flight.arriveTime}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {flight.from} → {flight.to}
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="body2" color="text.secondary">Duration</Typography>
            <Typography fontWeight={500}>{flight.duration}</Typography>
            <Chip 
              label={flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop`} 
              size="small" 
              color={flight.stops === 0 ? 'success' : 'default'}
              sx={{ mt: 0.5 }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                from {flight.providers.length} providers
              </Typography>
              <Typography variant="h4" color="primary.main" fontWeight={700}>
                ${getBestPrice(flight.providers)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button 
              variant="contained" 
              fullWidth 
              endIcon={<ExpandMore />}
              onClick={() => setExpandedId(expandedId === flight.id ? null : flight.id)}
            >
              Compare {flight.providers.length} Deals
            </Button>
          </Grid>
        </Grid>

        {/* Provider Comparison - Expandable */}
        {expandedId === flight.id && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CompareArrows color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Compare Prices from Different Providers
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {flight.providers
                .sort((a, b) => a.price - b.price)
                .map((provider, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Paper 
                    sx={{ 
                      p: 2, 
                      textAlign: 'center',
                      border: idx === 0 ? '2px solid' : '1px solid',
                      borderColor: idx === 0 ? 'primary.main' : 'divider',
                      position: 'relative',
                    }}
                  >
                    {idx === 0 && (
                      <Chip 
                        label="Best Deal" 
                        color="primary" 
                        size="small"
                        icon={<LocalOffer />}
                        sx={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}
                      />
                    )}
                    <Avatar sx={{ bgcolor: 'grey.100', mx: 'auto', mb: 1, fontSize: 24 }}>
                      {provider.logo}
                    </Avatar>
                    <Typography fontWeight={600}>{provider.name}</Typography>
                    <Typography variant="h5" color="primary.main" fontWeight={700} sx={{ my: 1 }}>
                      ${provider.price}
                    </Typography>
                    <Button 
                      variant={idx === 0 ? "contained" : "outlined"}
                      size="small"
                      fullWidth
                      onClick={() => handleBooking(flight, provider)}
                    >
                      Book Now
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderHotelCard = (hotel) => (
    <Card key={hotel.id} sx={{ mb: 2 }} className="card-hover">
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <Typography variant="h6" fontWeight={600}>{hotel.name}</Typography>
            <Typography variant="body2" color="text.secondary">{hotel.location}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {[...Array(hotel.stars)].map((_, i) => (
                <Star key={i} sx={{ color: '#ffc107', fontSize: 18 }} />
              ))}
              <Typography variant="body2" sx={{ ml: 1 }}>
                {hotel.rating} ({hotel.reviews} reviews)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {hotel.amenities.map((a, idx) => (
                <Chip key={idx} label={a} size="small" variant="outlined" />
              ))}
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              from {hotel.providers.length} providers
            </Typography>
            <Typography variant="h4" color="primary.main" fontWeight={700}>
              ${getBestPrice(hotel.providers)}
            </Typography>
            <Typography variant="body2" color="text.secondary">per night</Typography>
          </Grid>
          <Grid item xs={6} md={4}>
            <Button 
              variant="contained" 
              fullWidth 
              endIcon={<ExpandMore />}
              onClick={() => setExpandedId(expandedId === hotel.id ? null : hotel.id)}
            >
              Compare {hotel.providers.length} Deals
            </Button>
          </Grid>
        </Grid>

        {expandedId === hotel.id && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2}>
              {hotel.providers
                .sort((a, b) => a.price - b.price)
                .map((provider, idx) => (
                <Grid item xs={6} sm={3} key={idx}>
                  <Paper sx={{ p: 2, textAlign: 'center', border: idx === 0 ? '2px solid' : '1px solid', borderColor: idx === 0 ? 'primary.main' : 'divider' }}>
                    {idx === 0 && <Chip label="Best Deal" color="primary" size="small" sx={{ mb: 1 }} />}
                    <Typography fontWeight={600}>{provider.name}</Typography>
                    <Typography variant="h5" color="primary.main" fontWeight={700}>${provider.price}</Typography>
                    <Button variant={idx === 0 ? "contained" : "outlined"} size="small" fullWidth sx={{ mt: 1 }} onClick={() => handleBooking(hotel, provider)}>
                      Book
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderCarCard = (car) => (
    <Card key={car.id} sx={{ mb: 2 }} className="card-hover">
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={600}>{car.type}</Typography>
            <Typography variant="body2" color="text.secondary">{car.model}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip label={`${car.seats} seats`} size="small" variant="outlined" />
              <Chip label={`${car.bags} bags`} size="small" variant="outlined" />
              <Chip label={car.transmission} size="small" variant="outlined" />
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              from {car.providers.length} rental companies
            </Typography>
            <Typography variant="h4" color="primary.main" fontWeight={700}>
              ${getBestPrice(car.providers)}
            </Typography>
            <Typography variant="body2" color="text.secondary">per day</Typography>
          </Grid>
          <Grid item xs={6} md={5}>
            <Button 
              variant="contained" 
              endIcon={<ExpandMore />}
              onClick={() => setExpandedId(expandedId === car.id ? null : car.id)}
            >
              Compare {car.providers.length} Rentals
            </Button>
          </Grid>
        </Grid>

        {expandedId === car.id && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2}>
              {car.providers
                .sort((a, b) => a.price - b.price)
                .map((provider, idx) => (
                <Grid item xs={6} sm={3} key={idx}>
                  <Paper sx={{ p: 2, textAlign: 'center', border: idx === 0 ? '2px solid' : '1px solid', borderColor: idx === 0 ? 'primary.main' : 'divider' }}>
                    {idx === 0 && <Chip label="Best Deal" color="primary" size="small" sx={{ mb: 1 }} />}
                    <Typography fontWeight={600}>{provider.name}</Typography>
                    <Typography variant="h5" color="primary.main" fontWeight={700}>${provider.price}/day</Typography>
                    <Button variant={idx === 0 ? "contained" : "outlined"} size="small" fullWidth sx={{ mt: 1 }} onClick={() => handleBooking(car, provider)}>
                      Reserve
                    </Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Kayak Comparison:</strong> We search multiple providers to find you the best deal. Click "Compare Deals" to see all options!
        </Alert>

        <Grid container spacing={3}>
          {/* Filters */}
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
                max={500}
                sx={{ mb: 3 }}
              />
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
                  <MenuItem value="price">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
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
                {results.length} options • Multiple providers per listing
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
