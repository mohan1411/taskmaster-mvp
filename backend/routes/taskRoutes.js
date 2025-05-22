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

// All routes are protected
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

router.post('/extract', extractTasksFromText);
router.post('/save-extracted', saveExtractedTasks);
router.get('/analytics', getTaskAnalytics);
router.get('/count', getTaskCountByEmail);

module.exports = router;
