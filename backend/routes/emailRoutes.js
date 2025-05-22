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

// All routes are protected
router.use(protect);

router.route('/')
  .get(getEmails);

router.post('/sync', syncEmails);
router.get('/labels', getEmailLabels);
router.get('/analytics', getEmailAnalytics);
router.post('/connect-gmail', connectGmail);
router.get('/check-connection', checkGmailConnection);
router.get('/auth-url', getGmailAuthUrl);
router.post('/disconnect', disconnectGmail);

router.route('/:id')
  .get(getEmailById);

router.post('/:id/extract', extractTasksFromEmail);
router.post('/:id/detect-followup', detectFollowUp);

module.exports = router;
