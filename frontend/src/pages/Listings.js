import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import { Flight, Hotel, DirectionsCar, Delete, Visibility, Refresh } from '@mui/icons-material';
import { flightsStore, hotelsStore, carsStore } from '../services/sharedData';
import { listingsAPI } from '../services/api';

const Listings = () => {
  const [tab, setTab] = useState(0);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Lists
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [cars, setCars] = useState([]);

  // Flight Form
  const [flightData, setFlightData] = useState({
    flight_id: '',
    airline_name: '',
    departure_airport: '',
    arrival_airport: '',
    departure_datetime: '',
    arrival_datetime: '',
    duration: '',
    flight_class: 'Economy',
    ticket_price: '',
    total_seats: '',
    available_seats: '',
  });

  // Hotel Form
  const [hotelData, setHotelData] = useState({
    hotel_id: '',
    hotel_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    star_rating: '',
    total_rooms: '',
    available_rooms: '',
    room_type: '',
    price_per_night: '',
    amenities: '',
  });

  // Car Form
  const [carData, setCarData] = useState({
    car_id: '',
    car_type: '',
    company_name: '',
    model: '',
    year: '',
    transmission_type: 'Automatic',
    seats: '',
    daily_rental_price: '',
    availability_status: 'AVAILABLE',
  });

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = () => {
    setFlights(flightsStore.getAll());
    setHotels(hotelsStore.getAll());
    setCars(carsStore.getAll());
  };

  const handleFlightSubmit = async (e) => {
    e.preventDefault();
    try {
      // Call backend API
      await listingsAPI.addFlight(flightData);
      
      // Also add to localStorage for backward compatibility
      flightsStore.add(flightData);
      
      setSuccess('Flight added successfully! It will now appear on the traveler site.');
      setError('');
      setFlightData({
        flight_id: '',
        airline_name: '',
        departure_airport: '',
        arrival_airport: '',
        departure_datetime: '',
        arrival_datetime: '',
        duration: '',
        flight_class: 'Economy',
        ticket_price: '',
        total_seats: '',
        available_seats: '',
      });
      loadListings();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add flight');
      setSuccess('');
    }
  };

  const handleHotelSubmit = async (e) => {
    e.preventDefault();
    try {
      const hotelPayload = {
        ...hotelData,
        amenities: hotelData.amenities.split(',').map((a) => a.trim()),
      };
      
      // Call backend API
      await listingsAPI.addHotel(hotelPayload);
      
      // Also add to localStorage for backward compatibility
      hotelsStore.add(hotelPayload);
      
      setSuccess('Hotel added successfully! It will now appear on the traveler site.');
      setError('');
      setHotelData({
        hotel_id: '',
        hotel_name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        star_rating: '',
        total_rooms: '',
        available_rooms: '',
        room_type: '',
        price_per_night: '',
        amenities: '',
      });
      loadListings();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add hotel');
      setSuccess('');
    }
  };

  const handleCarSubmit = async (e) => {
    e.preventDefault();
    try {
      // Call backend API
      await listingsAPI.addCar(carData);
      
      // Also add to localStorage for backward compatibility
      carsStore.add(carData);
      
      setSuccess('Car added successfully! It will now appear on the traveler site.');
      setError('');
      setCarData({
        car_id: '',
        car_type: '',
        company_name: '',
        model: '',
        year: '',
        transmission_type: 'Automatic',
        seats: '',
        daily_rental_price: '',
        availability_status: 'AVAILABLE',
      });
      loadListings();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add car');
      setSuccess('');
    }
  };

  const handleDeleteFlight = (id) => {
    if (window.confirm('Delete this flight?')) {
      flightsStore.delete(id);
      loadListings();
      setSuccess('Flight deleted');
    }
  };

  const handleDeleteHotel = (id) => {
    if (window.confirm('Delete this hotel?')) {
      hotelsStore.delete(id);
      loadListings();
      setSuccess('Hotel deleted');
    }
  };

  const handleDeleteCar = (id) => {
    if (window.confirm('Delete this car?')) {
      carsStore.delete(id);
      loadListings();
      setSuccess('Car deleted');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" gutterBottom>
        Manage Listings
      </Typography>
        <Button startIcon={<Refresh />} onClick={loadListings}>
          Refresh
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Listings added here will automatically sync to the traveler booking site (port 3001)
      </Alert>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab icon={<Flight />} label={`Flights (${flights.length})`} />
          <Tab icon={<Hotel />} label={`Hotels (${hotels.length})`} />
          <Tab icon={<DirectionsCar />} label={`Cars (${cars.length})`} />
        </Tabs>

        {/* Flight Tab */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Add New Flight</Typography>
            <form onSubmit={handleFlightSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Flight ID (e.g., AA123)" value={flightData.flight_id}
                    onChange={(e) => setFlightData({ ...flightData, flight_id: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Airline Name" value={flightData.airline_name}
                    onChange={(e) => setFlightData({ ...flightData, airline_name: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Departure City" value={flightData.departure_airport}
                    onChange={(e) => setFlightData({ ...flightData, departure_airport: e.target.value })}
                    helperText="e.g., Chicago, Los Angeles, New York" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Arrival City" value={flightData.arrival_airport}
                    onChange={(e) => setFlightData({ ...flightData, arrival_airport: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Departure Date & Time" type="datetime-local" InputLabelProps={{ shrink: true }}
                    value={flightData.departure_datetime} onChange={(e) => setFlightData({ ...flightData, departure_datetime: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Arrival Date & Time" type="datetime-local" InputLabelProps={{ shrink: true }}
                    value={flightData.arrival_datetime} onChange={(e) => setFlightData({ ...flightData, arrival_datetime: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth label="Duration (minutes)" type="number" value={flightData.duration}
                    onChange={(e) => setFlightData({ ...flightData, duration: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth select label="Flight Class" value={flightData.flight_class}
                    onChange={(e) => setFlightData({ ...flightData, flight_class: e.target.value })}>
                    <MenuItem value="Economy">Economy</MenuItem>
                    <MenuItem value="Business">Business</MenuItem>
                    <MenuItem value="First">First Class</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth label="Ticket Price ($)" type="number" value={flightData.ticket_price}
                    onChange={(e) => setFlightData({ ...flightData, ticket_price: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Total Seats" type="number" value={flightData.total_seats}
                    onChange={(e) => setFlightData({ ...flightData, total_seats: e.target.value, available_seats: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Available Seats" type="number" value={flightData.available_seats}
                    onChange={(e) => setFlightData({ ...flightData, available_seats: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" size="large" fullWidth>Add Flight</Button>
                </Grid>
              </Grid>
            </form>

            {/* Flight List */}
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>Existing Flights</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Flight ID</TableCell>
                    <TableCell>Airline</TableCell>
                    <TableCell>Route</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Seats</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {flights.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">No flights added yet</TableCell></TableRow>
                  ) : (
                    flights.map((f) => (
                      <TableRow key={f.flight_id || f.id}>
                        <TableCell>{f.flight_id}</TableCell>
                        <TableCell>{f.airline_name}</TableCell>
                        <TableCell>{f.departure_airport} → {f.arrival_airport}</TableCell>
                        <TableCell>${f.ticket_price}</TableCell>
                        <TableCell>{f.available_seats}/{f.total_seats}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => handleDeleteFlight(f.flight_id || f.id)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Hotel Tab */}
        {tab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Add New Hotel</Typography>
            <form onSubmit={handleHotelSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Hotel ID" value={hotelData.hotel_id}
                    onChange={(e) => setHotelData({ ...hotelData, hotel_id: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Hotel Name" value={hotelData.hotel_name}
                    onChange={(e) => setHotelData({ ...hotelData, hotel_name: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField required fullWidth label="Address" value={hotelData.address}
                    onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth label="City" value={hotelData.city}
                    onChange={(e) => setHotelData({ ...hotelData, city: e.target.value })}
                    helperText="e.g., New York, Los Angeles" />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth label="State (2-letter)" value={hotelData.state}
                    onChange={(e) => setHotelData({ ...hotelData, state: e.target.value.toUpperCase() })}
                    inputProps={{ maxLength: 2 }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth label="ZIP Code" value={hotelData.zip_code}
                    onChange={(e) => setHotelData({ ...hotelData, zip_code: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth label="Star Rating (1-5)" type="number" inputProps={{ min: 1, max: 5 }}
                    value={hotelData.star_rating} onChange={(e) => setHotelData({ ...hotelData, star_rating: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth label="Total Rooms" type="number" value={hotelData.total_rooms}
                    onChange={(e) => setHotelData({ ...hotelData, total_rooms: e.target.value, available_rooms: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField required fullWidth label="Available Rooms" type="number" value={hotelData.available_rooms}
                    onChange={(e) => setHotelData({ ...hotelData, available_rooms: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Room Type" value={hotelData.room_type}
                    onChange={(e) => setHotelData({ ...hotelData, room_type: e.target.value })}
                    helperText="e.g., Standard, Deluxe, Suite" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Price per Night ($)" type="number" value={hotelData.price_per_night}
                    onChange={(e) => setHotelData({ ...hotelData, price_per_night: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Amenities (comma-separated)" placeholder="WiFi, Breakfast, Parking, Pool"
                    value={hotelData.amenities} onChange={(e) => setHotelData({ ...hotelData, amenities: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" size="large" fullWidth>Add Hotel</Button>
                </Grid>
              </Grid>
            </form>

            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>Existing Hotels</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hotel ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Stars</TableCell>
                    <TableCell>Price/Night</TableCell>
                    <TableCell>Rooms</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hotels.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center">No hotels added yet</TableCell></TableRow>
                  ) : (
                    hotels.map((h) => (
                      <TableRow key={h.hotel_id || h.id}>
                        <TableCell>{h.hotel_id}</TableCell>
                        <TableCell>{h.hotel_name}</TableCell>
                        <TableCell>{h.city}, {h.state}</TableCell>
                        <TableCell>{'⭐'.repeat(h.star_rating || 3)}</TableCell>
                        <TableCell>${h.price_per_night}</TableCell>
                        <TableCell>{h.available_rooms}/{h.total_rooms}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => handleDeleteHotel(h.hotel_id || h.id)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Car Tab */}
        {tab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Add New Car</Typography>
            <form onSubmit={handleCarSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Car ID" value={carData.car_id}
                    onChange={(e) => setCarData({ ...carData, car_id: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth select label="Car Type" value={carData.car_type}
                    onChange={(e) => setCarData({ ...carData, car_type: e.target.value })}>
                    <MenuItem value="Economy">Economy</MenuItem>
                    <MenuItem value="Compact">Compact</MenuItem>
                    <MenuItem value="Midsize">Midsize</MenuItem>
                    <MenuItem value="Full-size">Full-size</MenuItem>
                    <MenuItem value="SUV">SUV</MenuItem>
                    <MenuItem value="Luxury">Luxury</MenuItem>
                    <MenuItem value="Minivan">Minivan</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Company Name" value={carData.company_name}
                    onChange={(e) => setCarData({ ...carData, company_name: e.target.value })}
                    helperText="e.g., Hertz, Enterprise, Avis" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Model" value={carData.model}
                    onChange={(e) => setCarData({ ...carData, model: e.target.value })}
                    helperText="e.g., Toyota Camry, Ford Explorer" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Year" type="number" value={carData.year}
                    onChange={(e) => setCarData({ ...carData, year: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth select label="Transmission" value={carData.transmission_type}
                    onChange={(e) => setCarData({ ...carData, transmission_type: e.target.value })}>
                    <MenuItem value="Automatic">Automatic</MenuItem>
                    <MenuItem value="Manual">Manual</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Seats" type="number" value={carData.seats}
                    onChange={(e) => setCarData({ ...carData, seats: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField required fullWidth label="Daily Rental Price ($)" type="number" value={carData.daily_rental_price}
                    onChange={(e) => setCarData({ ...carData, daily_rental_price: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" size="large" fullWidth>Add Car</Button>
                </Grid>
              </Grid>
            </form>

            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom>Existing Cars</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Car ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Price/Day</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cars.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">No cars added yet</TableCell></TableRow>
                  ) : (
                    cars.map((c) => (
                      <TableRow key={c.car_id || c.id}>
                        <TableCell>{c.car_id}</TableCell>
                        <TableCell><Chip size="small" label={c.car_type} /></TableCell>
                        <TableCell>{c.model} ({c.year})</TableCell>
                        <TableCell>{c.company_name}</TableCell>
                        <TableCell>${c.daily_rental_price}</TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => handleDeleteCar(c.car_id || c.id)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Listings;
