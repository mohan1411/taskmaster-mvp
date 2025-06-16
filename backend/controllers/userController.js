const User = require('../models/userModel');
const Settings = require('../models/settingsModel');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const client = new OAuth2Client(config.googleClientId);

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiryTime
  });
};

// Generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiryTime
  });
};

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/avatars');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user._id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
const createTransporter = () => {
  // For development, use a test email service like Ethereal
  // In production, use a real email service
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    // Create default settings for the user
    await Settings.create({
      user: user._id
    });

    if (user) {
      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token in user document
      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        token,
        refreshToken
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token in user document
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        token,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      
      // Only update email if it changed and verify again
      if (req.body.email && req.body.email !== user.email) {
        user.email = req.body.email;
        user.isEmailVerified = false;
        // Would send verification email here in production
      }

      // Only update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        isEmailVerified: updatedUser.isEmailVerified
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Try to verify refresh token with current secret first
    let decoded;
    let user;
    
    try {
      decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
    } catch (error) {
      // If current secret fails and we're using a custom secret, try the default
      if (config.refreshTokenSecret !== 'YOUR_REFRESH_SECRET') {
        console.log('Trying fallback refresh token secret for legacy tokens');
        try {
          decoded = jwt.verify(refreshToken, 'YOUR_REFRESH_SECRET');
        } catch (fallbackError) {
          throw error; // Throw original error
        }
      } else {
        throw error;
      }
    }
    
    // Find user by ID first
    user = await User.findById(decoded.id);
    
    if (!user) {
      console.error('User not found for refresh token:', {
        decodedUserId: decoded?.id
      });
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user has a refresh token stored
    if (!user.refreshToken) {
      console.error('User has no refresh token stored:', {
        userId: user._id,
        email: user.email
      });
      return res.status(401).json({ 
        message: 'No refresh token found. Please login again.',
        requiresLogin: true 
      });
    }
    
    // Verify the refresh token matches
    if (user.refreshToken !== refreshToken) {
      console.error('Refresh token mismatch:', {
        userId: user._id,
        email: user.email,
        tokenMatch: false
      });
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateToken(user._id);

    res.json({
      token: newAccessToken
    });
  } catch (error) {
    console.error('Refresh token error:', {
      errorName: error.name,
      errorMessage: error.message,
      refreshTokenSecret: config.refreshTokenSecret === 'YOUR_REFRESH_SECRET' ? 'DEFAULT_NOT_SET' : 'CUSTOM_SET'
    });
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Clear refresh token
      user.refreshToken = null;
      await user.save();
      
      res.json({ message: 'Logged out successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    // Handle OAuth callback (GET request with code parameter)
    if (req.method === 'GET' && req.query.code) {
      return handleGoogleCallback(req, res);
    }
    
    // Handle direct token verification (POST request)
    const { tokenId } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: config.googleClientId
    });
    
    const { email_verified, name, email, picture, sub } = ticket.getPayload();
    
    if (!email_verified) {
      return res.status(400).json({ message: 'Email not verified with Google' });
    }

    // Find existing user or create new one
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        isEmailVerified: true
      });

      // Create default settings for the user
      await Settings.create({
        user: user._id
      });
    } else {
      // Update existing user with Google data if not already set
      if (!user.googleId) {
        user.googleId = sub;
        user.isEmailVerified = true;
        if (!user.avatar) {
          user.avatar = picture;
        }
        await user.save();
      }
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      token,
      refreshToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Handle Google OAuth callback
const handleGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'Authorization code missing' });
    }

    // Exchange code for tokens
    const { tokens } = await client.getToken({
      code,
      client_id: config.googleClientId,
      client_secret: config.googleClientSecret,
      redirect_uri: config.googleCallbackUrl
    });

    // Verify the ID token
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.googleClientId
    });

    const { email_verified, name, email, picture, sub } = ticket.getPayload();

    if (!email_verified) {
      return res.redirect(`${config.appUrl}/login?error=email_not_verified`);
    }

    // Find existing user or create new one
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        isEmailVerified: true
      });

      // Create default settings for the user
      await Settings.create({
        user: user._id
      });
    } else {
      // Update existing user with Google data if not already set
      if (!user.googleId) {
        user.googleId = sub;
        user.isEmailVerified = true;
        if (!user.avatar) {
          user.avatar = picture;
        }
        await user.save();
      }
    }

    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    // Redirect to frontend with tokens
    const redirectUrl = `${config.appUrl}/login?token=${token}&refreshToken=${refreshToken}&name=${encodeURIComponent(user.name)}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.redirect(`${config.appUrl}/login?error=oauth_failed`);
  }
};

// @desc    Forgot password - generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;

    // Create email message
    const message = `
      <h1>You requested a password reset</h1>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>This link is valid for 1 hour.</p>
    `;

    try {
      // Send email
      const transporter = createTransporter();
      
      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_FROM || 'noreply@fizztask.com',
        subject: 'FizzTask Password Reset',
        html: message
      });

      res.json({ message: 'Password reset email sent' });
    } catch (emailError) {
      console.error('Email error:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ message: 'Could not send reset email' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Find user by reset token and check if it's expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // If we want to automatically log in the user after reset
    const jwtToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Password reset successful',
      token: jwtToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify reset token validity
// @route   GET /api/auth/verify-reset-token/:token
// @access  Public
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by reset token and check if it's expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    res.json({ message: 'Token is valid', email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload user avatar
// @route   POST /api/users/upload-avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Delete old avatar file if exists
    if (user.avatar && user.avatar.includes('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update user with new avatar path
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    user.avatar = avatarUrl;
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete user avatar
// @route   DELETE /api/users/avatar
// @access  Private
const deleteAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete avatar file if exists
    if (user.avatar && user.avatar.includes('/uploads/avatars/')) {
      const filePath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove avatar from user
    user.avatar = null;
    await user.save();

    res.json({
      message: 'Avatar deleted successfully'
    });
  } catch (error) {
    console.error('Avatar deletion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send email verification
// @route   POST /api/users/send-verification-email
// @access  Private
const sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Save to user
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpire = verificationTokenExpiry;
    await user.save();

    // Create verification URL
    const verificationUrl = `${config.frontendUrl}/verify-email/${verificationToken}`;

    // Create email message
    const message = `
      <h1>Verify Your Email Address</h1>
      <p>Please click on the following link to verify your email address:</p>
      <a href="${verificationUrl}" clicktracking="off">${verificationUrl}</a>
      <p>If you did not create an account, please ignore this email.</p>
      <p>This link is valid for 24 hours.</p>
    `;

    try {
      // Send email
      const transporter = createTransporter();
      
      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_FROM || 'noreply@fizztask.com',
        subject: 'FizzTask Email Verification',
        html: message
      });

      res.json({ message: 'Verification email sent successfully' });
    } catch (emailError) {
      console.error('Email error:', emailError);
      user.emailVerificationToken = undefined;
      user.emailVerificationExpire = undefined;
      await user.save();

      return res.status(500).json({ message: 'Could not send verification email' });
    }
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify email with token
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by verification token and check if it's expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  refreshToken,
  logoutUser,
  googleAuth,
  forgotPassword,
  resetPassword,
  verifyResetToken,
  uploadAvatar,
  deleteAvatar,
  sendVerificationEmail,
  verifyEmail,
  upload
};
