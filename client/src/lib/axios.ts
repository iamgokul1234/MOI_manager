import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized (not for auth routes)
      if (!error.config?.url?.includes('/auth/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
