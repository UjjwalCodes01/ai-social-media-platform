const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Mock user database (same as auth.js - in real app, use shared database)
let users = [
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
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        connectedAccounts: user.connectedAccounts
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== users[userIndex].email) {
      const emailExists = users.find(u => u.email === email && u.id !== req.user.id);
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Update user
    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: users[userIndex].id,
        name: users[userIndex].name,
        email: users[userIndex].email,
        profileImage: users[userIndex].profileImage,
        createdAt: users[userIndex].createdAt,
        connectedAccounts: users[userIndex].connectedAccounts
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user/connected-accounts
// @desc    Get connected social media accounts
// @access  Private
router.get('/connected-accounts', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      connectedAccounts: user.connectedAccounts
    });
  } catch (error) {
    console.error('Connected accounts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/user/connect-account
// @desc    Connect a social media account
// @access  Private
router.post('/connect-account', authenticateToken, [
  body('platform').isIn(['twitter', 'linkedin', 'instagram']).withMessage('Invalid platform'),
  body('username').notEmpty().withMessage('Username is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { platform, username } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update connected account
    users[userIndex].connectedAccounts[platform] = {
      connected: true,
      username: username
    };

    res.json({
      success: true,
      message: `${platform} account connected successfully`,
      connectedAccounts: users[userIndex].connectedAccounts
    });

  } catch (error) {
    console.error('Account connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/user/disconnect-account
// @desc    Disconnect a social media account
// @access  Private
router.post('/disconnect-account', authenticateToken, [
  body('platform').isIn(['twitter', 'linkedin', 'instagram']).withMessage('Invalid platform')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { platform } = req.body;
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Disconnect account
    users[userIndex].connectedAccounts[platform] = {
      connected: false,
      username: null
    };

    res.json({
      success: true,
      message: `${platform} account disconnected successfully`,
      connectedAccounts: users[userIndex].connectedAccounts
    });

  } catch (error) {
    console.error('Account disconnection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;