const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const config = require('../config/config');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password -refreshToken');

      // Check if user exists
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Check if user is active
      if (req.user.status === 'suspended' || req.user.status === 'deleted') {
        return res.status(401).json({ message: 'Account suspended or deleted' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', {
        errorName: error.name,
        errorMessage: error.message,
        tokenReceived: !!token,
        endpoint: req.originalUrl
      });
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Your session has expired. Please login again.',
          expired: true 
        });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware for admin routes
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
