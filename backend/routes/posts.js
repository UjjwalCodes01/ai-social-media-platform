const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Mock data
let posts = [
  {
    id: 1,
    userId: 1,
    content: "🚀 Just launched our new AI-powered analytics dashboard! The future of social media management is here...",
    platform: 'twitter',
    scheduledDate: '2025-09-27',
    scheduledTime: '09:00',
    status: 'scheduled',
    createdAt: new Date('2025-09-26T10:00:00Z'),
    publishedAt: null,
    engagement: {
      likes: 245,
      shares: 89,
      comments: 34,
      reach: 15600
    }
  },
  {
    id: 2,
    userId: 1,
    content: "The key to successful content marketing: Understanding your audience, creating value, and staying consistent...",
    platform: 'linkedin',
    scheduledDate: '2025-09-27',
    scheduledTime: '14:30',
    status: 'scheduled',
    createdAt: new Date('2025-09-26T11:00:00Z'),
    publishedAt: null,
    engagement: {
      likes: 198,
      shares: 156,
      comments: 67,
      reach: 12400
    }
  },
  {
    id: 3,
    userId: 1,
    content: "Behind the scenes of our latest product photoshoot ✨ Swipe to see the magic happen!",
    platform: 'instagram',
    scheduledDate: '2025-09-25',
    scheduledTime: '16:00',
    status: 'published',
    createdAt: new Date('2025-09-24T12:00:00Z'),
    publishedAt: new Date('2025-09-25T16:00:00Z'),
    engagement: {
      likes: 287,
      shares: 45,
      comments: 23,
      reach: 9800
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
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, platform, limit, offset } = req.query;
    
    let userPosts = posts.filter(post => post.userId === req.userId);
    
    // Filter by status
    if (status) {
      userPosts = userPosts.filter(post => post.status === status);
    }
    
    // Filter by platform
    if (platform) {
      userPosts = userPosts.filter(post => post.platform === platform);
    }
    
    // Pagination
    const limitNum = parseInt(limit) || 20;
    const offsetNum = parseInt(offset) || 0;
    
    const paginatedPosts = userPosts.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      posts: paginatedPosts,
      total: userPosts.length,
      limit: limitNum,
      offset: offsetNum
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
  body('platform').isIn(['twitter', 'linkedin', 'instagram']).withMessage('Invalid platform'),
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

    const { content, platform, scheduledDate, scheduledTime, publishNow } = req.body;
    
    const newPost = {
      id: posts.length + 1,
      userId: req.userId,
      content,
      platform,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || new Date().toTimeString().slice(0, 5),
      status: publishNow ? 'published' : 'scheduled',
      createdAt: new Date(),
      publishedAt: publishNow ? new Date() : null,
      engagement: {
        likes: 0,
        shares: 0,
        comments: 0,
        reach: 0
      }
    };

    posts.push(newPost);

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
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId && p.userId === req.userId);
    
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