const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - priority
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the task
 *         title:
 *           type: string
 *           description: Task title
 *           example: "Complete quarterly report"
 *         description:
 *           type: string
 *           description: Detailed task description
 *           example: "Compile all department reports and create executive summary"
 *         category:
 *           type: string
 *           enum: [work, personal, health, learning, other]
 *           description: Task category
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Task priority level
 *         status:
 *           type: string
 *           enum: [todo, in-progress, completed, cancelled]
 *           default: todo
 *           description: Current task status
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Task due date
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Task completion timestamp
 *         estimatedDuration:
 *           type: number
 *           description: Estimated duration in minutes
 *           example: 60
 *         actualDuration:
 *           type: number
 *           description: Actual time spent in minutes
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["urgent", "client", "presentation"]
 *         reminder:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *             time:
 *               type: string
 *               format: date-time
 *         emailId:
 *           type: string
 *           description: Associated email ID if task was extracted from email
 *         user:
 *           type: string
 *           description: User ID who owns the task
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ExtractTasksRequest:
 *       type: object
 *       required:
 *         - text
 *       properties:
 *         text:
 *           type: string
 *           description: Text to extract tasks from
 *           example: "Schedule meeting with John tomorrow at 2pm and prepare presentation by Friday"
 *     TaskAnalytics:
 *       type: object
 *       properties:
 *         totalTasks:
 *           type: integer
 *         completedTasks:
 *           type: integer
 *         pendingTasks:
 *           type: integer
 *         overdueTasks:
 *           type: integer
 *         categoryBreakdown:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         priorityBreakdown:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         completionRate:
 *           type: number
 *           format: float
 *         averageCompletionTime:
 *           type: number
 *           description: Average completion time in hours
 * 
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */
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

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks for the authenticated user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in-progress, completed, cancelled]
 *         description: Filter by task status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [work, personal, health, learning, other]
 *         description: Filter by category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sort field and order (e.g., -createdAt, dueDate)
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalTasks:
 *                   type: integer
 *       401:
 *         description: Not authorized
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Complete project documentation"
 *               description:
 *                 type: string
 *                 example: "Write comprehensive API documentation"
 *               category:
 *                 type: string
 *                 enum: [work, personal, health, learning, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedDuration:
 *                 type: number
 *                 example: 120
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               reminder:
 *                 type: object
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                   time:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authorized
 */
router.route('/')
  .get(getTasks)
  .post(createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Not authorized
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [work, personal, health, learning, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, completed, cancelled]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               estimatedDuration:
 *                 type: number
 *               actualDuration:
 *                 type: number
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       401:
 *         description: Not authorized
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Task removed"
 *       404:
 *         description: Task not found
 *       401:
 *         description: Not authorized
 */
router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Update task status only
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
// Add PATCH route for status updates
router.patch('/:id/status', updateTask);

/**
 * @swagger
 * /api/tasks/extract:
 *   post:
 *     summary: Extract tasks from text using AI
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExtractTasksRequest'
 *     responses:
 *       200:
 *         description: Tasks extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       category:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid request
 *       500:
 *         description: AI service unavailable
 */
router.post('/extract', extractTasksFromText);

/**
 * @swagger
 * /api/tasks/save-extracted:
 *   post:
 *     summary: Save multiple extracted tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tasks
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     category:
 *                       type: string
 *                     priority:
 *                       type: string
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       201:
 *         description: Tasks saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 savedTasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         description: Invalid request
 */
router.post('/save-extracted', saveExtractedTasks);

/**
 * @swagger
 * /api/tasks/analytics:
 *   get:
 *     summary: Get task analytics for the user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *         description: Analytics period
 *     responses:
 *       200:
 *         description: Task analytics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskAnalytics'
 *       401:
 *         description: Not authorized
 */
router.get('/analytics', getTaskAnalytics);

/**
 * @swagger
 * /api/tasks/count:
 *   get:
 *     summary: Get task count by email
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Total number of tasks
 *       401:
 *         description: Not authorized
 */
router.get('/count', getTaskCountByEmail);

module.exports = router;
