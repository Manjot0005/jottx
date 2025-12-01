import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  signup: (userData) => api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Search APIs
export const searchAPI = {
  flights: (params) => api.get('/search/flights', { params }),
  hotels: (params) => api.get('/search/hotels', { params }),
  cars: (params) => api.get('/search/cars', { params }),
};

// Booking APIs
export const bookingAPI = {
  create: (bookingData) => api.post('/bookings', bookingData),
  getAll: () => api.get('/bookings/my-bookings'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

// Listings APIs (for getting details)
export const listingsAPI = {
  getFlight: (id) => api.get(`/listings/flights/${id}`),
  getHotel: (id) => api.get(`/listings/hotels/${id}`),
  getCar: (id) => api.get(`/listings/cars/${id}`),
  getPopularFlights: () => api.get('/listings/flights/popular'),
  getPopularHotels: () => api.get('/listings/hotels/popular'),
  getPopularCars: () => api.get('/listings/cars/popular'),
};

export default api;

