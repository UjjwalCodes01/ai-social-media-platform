const jwt = require('jsonwebtoken');

// Mock users database (in production, this would come from your database)
const users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LjYFnvBUrx6/yE3D6',
    createdAt: new Date('2025-09-20'),
    profileImage: null,
    connectedAccounts: {
      twitter: { connected: true, username: '@johndoe' },
      linkedin: { connected: true, username: 'John Doe' },
      instagram: { connected: false, username: null }
    }
  }
];

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user in mock database
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found.',
        code: 'INVALID_USER'
      });
    }
    
    // Attach user info to request
    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    let message = 'Invalid token.';
    let code = 'INVALID_TOKEN';
    
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired.';
      code = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Malformed token.';
      code = 'MALFORMED_TOKEN';
    }
    
    return res.status(401).json({
      success: false,
      message,
      code
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  if (!token) {
    req.user = null;
    req.userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    req.user = user || null;
    req.userId = user ? user.id : null;
    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    req.user = null;
    req.userId = null;
    next();
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }
  
  next();
};

// Rate limiting helper
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  return require('express-rate-limit')({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  createRateLimiter
};