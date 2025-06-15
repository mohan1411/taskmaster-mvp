const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { userValidationRules } = require('../middleware/validationMiddleware');
const { authLimiter, passwordResetLimiter, uploadLimiter } = require('../middleware/rateLimitMiddleware');

// Public routes with rate limiting and validation
router.post('/register', authLimiter, userValidationRules.register, registerUser);
router.post('/login', authLimiter, userValidationRules.login, loginUser);
router.post('/refresh', authLimiter, refreshToken);
router.post('/google', authLimiter, googleAuth);
router.get('/google/callback', googleAuth); // Add callback route
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.get('/verify-email/:token', verifyEmail);

// Protected routes with validation
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, userValidationRules.updateProfile, updateUserProfile);
router.post('/logout', protect, logoutUser);
router.post('/upload-avatar', protect, uploadLimiter, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);
router.post('/send-verification-email', protect, sendVerificationEmail);

module.exports = router;
