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

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/google', googleAuth);
router.get('/google/callback', googleAuth); // Add callback route
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.get('/verify-email/:token', verifyEmail);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/logout', protect, logoutUser);
router.post('/upload-avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, deleteAvatar);
router.post('/send-verification-email', protect, sendVerificationEmail);

module.exports = router;
