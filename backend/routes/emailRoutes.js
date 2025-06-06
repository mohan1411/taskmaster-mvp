const express = require('express');
const router = express.Router();
const {
  syncEmails,
  getEmails,
  getEmailById,
  extractTasksFromEmail,
  getEmailLabels,
  getEmailAnalytics,
  connectGmail,
  checkGmailConnection,
  getGmailAuthUrl,
  disconnectGmail
} = require('../controllers/emailController');
const { detectFollowUp } = require('../controllers/followupController');
const { protect } = require('../middleware/authMiddleware');

// Debug route to check config (no auth required for testing)
router.get('/debug-config', (req, res) => {
  const config = require('../config/config');
  res.json({
    nodeEnv: process.env.NODE_ENV,
    googleCallbackUrl: config.googleCallbackUrl,
    googleCallbackUrlEnv: process.env.GOOGLE_CALLBACK_URL,
    allEnvVars: Object.keys(process.env).filter(key => key.includes('GOOGLE'))
  });
});

// All routes are protected except debug
router.use(protect);

router.route('/')
  .get(getEmails);

router.post('/sync', syncEmails);
router.get('/labels', getEmailLabels);
router.get('/analytics', getEmailAnalytics);
router.get('/stats', getEmailAnalytics); // Add stats alias
router.post('/connect-gmail', connectGmail);
router.get('/check-connection', checkGmailConnection);
router.get('/auth-url', getGmailAuthUrl);
router.post('/disconnect', disconnectGmail);

router.route('/:id')
  .get(getEmailById);

router.post('/:id/extract', extractTasksFromEmail);
router.post('/:id/detect-followup', detectFollowUp);

module.exports = router;
