import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const rewardsAPI = {
  submitBottle: () => api.post('/rewards/submit-bottle'),
  redeemItem: (data) => api.post('/rewards/redeem', data),
  getRedemptionHistory: () => api.get('/rewards/redemption-history'),
  getBottleHistory: () => api.get('/rewards/bottle-history'),
};

export const statsAPI = {
  getStats: () => api.get('/stats'),
  getHistory: (limit = 10) => api.get(`/history?limit=${limit}`),
};

export default api;
