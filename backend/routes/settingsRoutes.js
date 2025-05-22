const express = require('express');
const router = express.Router();
const {
  getUserSettings,
  updateUserSettings,
  connectGoogleAccount,
  disconnectGoogleAccount,
  getGoogleAuthUrl,
  checkGoogleConnection
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getUserSettings)
  .put(updateUserSettings);

router.post('/connect-google', connectGoogleAccount);
router.post('/disconnect-google', disconnectGoogleAccount);
router.get('/google-auth-url', getGoogleAuthUrl);
router.get('/check-google-connection', checkGoogleConnection);

module.exports = router;
