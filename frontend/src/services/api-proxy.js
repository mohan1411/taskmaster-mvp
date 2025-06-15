import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  // Remove the base URL - let the proxy handle it
  // baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.status, error.config?.url, error.message);
    
    // Handle 401 errors
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('user');
      window.location.href = '/login?session=expired';
    }
    
    return Promise.reject(error);
  }
);

export default api;
