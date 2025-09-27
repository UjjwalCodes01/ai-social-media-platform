const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Mock social media API responses
const mockSocialMediaResponses = {
  twitter: {
    success: true,
    postId: 'tw_' + Date.now(),
    url: 'https://twitter.com/user/status/1234567890',
    platform: 'twitter'
  },
  linkedin: {
    success: true,
    postId: 'li_' + Date.now(),
    url: 'https://linkedin.com/posts/activity-1234567890',
    platform: 'linkedin'
  },
  instagram: {
    success: true,
    postId: 'ig_' + Date.now(),
    url: 'https://instagram.com/p/ABC123DEF456/',
    platform: 'instagram'
  }
};

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

// @route   POST /api/social/publish
// @desc    Publish content to social media platforms
// @access  Private
router.post('/publish', authenticateToken, [
  body('content').notEmpty().withMessage('Content is required'),
  body('platforms').isArray().withMessage('Platforms must be an array'),
  body('platforms.*').isIn(['twitter', 'linkedin', 'instagram']).withMessage('Invalid platform')
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

    const { content, platforms, mediaUrls } = req.body;
    
    // Simulate API calls to social media platforms
    const publishResults = [];
    
    for (const platform of platforms) {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Mock successful publish
        const result = {
          ...mockSocialMediaResponses[platform],
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          publishedAt: new Date(),
          mediaCount: mediaUrls ? mediaUrls.length : 0
        };
        
        publishResults.push(result);
      } catch (error) {
        publishResults.push({
          success: false,
          platform,
          error: `Failed to publish to ${platform}`,
          message: error.message
        });
      }
    }
    
    const successCount = publishResults.filter(r => r.success).length;
    const totalCount = publishResults.length;
    
    res.json({
      success: successCount > 0,
      message: `Published to ${successCount}/${totalCount} platforms successfully`,
      results: publishResults,
      summary: {
        total: totalCount,
        successful: successCount,
        failed: totalCount - successCount
      }
    });

  } catch (error) {
    console.error('Social publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during publishing'
    });
  }
});

// @route   POST /api/social/schedule
// @desc    Schedule content for future publishing
// @access  Private
router.post('/schedule', authenticateToken, [
  body('content').notEmpty().withMessage('Content is required'),
  body('platforms').isArray().withMessage('Platforms must be an array'),
  body('platforms.*').isIn(['twitter', 'linkedin', 'instagram']).withMessage('Invalid platform'),
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

    const { content, platforms, scheduledDate, scheduledTime, mediaUrls } = req.body;
    
    // Create scheduled posts for each platform
    const scheduledPosts = platforms.map(platform => ({
      id: `scheduled_${platform}_${Date.now()}`,
      platform,
      content,
      scheduledDate,
      scheduledTime,
      mediaUrls: mediaUrls || [],
      status: 'scheduled',
      userId: req.userId,
      createdAt: new Date()
    }));
    
    res.json({
      success: true,
      message: `Content scheduled for ${platforms.length} platform(s)`,
      scheduledPosts,
      scheduledFor: `${scheduledDate} at ${scheduledTime}`
    });

  } catch (error) {
    console.error('Social schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during scheduling'
    });
  }
});

// @route   GET /api/social/platforms/status
// @desc    Check connection status of social media platforms
// @access  Private
router.get('/platforms/status', authenticateToken, (req, res) => {
  try {
    // Mock platform connection status
    const platformStatus = {
      twitter: {
        connected: true,
        username: '@johndoe',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'active',
        rateLimitRemaining: 275,
        rateLimitReset: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      },
      linkedin: {
        connected: true,
        username: 'John Doe',
        lastSync: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        status: 'active',
        rateLimitRemaining: 95,
        rateLimitReset: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      },
      instagram: {
        connected: false,
        username: null,
        lastSync: null,
        status: 'disconnected',
        rateLimitRemaining: 0,
        rateLimitReset: null
      }
    };

    res.json({
      success: true,
      platforms: platformStatus,
      summary: {
        total: 3,
        connected: 2,
        active: 2
      }
    });

  } catch (error) {
    console.error('Platform status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/social/platforms/connect
// @desc    Connect to a social media platform (OAuth simulation)
// @access  Private
router.post('/platforms/connect', authenticateToken, [
  body('platform').isIn(['twitter', 'linkedin', 'instagram']).withMessage('Invalid platform'),
  body('accessToken').notEmpty().withMessage('Access token is required')
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

    const { platform, accessToken, refreshToken } = req.body;
    
    // Simulate OAuth validation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock successful connection
    const connectionResult = {
      platform,
      connected: true,
      username: platform === 'twitter' ? '@johndoe' : 'John Doe',
      userId: `${platform}_user_123`,
      connectedAt: new Date(),
      permissions: ['read', 'write', 'manage'],
      profileInfo: {
        name: 'John Doe',
        followers: Math.floor(Math.random() * 5000) + 1000,
        following: Math.floor(Math.random() * 1000) + 100,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${platform}`
      }
    };
    
    res.json({
      success: true,
      message: `Successfully connected to ${platform}`,
      connection: connectionResult
    });

  } catch (error) {
    console.error('Platform connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to platform'
    });
  }
});

// @route   POST /api/social/platforms/disconnect
// @desc    Disconnect from a social media platform
// @access  Private
router.post('/platforms/disconnect', authenticateToken, [
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
    
    res.json({
      success: true,
      message: `Successfully disconnected from ${platform}`,
      platform,
      disconnectedAt: new Date()
    });

  } catch (error) {
    console.error('Platform disconnection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/social/content/suggestions
// @desc    Get AI-powered content suggestions
// @access  Private
router.get('/content/suggestions', authenticateToken, (req, res) => {
  try {
    const { topic, platform, tone = 'professional' } = req.query;
    
    // Mock AI-generated content suggestions
    const suggestions = [
      {
        id: 1,
        content: `🚀 Exciting news! ${topic || 'Our latest project'} is making waves in the industry. Here's what makes it special and why you should care...`,
        tone,
        platform: platform || 'general',
        engagement_score: 8.5,
        hashtags: ['#innovation', '#technology', '#growth'],
        estimated_reach: '2.5K - 5K'
      },
      {
        id: 2,
        content: `Did you know that ${topic || 'industry insights'} can transform your business? Here are 3 key takeaways that every professional should know:`,
        tone,
        platform: platform || 'general',
        engagement_score: 7.8,
        hashtags: ['#business', '#insights', '#professional'],
        estimated_reach: '1.8K - 3.5K'
      },
      {
        id: 3,
        content: `Behind the scenes: The story of ${topic || 'our journey'} and the lessons we've learned along the way. Thread 🧵`,
        tone,
        platform: platform || 'general',
        engagement_score: 9.2,
        hashtags: ['#behindthescenes', '#story', '#lessons'],
        estimated_reach: '3K - 6K'
      }
    ];
    
    res.json({
      success: true,
      suggestions,
      parameters: {
        topic: topic || 'general',
        platform: platform || 'all',
        tone
      }
    });

  } catch (error) {
    console.error('Content suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;