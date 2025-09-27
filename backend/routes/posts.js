const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const TwitterService = require('../services/TwitterService');
const LinkedInService = require('../services/LinkedInService');
const router = express.Router();

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
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// @route   GET /api/posts
// @desc    Get all posts for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, platform, limit = 10, offset = 0 } = req.query;
    
    // Build query filter
    const filter = { user: req.userId };
    if (status) filter.status = status;
    if (platform) filter.platforms = { $in: [platform] };

    const userPosts = await Post.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ createdAt: -1 });

    const total = await Post.countDocuments(filter);
    
    res.json({
      success: true,
      posts: userPosts,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Posts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', authenticateToken, [
  body('content').notEmpty().withMessage('Content is required'),
  body('platforms').isArray().withMessage('Platforms must be an array'),
  body('platforms.*').isIn(['twitter', 'linkedin', 'instagram', 'facebook']).withMessage('Invalid platform'),
  body('scheduledDate').optional().isISO8601().withMessage('Invalid date format'),
  body('scheduledTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { content, platforms, scheduledDate, scheduledTime, publishNow, media } = req.body;
    
    // Create scheduled datetime
    let scheduledFor = null;
    if (scheduledDate && scheduledTime) {
      scheduledFor = new Date(`${scheduledDate}T${scheduledTime}:00.000Z`);
    }

    const newPost = await Post.create({
      user: req.userId,
      content,
      platforms,
      media: media || [],
      scheduledFor,
      status: publishNow ? 'published' : (scheduledFor ? 'scheduled' : 'draft')
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: newPost
    });

  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findOne({ _id: postId, user: req.userId });
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    res.json({
      success: true,
      post
    });
    
  } catch (error) {
    console.error('Post fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', authenticateToken, [
  body('content').optional().notEmpty().withMessage('Content cannot be empty'),
  body('platform').optional().isIn(['twitter', 'linkedin', 'instagram']).withMessage('Invalid platform'),
  body('scheduledDate').optional().isISO8601().withMessage('Invalid date format'),
  body('scheduledTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
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

    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId && p.userId === req.userId);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const { content, platform, scheduledDate, scheduledTime } = req.body;
    
    // Update post fields
    if (content) posts[postIndex].content = content;
    if (platform) posts[postIndex].platform = platform;
    if (scheduledDate) posts[postIndex].scheduledDate = scheduledDate;
    if (scheduledTime) posts[postIndex].scheduledTime = scheduledTime;

    res.json({
      success: true,
      message: 'Post updated successfully',
      post: posts[postIndex]
    });

  } catch (error) {
    console.error('Post update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId && p.userId === req.userId);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    posts.splice(postIndex, 1);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/posts/:id/publish
// @desc    Publish a scheduled post immediately
// @access  Private
router.post('/:id/publish', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId && p.userId === req.userId);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (posts[postIndex].status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Post is already published'
      });
    }

    // Update post status
    posts[postIndex].status = 'published';
    posts[postIndex].publishedAt = new Date();

    res.json({
      success: true,
      message: 'Post published successfully',
      post: posts[postIndex]
    });

  } catch (error) {
    console.error('Post publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;