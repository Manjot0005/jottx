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
  const [confirmationNumber, setConfirmationNumber] = useState('');
  
  const item = mockItems[type] || mockItems.flights;

  const [travelerInfo, setTravelerInfo] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  });

  const [errors, setErrors] = useState({});

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please sign in to make a booking
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Sign In
        </Button>
      </Container>
    );
  }

  const validatePhone = (phone) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!travelerInfo.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!travelerInfo.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!travelerInfo.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!validatePhone(travelerInfo.phone)) newErrors.phone = 'Phone must be 10 digits';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (paymentInfo.cardNumber.replace(/\s/g, '').length < 16) newErrors.cardNumber = 'Enter valid card number';
    if (!paymentInfo.expiry.match(/^\d{2}\/\d{2}$/)) newErrors.expiry = 'Use MM/YY format';
    if (paymentInfo.cvv.length < 3) newErrors.cvv = 'Enter valid CVV';
    if (!paymentInfo.nameOnCard.trim()) newErrors.nameOnCard = 'Name on card is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) return;
    if (activeStep === 1) {
      if (!validateStep2()) return;
      handleConfirm();
      return;
    }
    if (activeStep === steps.length - 1) {
      navigate('/my-bookings');
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setErrors({});
  };

  const handleConfirm = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Generate confirmation number
      const confNum = 'BK' + Date.now().toString().slice(-8);
      setConfirmationNumber(confNum);

      // Create booking record
      const booking = {
        id: 'booking-' + Date.now(),
        confirmationNumber: confNum,
        type: type,
        name: item.name,
        from: item.from,
        to: item.to,
        location: item.location,
        company: item.company,
        date: new Date().toISOString(),
        price: item.price,
        totalPrice: getTotalPrice() + Math.round(getTotalPrice() * 0.1),
        status: 'confirmed',
        traveler: {
          firstName: travelerInfo.firstName,
          lastName: travelerInfo.lastName,
          email: travelerInfo.email,
          phone: travelerInfo.phone,
        },
        createdAt: new Date().toISOString(),
      };

      // Save to user's bookings
      const allBookings = JSON.parse(localStorage.getItem('userBookings') || '{}');
      if (!allBookings[user.user_id]) {
        allBookings[user.user_id] = [];
      }
      allBookings[user.user_id].push(booking);
      localStorage.setItem('userBookings', JSON.stringify(allBookings));

      setLoading(false);
      setActiveStep((prev) => prev + 1);
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

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      return digits.slice(0, 2) + '/' + digits.slice(2);
    }
    return digits;
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
                        error={!!errors.firstName}
                        helperText={errors.firstName}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={travelerInfo.lastName}
                        onChange={(e) => setTravelerInfo({ ...travelerInfo, lastName: e.target.value })}
                        required
                        error={!!errors.lastName}
                        helperText={errors.lastName}
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
                        error={!!errors.email}
                        helperText={errors.email}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={travelerInfo.phone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setTravelerInfo({ ...travelerInfo, phone: digits });
                        }}
                        required
                        error={!!errors.phone}
                        helperText={errors.phone || 'Must be 10 digits'}
                        placeholder="5551234567"
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
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cardNumber: formatCardNumber(e.target.value) })}
                        required
                        error={!!errors.cardNumber}
                        helperText={errors.cardNumber}
                        inputProps={{ maxLength: 19 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Expiry Date"
                        placeholder="MM/YY"
                        value={paymentInfo.expiry}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, expiry: formatExpiry(e.target.value) })}
                        required
                        error={!!errors.expiry}
                        helperText={errors.expiry}
                        inputProps={{ maxLength: 5 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="CVV"
                        placeholder="123"
                        value={paymentInfo.cvv}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        required
                        error={!!errors.cvv}
                        helperText={errors.cvv}
                        inputProps={{ maxLength: 4 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Name on Card"
                        value={paymentInfo.nameOnCard}
                        onChange={(e) => setPaymentInfo({ ...paymentInfo, nameOnCard: e.target.value })}
                        required
                        error={!!errors.nameOnCard}
                        helperText={errors.nameOnCard}
                      />
                    </Grid>
                  </Grid>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    For demo: Use any valid card format (e.g., 4111 1111 1111 1111)
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
                    Your confirmation number is <strong>{confirmationNumber}</strong>
                  </Typography>
                  <Typography color="text.secondary">
                    A confirmation email has been sent to {travelerInfo.email}
                  </Typography>
                  <Alert severity="success" sx={{ mt: 3, maxWidth: 400, mx: 'auto' }}>
                    This booking is saved to your account: {user.email}
                  </Alert>
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
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  {loading 
                    ? 'Processing...' 
                    : activeStep === 1 
                      ? `Pay $${getTotalPrice() + Math.round(getTotalPrice() * 0.1)}` 
                      : activeStep === steps.length - 1 
                        ? 'View My Bookings' 
                        : 'Continue'
                  }
                </Button>
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
            
            {/* Logged in user info */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Booking as:
                </Typography>
                <Typography fontWeight={500}>
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Booking;
