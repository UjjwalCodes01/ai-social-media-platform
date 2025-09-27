const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Post = require('../models/Post');

const router = express.Router();

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
};

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range for filtering
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get user's posts for the time range
    const posts = await Post.find({
      userId: req.userId,
      createdAt: { $gte: startDate, $lte: now }
    });

    // Get user data
    const user = await User.findById(req.userId);
    
    // Calculate metrics from real posts
    const totalPosts = posts.length;
    const totalEngagement = posts.reduce((sum, post) => sum + (post.engagement || 0), 0);
    const totalReach = posts.reduce((sum, post) => sum + (post.reach || 0), 0);
    const totalImpressions = posts.reduce((sum, post) => sum + (post.impressions || 0), 0);
    const totalFollowers = user?.socialAccounts?.reduce((sum, account) => sum + (account.followers || 0), 0) || 0;
    const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(2) : 0;
    const avgPostReach = totalPosts > 0 ? Math.floor(totalReach / totalPosts) : 0;

    // Calculate previous period for comparison
    let previousStartDate = new Date(startDate);
    let previousEndDate = new Date(startDate);
    
    const timeDiff = now.getTime() - startDate.getTime();
    previousStartDate.setTime(startDate.getTime() - timeDiff);

    const previousPosts = await Post.find({
      userId: req.userId,
      createdAt: { $gte: previousStartDate, $lte: previousEndDate }
    });

    const previousEngagement = previousPosts.reduce((sum, post) => sum + (post.engagement || 0), 0);
    const previousReach = previousPosts.reduce((sum, post) => sum + (post.reach || 0), 0);
    const previousImpressions = previousPosts.reduce((sum, post) => sum + (post.impressions || 0), 0);

    res.json({
      success: true,
      data: {
        totalEngagement,
        totalReach,
        totalImpressions,
        totalFollowers,
        engagementRate: parseFloat(engagementRate),
        avgPostReach,
        totalPosts,
        timeRange,
        previousPeriod: {
          totalEngagement: previousEngagement,
          totalReach: previousReach,
          totalImpressions: previousImpressions,
          engagementRate: previousReach > 0 ? ((previousEngagement / previousReach) * 100).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/platform-comparison
// @desc    Get platform engagement comparison
// @access  Private
router.get('/platform-comparison', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get posts grouped by platform
    const posts = await Post.find({
      userId: req.userId,
      createdAt: { $gte: startDate, $lte: now }
    });

    // Group posts by platform and calculate metrics
    const platformData = {};
    
    posts.forEach(post => {
      const platform = post.platform || 'unknown';
      
      if (!platformData[platform]) {
        platformData[platform] = {
          name: platform.charAt(0).toUpperCase() + platform.slice(1),
          totalEngagement: 0,
          engagement: 0,
          reach: 0,
          followers: 0,
          posts: 0
        };
      }
      
      platformData[platform].totalEngagement += post.engagement || 0;
      platformData[platform].engagement += post.engagement || 0;
      platformData[platform].reach += post.reach || 0;
      platformData[platform].posts += 1;
    });

    // Get follower counts from user's social accounts
    const user = await User.findById(req.userId);
    if (user?.socialAccounts) {
      user.socialAccounts.forEach(account => {
        const platform = account.platform?.toLowerCase();
        if (platformData[platform]) {
          platformData[platform].followers = account.followers || 0;
        }
      });
    }

    // Calculate engagement rates
    Object.values(platformData).forEach(data => {
      data.engagementRate = data.reach > 0 ? ((data.engagement / data.reach) * 100).toFixed(1) : '0.0';
    });

    res.json({
      success: true,
      data: Object.values(platformData),
      timeRange
    });

  } catch (error) {
    console.error('Platform comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/top-posts
// @desc    Get top performing posts
// @access  Private
router.get('/top-posts', authenticateToken, async (req, res) => {
  try {
    const { limit = 5, platform, timeRange = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Build query
    const query = {
      userId: req.userId,
      createdAt: { $gte: startDate, $lte: now }
    };

    // Add platform filter if specified
    if (platform && platform !== 'all') {
      query.platform = platform.toLowerCase();
    }

    // Get posts and sort by engagement
    const posts = await Post.find(query)
      .sort({ engagement: -1 })
      .limit(parseInt(limit))
      .select('content platform engagement reach likes shares comments createdAt scheduledDate');

    // Format posts for response
    const topPosts = posts.map(post => ({
      id: post._id,
      content: post.content,
      platform: post.platform,
      engagement: post.engagement || 0,
      reach: post.reach || 0,
      likes: post.likes || 0,
      shares: post.shares || 0,
      comments: post.comments || 0,
      date: post.scheduledDate || post.createdAt
    }));

    res.json({
      success: true,
      data: topPosts,
      timeRange,
      total: topPosts.length
    });

  } catch (error) {
    console.error('Top posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;