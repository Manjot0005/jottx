import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api/admin';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Listings APIs (public endpoints)
export const listingsAPI = {
  getAllFlights: () => api.get('/listings/flights'),
  getAllHotels: () => api.get('/listings/hotels'),
  getAllCars: () => api.get('/listings/cars'),
};

export default api;
