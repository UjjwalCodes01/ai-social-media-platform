/**
 * Utility functions for API responses
 */

/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Standard error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {*} errors - Additional error details
 */
const errorResponse = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} validationErrors - Array of validation errors
 */
const validationErrorResponse = (res, validationErrors) => {
  return errorResponse(res, 'Validation failed', 400, validationErrors);
};

/**
 * Server error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
const serverErrorResponse = (res, error = null) => {
  console.error('Server Error:', error);
  
  const message = process.env.NODE_ENV === 'development' && error 
    ? error.message 
    : 'Internal server error';
    
  return errorResponse(res, message, 500);
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource type (e.g., 'User', 'Post')
 */
const notFoundResponse = (res, resource = 'Resource') => {
  return errorResponse(res, `${resource} not found`, 404);
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, message, 401);
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, message, 403);
};

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 */
const paginatedResponse = (res, data, total, page = 1, limit = 20, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  
  return res.json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Format user object (remove sensitive data)
 * @param {Object} user - User object
 * @returns {Object} Sanitized user object
 */
const formatUser = (user) => {
  if (!user) return null;
  
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

/**
 * Format post object
 * @param {Object} post - Post object
 * @returns {Object} Formatted post object
 */
const formatPost = (post) => {
  if (!post) return null;
  
  return {
    ...post,
    scheduledDateTime: post.scheduledDate && post.scheduledTime 
      ? `${post.scheduledDate}T${post.scheduledTime}:00.000Z`
      : null
  };
};

/**
 * Generate pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 */
const generatePaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    offset: (page - 1) * limit
  };
};

/**
 * Async wrapper to catch errors
 * @param {Function} fn - Async function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Parse query parameters with defaults
 * @param {Object} query - Request query object
 * @returns {Object} Parsed query parameters
 */
const parseQueryParams = (query) => {
  return {
    page: parseInt(query.page) || 1,
    limit: Math.min(parseInt(query.limit) || 20, 100), // Max 100 items per page
    offset: ((parseInt(query.page) || 1) - 1) * (Math.min(parseInt(query.limit) || 20, 100)),
    sortBy: query.sortBy || 'createdAt',
    sortOrder: (query.sortOrder === 'asc') ? 'asc' : 'desc',
    search: query.search || '',
    filter: query.filter || {}
  };
};

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Is valid date
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate time string (HH:MM format)
 * @param {string} timeString - Time string to validate
 * @returns {boolean} Is valid time
 */
const isValidTime = (timeString) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * Generate a random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Sanitize content for social media posting
 * @param {string} content - Content to sanitize
 * @param {string} platform - Target platform
 * @returns {Object} Sanitized content with metadata
 */
const sanitizeContent = (content, platform) => {
  let sanitized = content.trim();
  
  // Platform-specific character limits
  const limits = {
    twitter: 280,
    linkedin: 3000,
    instagram: 2200
  };
  
  const limit = limits[platform] || 280;
  const isTruncated = sanitized.length > limit;
  
  if (isTruncated) {
    sanitized = sanitized.substring(0, limit - 3) + '...';
  }
  
  // Extract hashtags
  const hashtags = (content.match(/#\w+/g) || []).map(tag => tag.toLowerCase());
  
  // Extract mentions
  const mentions = (content.match(/@\w+/g) || []).map(mention => mention.toLowerCase());
  
  return {
    content: sanitized,
    originalLength: content.length,
    finalLength: sanitized.length,
    isTruncated,
    hashtags: [...new Set(hashtags)], // Remove duplicates
    mentions: [...new Set(mentions)], // Remove duplicates
    characterLimit: limit
  };
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  serverErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse,
  formatUser,
  formatPost,
  generatePaginationMeta,
  asyncHandler,
  parseQueryParams,
  isValidDate,
  isValidTime,
  generateRandomString,
  sanitizeContent
};