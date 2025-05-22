import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from local storage on initial load
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Set default Authorization header for API requests
          api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
        // Clear potentially corrupted storage
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register new user
  const register = async (name, email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/register', {
        name,
        email,
        password
      });
      
      const userData = response.data;
      
      // Store user data in local storage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set default Authorization header for API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      
      const userData = response.data;
      
      // Store user data in local storage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set default Authorization header for API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Google login/signup
  const googleAuth = async (tokenId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/google', {
        tokenId
      });
      
      const userData = response.data;
      
      // Store user data in local storage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set default Authorization header for API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Google authentication failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (user) {
        // Call logout API to invalidate server-side token
        await api.post('/api/auth/logout');
      }
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      // Clear local storage and state regardless of API success
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  // Refresh access token
  const refreshToken = async () => {
    try {
      if (!user || !user.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/api/auth/refresh', {
        refreshToken: user.refreshToken
      });
      
      const newToken = response.data.token;
      
      // Update user data with new token
      const updatedUser = {
        ...user,
        token: newToken
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setUser(updatedUser);
      
      return newToken;
    } catch (err) {
      console.error('Token refresh failed:', err);
      // If refresh fails, force logout
      logout();
      throw new Error('Session expired. Please login again.');
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.put('/api/auth/profile', userData);
      
      const updatedUserData = {
        ...user,
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar,
        isEmailVerified: response.data.isEmailVerified
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      
      return updatedUserData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Profile update failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Build the value object for the context
  const contextValue = {
    user,
    isLoading,
    error,
    register,
    login,
    googleAuth,
    logout,
    refreshToken,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
