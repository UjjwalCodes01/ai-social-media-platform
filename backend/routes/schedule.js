const express = require('express');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Mock scheduled posts storage
let scheduledPosts = [
  {
    id: 1,
    userId: 1,
    content: "🚀 Just launched our new AI-powered analytics dashboard! The future of social media management is here...",
    platform: 'twitter',
    scheduledDate: '2025-09-27',
    scheduledTime: '09:00',
    status: 'scheduled',
    createdAt: new Date('2025-09-26T10:00:00Z')
  },
  {
    id: 2,
    userId: 1,
    content: "The key to successful content marketing: Understanding your audience, creating value, and staying consistent...",
    platform: 'linkedin',
    scheduledDate: '2025-09-27',
    scheduledTime: '14:30',
    status: 'scheduled',
    createdAt: new Date('2025-09-26T11:00:00Z')
  },
  {
    id: 3,
    userId: 1,
    content: "Pro tip: The best time to post on social media varies by platform and audience. Let AI help you find the optimal timing...",
    platform: 'twitter',
    scheduledDate: '2025-09-28',
    scheduledTime: '11:15',
    status: 'scheduled',
    createdAt: new Date('2025-09-26T12:00:00Z')
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

// @route   GET /api/schedule/posts
// @desc    Get scheduled posts for user
// @access  Private
router.get('/posts', authenticateToken, (req, res) => {
  try {
    const { status, platform, startDate, endDate, limit, offset } = req.query;
    
    let userPosts = scheduledPosts.filter(post => post.userId === req.userId);
    
    // Filter by status
    if (status) {
      userPosts = userPosts.filter(post => post.status === status);
    }
    
    // Filter by platform
    if (platform) {
      userPosts = userPosts.filter(post => post.platform === platform);
    }
    
    // Filter by date range
    if (startDate) {
      userPosts = userPosts.filter(post => post.scheduledDate >= startDate);
    }
    
    if (endDate) {
      userPosts = userPosts.filter(post => post.scheduledDate <= endDate);
    }
    
    // Sort by scheduled date and time
    userPosts.sort((a, b) => {
      const dateTimeA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
      const dateTimeB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
      return dateTimeA - dateTimeB;
    });
    
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
    console.error('Scheduled posts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/schedule/posts
// @desc    Create a scheduled post
// @access  Private
router.post('/posts', authenticateToken, [
  body('content').notEmpty().withMessage('Content is required'),
  body('platform').isIn(['twitter', 'linkedin', 'instagram']).withMessage('Invalid platform'),
  body('scheduledDate').isISO8601().withMessage('Invalid date format'),
  body('scheduledTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format')
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

    const { content, platform, scheduledDate, scheduledTime, mediaUrls, tags } = req.body;
    
    // Validate future date
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Scheduled date and time must be in the future'
      });
    }
    
    const newPost = {
      id: scheduledPosts.length + 1,
      userId: req.userId,
      content,
      platform,
      scheduledDate,
      scheduledTime,
      status: 'scheduled',
      mediaUrls: mediaUrls || [],
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    scheduledPosts.push(newPost);

    res.status(201).json({
      success: true,
      message: 'Post scheduled successfully',
      post: newPost
    });

  } catch (error) {
    console.error('Post scheduling error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/schedule/posts/:id
// @desc    Update a scheduled post
// @access  Private
router.put('/posts/:id', authenticateToken, [
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
    const postIndex = scheduledPosts.findIndex(p => p.id === postId && p.userId === req.userId);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled post not found'
      });
    }

    // Check if post is already published
    if (scheduledPosts[postIndex].status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update published post'
      });
    }

    const { content, platform, scheduledDate, scheduledTime, mediaUrls, tags } = req.body;
    
    // Validate future date if provided
    if (scheduledDate && scheduledTime) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled date and time must be in the future'
        });
      }
    }
    
    // Update post fields
    if (content) scheduledPosts[postIndex].content = content;
    if (platform) scheduledPosts[postIndex].platform = platform;
    if (scheduledDate) scheduledPosts[postIndex].scheduledDate = scheduledDate;
    if (scheduledTime) scheduledPosts[postIndex].scheduledTime = scheduledTime;
    if (mediaUrls) scheduledPosts[postIndex].mediaUrls = mediaUrls;
    if (tags) scheduledPosts[postIndex].tags = tags;
    
    scheduledPosts[postIndex].updatedAt = new Date();

    res.json({
      success: true,
      message: 'Scheduled post updated successfully',
      post: scheduledPosts[postIndex]
    });

  } catch (error) {
    console.error('Scheduled post update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/schedule/posts/:id
// @desc    Delete a scheduled post
// @access  Private
router.delete('/posts/:id', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const postIndex = scheduledPosts.findIndex(p => p.id === postId && p.userId === req.userId);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled post not found'
      });
    }

    // Check if post is already published
    if (scheduledPosts[postIndex].status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete published post'
      });
    }

    scheduledPosts.splice(postIndex, 1);

    res.json({
      success: true,
      message: 'Scheduled post deleted successfully'
    });

  } catch (error) {
    console.error('Scheduled post deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/schedule/calendar
// @desc    Get calendar view of scheduled posts
// @access  Private
router.get('/calendar', authenticateToken, (req, res) => {
  try {
    const { month, year } = req.query;
    
    let userPosts = scheduledPosts.filter(post => post.userId === req.userId);
    
    // Filter by month and year if provided
    if (month && year) {
      userPosts = userPosts.filter(post => {
        const postDate = new Date(post.scheduledDate);
        return postDate.getMonth() === parseInt(month) - 1 && postDate.getFullYear() === parseInt(year);
      });
    }
    
    // Group posts by date
    const calendarData = userPosts.reduce((acc, post) => {
      const date = post.scheduledDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(post);
      return acc;
    }, {});
    
    // Sort posts within each date by time
    Object.keys(calendarData).forEach(date => {
      calendarData[date].sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
    });
    
    res.json({
      success: true,
      calendar: calendarData,
      month: month ? parseInt(month) : new Date().getMonth() + 1,
      year: year ? parseInt(year) : new Date().getFullYear(),
      totalPosts: userPosts.length
    });
    
  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/schedule/upcoming
// @desc    Get upcoming posts (next 7 days)
// @access  Private
router.get('/upcoming', authenticateToken, (req, res) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const upcomingPosts = scheduledPosts
      .filter(post => {
        if (post.userId !== req.userId || post.status !== 'scheduled') return false;
        
        const postDateTime = new Date(`${post.scheduledDate}T${post.scheduledTime}`);
        return postDateTime >= now && postDateTime <= sevenDaysFromNow;
      })
      .sort((a, b) => {
        const dateTimeA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
        const dateTimeB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
        return dateTimeA - dateTimeB;
      })
      .slice(0, 10); // Limit to 10 posts
    
    res.json({
      success: true,
      upcomingPosts,
      count: upcomingPosts.length
    });
    
  } catch (error) {
    console.error('Upcoming posts fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/schedule/posts/:id/publish-now
// @desc    Publish a scheduled post immediately
// @access  Private
router.post('/posts/:id/publish-now', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const postIndex = scheduledPosts.findIndex(p => p.id === postId && p.userId === req.userId);
    
    if (postIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled post not found'
      });
    }

    if (scheduledPosts[postIndex].status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Post is not in scheduled status'
      });
    }

    // Update post status
    scheduledPosts[postIndex].status = 'published';
    scheduledPosts[postIndex].publishedAt = new Date();
    scheduledPosts[postIndex].updatedAt = new Date();

    res.json({
      success: true,
      message: 'Post published successfully',
      post: scheduledPosts[postIndex]
    });

  } catch (error) {
    console.error('Immediate publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Cron job to publish scheduled posts (runs every minute)
cron.schedule('* * * * *', () => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  
  scheduledPosts.forEach((post, index) => {
    if (post.status === 'scheduled' && 
        post.scheduledDate === currentDate && 
        post.scheduledTime === currentTime) {
      
      console.log(`Publishing scheduled post ${post.id} to ${post.platform}`);
      
      // Update post status
      scheduledPosts[index].status = 'published';
      scheduledPosts[index].publishedAt = now;
      scheduledPosts[index].updatedAt = now;
      
      // Here you would integrate with actual social media APIs
      // For now, we just log the action
    }
  });
});

module.exports = router;