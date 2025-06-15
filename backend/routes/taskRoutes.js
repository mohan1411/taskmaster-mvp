const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  extractTasksFromText,
  saveExtractedTasks,
  getTaskAnalytics,
  getTaskCountByEmail
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { taskValidationRules, sanitizeQuery } = require('../middleware/validationMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
  .get(sanitizeQuery, getTasks)
  .post(taskValidationRules.create, createTask);

router.route('/:id')
  .get(taskValidationRules.delete, getTaskById)
  .put(taskValidationRules.update, updateTask)
  .delete(taskValidationRules.delete, deleteTask);

// Add PATCH route for status updates
router.patch('/:id/status', taskValidationRules.update, updateTask);

router.post('/extract', extractTasksFromText);
router.post('/save-extracted', saveExtractedTasks);
router.get('/analytics', sanitizeQuery, getTaskAnalytics);
router.get('/count', sanitizeQuery, getTaskCountByEmail);

module.exports = router;
