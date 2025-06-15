import axios from 'axios';

// Environment-based API URL configuration
const getApiBaseUrl = () => {
  // In development, use the environment variable or default to localhost
  if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }
  
  // In production, use the production URL
  return 'https://taskmaster-mvp-production.up.railway.app';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🚀 API CONFIG:', {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV,
  hostname: window.location.hostname,
  env_var: process.env.REACT_APP_API_URL
});

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not from the token refresh endpoint
    // and we haven't already tried to refresh the token
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest.url.includes('/auth/refresh') && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        // Get stored user data
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          throw new Error('No user data found');
        }
        
        const userData = JSON.parse(storedUser);
        
        // Call refresh token endpoint
        const response = await axios.post(
          `${originalRequest.baseURL}/api/auth/refresh`,
          { refreshToken: userData.refreshToken }
        );
        
        const { token } = response.data;
        
        // Update stored user data
        const updatedUser = {
          ...userData,
          token
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update Authorization header for this and future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clear user data and force login
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        
        // Redirect to login page
        window.location.href = '/login?session=expired';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
