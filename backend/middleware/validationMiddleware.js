const { body, param, query, validationResult } = require('express-validator');

// General validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation error',
      errors: errors.array() 
    });
  }
  next();
};

// User validation rules
const userValidationRules = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
      // Removed .normalizeEmail() as it strips dots from Gmail addresses
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    handleValidationErrors
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
      // Removed .normalizeEmail() as it strips dots from Gmail addresses
    body('password')
      .notEmpty().withMessage('Password is required'),
    handleValidationErrors
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email'),
      // Removed .normalizeEmail() as it strips dots from Gmail addresses
    body('password')
      .optional()
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    handleValidationErrors
  ]
};

// Task validation rules
const taskValidationRules = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    handleValidationErrors
  ],
  
  update: [
    param('id')
      .isMongoId().withMessage('Invalid task ID'),
    body('title')
      .optional()
      .trim()
      .notEmpty().withMessage('Title cannot be empty')
      .isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('status')
      .optional()
      .isIn(['pending', 'in-progress', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    handleValidationErrors
  ],
  
  delete: [
    param('id')
      .isMongoId().withMessage('Invalid task ID'),
    handleValidationErrors
  ]
};

// Email validation rules
const emailValidationRules = {
  extract: [
    param('id')
      .isMongoId().withMessage('Invalid email ID'),
    handleValidationErrors
  ],
  
  sync: [
    body('maxEmails')
      .optional()
      .isInt({ min: 1, max: 500 }).withMessage('Max emails must be between 1 and 500'),
    handleValidationErrors
  ]
};

// Follow-up validation rules
const followupValidationRules = {
  create: [
    body('subject')
      .trim()
      .notEmpty().withMessage('Subject is required')
      .isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
    body('contactEmail')
      .trim()
      .notEmpty().withMessage('Contact email is required')
      .isEmail().withMessage('Please provide a valid email'),
      // Removed .normalizeEmail() as it strips dots from Gmail addresses
    body('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isISO8601().withMessage('Invalid date format'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    handleValidationErrors
  ],
  
  update: [
    param('id')
      .isMongoId().withMessage('Invalid follow-up ID'),
    body('subject')
      .optional()
      .trim()
      .notEmpty().withMessage('Subject cannot be empty')
      .isLength({ min: 1, max: 200 }).withMessage('Subject must be between 1 and 200 characters'),
    body('contactEmail')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email'),
      // Removed .normalizeEmail() as it strips dots from Gmail addresses
    body('dueDate')
      .optional()
      .isISO8601().withMessage('Invalid date format'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    handleValidationErrors
  ]
};

// Focus session validation rules
const focusValidationRules = {
  start: [
    body('duration')
      .notEmpty().withMessage('Duration is required')
      .isInt({ min: 5, max: 240 }).withMessage('Duration must be between 5 and 240 minutes'),
    body('sessionType')
      .optional()
      .isIn(['deep_work', 'regular', 'light', 'creative'])
      .withMessage('Invalid session type'),
    body('tasks')
      .optional()
      .isArray().withMessage('Tasks must be an array')
      .custom((value) => {
        if (value && value.length > 0) {
          return value.every(id => /^[0-9a-fA-F]{24}$/.test(id));
        }
        return true;
      }).withMessage('Invalid task IDs'),
    handleValidationErrors
  ],
  
  update: [
    param('id')
      .isMongoId().withMessage('Invalid session ID'),
    body('focusScore')
      .optional()
      .isInt({ min: 0, max: 100 }).withMessage('Focus score must be between 0 and 100'),
    handleValidationErrors
  ]
};

// Sanitize MongoDB query
const sanitizeQuery = (req, res, next) => {
  // Remove any MongoDB operators from query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string' && req.query[key].startsWith('$')) {
        delete req.query[key];
      }
    });
  }
  next();
};

module.exports = {
  userValidationRules,
  taskValidationRules,
  emailValidationRules,
  followupValidationRules,
  focusValidationRules,
  sanitizeQuery,
  handleValidationErrors
};