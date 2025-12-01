import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Flight,
  Hotel,
  DirectionsCar,
  Person,
  Payment,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const steps = ['Traveler Info', 'Payment', 'Confirmation'];

const mockItems = {
  flights: { name: 'United Airlines', from: 'San Jose', to: 'New York', price: 299, date: 'Dec 15, 2025' },
  hotels: { name: 'Grand Hyatt New York', location: 'New York, NY', price: 289, nights: 3 },
  cars: { name: 'Toyota Camry', company: 'Hertz', price: 65, days: 3 },
};

const Booking = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const item = mockItems[type] || mockItems.flights;

  const [travelerInfo, setTravelerInfo] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      navigate('/my-bookings');
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handleNext();
    }, 2000);
  };

  const getIcon = () => {
    if (type === 'flights') return <Flight sx={{ fontSize: 40, color: 'primary.main' }} />;
    if (type === 'hotels') return <Hotel sx={{ fontSize: 40, color: 'primary.main' }} />;
    return <DirectionsCar sx={{ fontSize: 40, color: 'primary.main' }} />;
  };

  const getTotalPrice = () => {
    if (type === 'hotels') return item.price * item.nights;
    if (type === 'cars') return item.price * item.days;
    return item.price;
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={600} sx={{ mb: 4 }}>
          Complete Your Booking
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 4 }}>
              {/* Step 1: Traveler Info */}
              {activeStep === 0 && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Person color="primary" />
                    <Typography variant="h6" fontWeight={600}>Traveler Information</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={travelerInfo.firstName}
                        onChange={(e) => setTravelerInfo({ ...travelerInfo, firstName: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={travelerInfo.lastName}
                        onChange={(e) => setTravelerInfo({ ...travelerInfo, lastName: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={travelerInfo.email}
                        onChange={(e) => setTravelerInfo({ ...travelerInfo, email: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={travelerInfo.phone}
                        onChange={(e) => setTravelerInfo({ ...travelerInfo, phone: e.target.value })}
                        required
                      />
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Step 2: Payment */}
              {activeStep === 1 && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Payment color="primary" />
                    <Typography variant="h6" fontWeight={600}>Payment Details</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Card Number"
                        placeholder="1234 5678 9012 3456"
                        value={paymentInfo.cardNumber}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        placeholder="MM/YY"
                        value={paymentInfo.expiry}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="CVV"
                        placeholder="123"
                        value={paymentInfo.cvv}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value })}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Name on Card"
                        value={paymentInfo.nameOnCard}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, nameOnCard: e.target.value })}
                        required
                      />
                    </Grid>
                  </Grid>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Demo: Enter any card details to proceed
                  </Alert>
                </>
              )}

              {/* Step 3: Confirmation */}
              {activeStep === 2 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Booking Confirmed!
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Your confirmation number is <strong>BK{Date.now()}</strong>
                  </Typography>
                  <Typography color="text.secondary">
                    A confirmation email has been sent to {travelerInfo.email}
                  </Typography>
                </Box>
              )}

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>
                {activeStep === 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Pay $${getTotalPrice()}`}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    {activeStep === steps.length - 1 ? 'View My Bookings' : 'Continue'}
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {getIcon()}
                  <Typography variant="h6" fontWeight={600}>
                    {item.name}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                
                {type === 'flights' && (
                  <>
                    <Typography color="text.secondary">Route</Typography>
                    <Typography fontWeight={500} gutterBottom>{item.from} → {item.to}</Typography>
                    <Typography color="text.secondary">Date</Typography>
                    <Typography fontWeight={500} gutterBottom>{item.date}</Typography>
                  </>
                )}
                
                {type === 'hotels' && (
                  <>
                    <Typography color="text.secondary">Location</Typography>
                    <Typography fontWeight={500} gutterBottom>{item.location}</Typography>
                    <Typography color="text.secondary">Duration</Typography>
                    <Typography fontWeight={500} gutterBottom>{item.nights} nights</Typography>
                  </>
                )}
                
                {type === 'cars' && (
                  <>
                    <Typography color="text.secondary">Rental Company</Typography>
                    <Typography fontWeight={500} gutterBottom>{item.company}</Typography>
                    <Typography color="text.secondary">Duration</Typography>
                    <Typography fontWeight={500} gutterBottom>{item.days} days</Typography>
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal</Typography>
                  <Typography>${getTotalPrice()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Taxes & Fees</Typography>
                  <Typography>${Math.round(getTotalPrice() * 0.1)}</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={600}>Total</Typography>
                  <Typography variant="h6" fontWeight={600} color="primary.main">
                    ${getTotalPrice() + Math.round(getTotalPrice() * 0.1)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Booking;

