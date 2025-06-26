# Swagger Annotation Guide for FizzTask

## Overview
This guide shows how to add Swagger/OpenAPI annotations to document your routes.

## Basic Structure

### 1. Define Schemas (Models)
Add at the top of your route file:

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [todo, in-progress, completed]
 *           default: todo
 *         createdAt:
 *           type: string
 *           format: date-time
 */
```

### 2. Document Endpoints

#### GET Endpoint (List with filters)
```javascript
/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in-progress, completed]
 *         description: Filter by status
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
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 */
router.get('/', auth, getTasks);
```

#### POST Endpoint
```javascript
/**
 * @swagger
 * /api/tasks:
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Complete project documentation"
 *               description:
 *                 type: string
 *                 example: "Write comprehensive API docs"
 *               category:
 *                 type: string
 *                 enum: [work, personal, health, learning]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-01-20T10:00:00Z"
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Title is required"
 */
router.post('/', auth, createTask);
```

#### PUT/PATCH Endpoint
```javascript
/**
 * @swagger
 * /api/tasks/{id}:
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
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, completed]
 *     responses:
 *       200:
 *         description: Task updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
router.put('/:id', auth, updateTask);
```

#### DELETE Endpoint
```javascript
/**
 * @swagger
 * /api/tasks/{id}:
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
 *         description: Task ID to delete
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
 *                   example: "Task deleted successfully"
 *       404:
 *         description: Task not found
 */
router.delete('/:id', auth, deleteTask);
```

#### Complex Endpoint (with file upload)
```javascript
/**
 * @swagger
 * /api/emails/{id}/attachments:
 *   post:
 *     summary: Upload attachment to email
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               description:
 *                 type: string
 *                 description: File description
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
```

## Common Patterns

### 1. Pagination Response
```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             type: object
 *         page:
 *           type: integer
 *         pages:
 *           type: integer
 *         total:
 *           type: integer
 *         limit:
 *           type: integer
 */
```

### 2. Error Response
```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 */
```

### 3. Reusable Parameters
```javascript
/**
 * @swagger
 * components:
 *   parameters:
 *     idParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *       description: Resource ID
 *     pageParam:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         default: 1
 *       description: Page number
 */
```

## Tips

1. **Group endpoints with tags:**
   ```javascript
   tags: [Tasks]  // Groups all task endpoints together
   ```

2. **Add examples:**
   ```javascript
   example: "Complete project documentation"
   ```

3. **Use references for reusability:**
   ```javascript
   $ref: '#/components/schemas/Task'
   ```

4. **Document all status codes:**
   - 200: Success
   - 201: Created
   - 400: Bad Request
   - 401: Unauthorized
   - 404: Not Found
   - 500: Server Error

5. **Security definitions:**
   - For public endpoints: `security: []`
   - For protected endpoints: `security: [{ bearerAuth: [] }]`

## Implementation Steps

1. Add schema definitions at the top of your route file
2. Add endpoint documentation above each route
3. Make sure the swagger config includes your route file path
4. Restart server to see changes in Swagger UI

## Example for Focus Routes

```javascript
// In focusRoutes.js

/**
 * @swagger
 * components:
 *   schemas:
 *     FocusSession:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           type: string
 *         tasks:
 *           type: array
 *           items:
 *             type: string
 *         startTime:
 *           type: string
 *           format: date-time
 *         plannedDuration:
 *           type: integer
 *           description: Duration in minutes
 *         status:
 *           type: string
 *           enum: [active, completed, paused, abandoned]
 */

/**
 * @swagger
 * /api/focus/sessions/start:
 *   post:
 *     summary: Start a new focus session
 *     tags: [Focus Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *               - sessionDuration
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               sessionDuration:
 *                 type: integer
 *                 description: Duration in minutes
 *                 example: 25
 *               sessionType:
 *                 type: string
 *                 enum: [pomodoro, deep-work, custom]
 *     responses:
 *       201:
 *         description: Session started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FocusSession'
 */
```