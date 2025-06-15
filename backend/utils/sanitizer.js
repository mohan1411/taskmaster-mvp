const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - The potentially unsafe HTML string
 * @param {object} options - DOMPurify options
 * @returns {string} - Sanitized HTML string
 */
const sanitizeHtml = (dirty, options = {}) => {
  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  };
  
  return DOMPurify.sanitize(dirty, { ...defaultOptions, ...options });
};

/**
 * Sanitize plain text by escaping HTML entities
 * @param {string} text - The text to sanitize
 * @returns {string} - Sanitized text
 */
const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize an object recursively
 * @param {object} obj - The object to sanitize
 * @param {array} skipFields - Fields to skip sanitization
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj, skipFields = []) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (skipFields.includes(key)) {
        sanitized[key] = obj[key];
      } else if (typeof obj[key] === 'string') {
        sanitized[key] = sanitizeText(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key], skipFields);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  
  return sanitized;
};

/**
 * Validate and sanitize email address
 * @param {string} email - The email to validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmedEmail = email.trim().toLowerCase();
  
  return emailRegex.test(trimmedEmail) ? trimmedEmail : null;
};

/**
 * Validate and sanitize URL
 * @param {string} url - The URL to validate
 * @returns {string|null} - Sanitized URL or null if invalid
 */
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    return urlObj.toString();
  } catch (e) {
    return null;
  }
};

/**
 * Remove any MongoDB operators from an object to prevent injection
 * @param {object} obj - The object to clean
 * @returns {object} - Cleaned object
 */
const removeMongoOperators = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const cleaned = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Skip keys that start with $
      if (typeof key === 'string' && key.startsWith('$')) {
        continue;
      }
      
      if (typeof obj[key] === 'object') {
        cleaned[key] = removeMongoOperators(obj[key]);
      } else {
        cleaned[key] = obj[key];
      }
    }
  }
  
  return cleaned;
};

module.exports = {
  sanitizeHtml,
  sanitizeText,
  sanitizeObject,
  sanitizeEmail,
  sanitizeUrl,
  removeMongoOperators
};