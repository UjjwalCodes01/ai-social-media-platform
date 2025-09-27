const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Mock analytics data
const mockAnalyticsData = {
  1: { // userId
    totalEngagement: 45280,
    totalReach: 125600,
    totalImpressions: 89300,
    totalFollowers: 8450,
    engagementRate: 5.2,
    avgPostReach: 2100,
    platformData: {
      twitter: {
        engagement: 18500,
        reach: 52000,
        followers: 3200,
        posts: 45
      },
      linkedin: {
        engagement: 15200,
        reach: 41000,
        followers: 2800,
        posts: 38
      },
      instagram: {
        engagement: 11580,
        reach: 32600,
        followers: 2450,
        posts: 32
      }
    },
    topPosts: [
      {
        id: 1,
        content: "🚀 Just launched our new AI-powered analytics dashboard! The future of social media management is here...",
        platform: 'twitter',
        engagement: 3250,
        reach: 15600,
        likes: 245,
        shares: 89,
        comments: 34,
        date: '2025-09-24'
      },
      {
        id: 2,
        content: "The key to successful content marketing: Understanding your audience, creating value, and staying consistent...",
        platform: 'linkedin',
        engagement: 2890,
        reach: 12400,
        likes: 198,
        shares: 156,
        comments: 67,
        date: '2025-09-23'
      },
      {
        id: 3,
        content: "Behind the scenes of our latest product photoshoot ✨ Swipe to see the magic happen!",
        platform: 'instagram',
        engagement: 2650,
        reach: 9800,
        likes: 287,
        shares: 45,
        comments: 23,
        date: '2025-09-22'
      }
    ],
    timeSeriesData: {
      '7d': {
        engagement: [1200, 1500, 1800, 2100, 1900, 2300, 2500],
        reach: [3200, 3800, 4100, 4500, 4200, 4800, 5100],
        dates: ['2025-09-21', '2025-09-22', '2025-09-23', '2025-09-24', '2025-09-25', '2025-09-26', '2025-09-27']
      },
      '30d': {
        engagement: Array.from({length: 30}, (_, i) => Math.floor(Math.random() * 2000) + 1000),
        reach: Array.from({length: 30}, (_, i) => Math.floor(Math.random() * 5000) + 3000),
        dates: Array.from({length: 30}, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        })
      }
    }
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

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview', authenticateToken, (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const userId = req.userId;
    
    const userAnalytics = mockAnalyticsData[userId];
    
    if (!userAnalytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics data not found'
      });
    }

    // Apply time range multipliers (mock implementation)
    let multiplier = 1;
    switch(timeRange) {
      case '7d': multiplier = 0.25; break;
      case '30d': multiplier = 1; break;
      case '90d': multiplier = 3; break;
      case '1y': multiplier = 12; break;
    }

    const adjustedData = {
      totalEngagement: Math.floor(userAnalytics.totalEngagement * multiplier),
      totalReach: Math.floor(userAnalytics.totalReach * multiplier),
      totalImpressions: Math.floor(userAnalytics.totalImpressions * multiplier),
      totalFollowers: userAnalytics.totalFollowers,
      engagementRate: userAnalytics.engagementRate,
      avgPostReach: Math.floor(userAnalytics.avgPostReach * multiplier),
      timeRange
    };

    res.json({
      success: true,
      analytics: adjustedData
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
router.get('/platform-comparison', authenticateToken, (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const userId = req.userId;
    
    const userAnalytics = mockAnalyticsData[userId];
    
    if (!userAnalytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics data not found'
      });
    }

    // Apply time range multipliers
    let multiplier = 1;
    switch(timeRange) {
      case '7d': multiplier = 0.25; break;
      case '30d': multiplier = 1; break;
      case '90d': multiplier = 3; break;
      case '1y': multiplier = 12; break;
    }

    const platformData = Object.entries(userAnalytics.platformData).map(([platform, data]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      engagement: Math.floor(data.engagement * multiplier),
      reach: Math.floor(data.reach * multiplier),
      followers: data.followers,
      posts: Math.floor(data.posts * multiplier),
      engagementRate: ((data.engagement / data.reach) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      platformData,
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
router.get('/top-posts', authenticateToken, (req, res) => {
  try {
    const { limit = 5, platform, timeRange = '30d' } = req.query;
    const userId = req.userId;
    
    const userAnalytics = mockAnalyticsData[userId];
    
    if (!userAnalytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics data not found'
      });
    }

    let topPosts = [...userAnalytics.topPosts];
    
    // Filter by platform if specified
    if (platform) {
      topPosts = topPosts.filter(post => post.platform === platform.toLowerCase());
    }
    
    // Apply time range filter (mock implementation)
    const now = new Date();
    const timeRangeInDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[timeRange] || 30;
    
    topPosts = topPosts.filter(post => {
      const postDate = new Date(post.date);
      const daysDiff = (now - postDate) / (1000 * 60 * 60 * 24);
      return daysDiff <= timeRangeInDays;
    });
    
    // Sort by engagement and limit
    topPosts = topPosts
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      topPosts,
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

// @route   GET /api/analytics/time-series
// @desc    Get time series data for charts
// @access  Private
router.get('/time-series', authenticateToken, (req, res) => {
  try {
    const { timeRange = '30d', metric = 'engagement' } = req.query;
    const userId = req.userId;
    
    const userAnalytics = mockAnalyticsData[userId];
    
    if (!userAnalytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics data not found'
      });
    }

    const timeSeriesData = userAnalytics.timeSeriesData[timeRange];
    
    if (!timeSeriesData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time range'
      });
    }

    const data = {
      labels: timeSeriesData.dates,
      datasets: [
        {
          label: metric.charAt(0).toUpperCase() + metric.slice(1),
          data: timeSeriesData[metric],
          timeRange
        }
      ]
    };

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Time series error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/analytics/growth
// @desc    Get growth metrics
// @access  Private
router.get('/growth', authenticateToken, (req, res) => {
  try {
    const userId = req.userId;
    
    const userAnalytics = mockAnalyticsData[userId];
    
    if (!userAnalytics) {
      return res.status(404).json({
        success: false,
        message: 'Analytics data not found'
      });
    }

    // Mock growth data
    const growthData = {
      engagement: {
        current: userAnalytics.totalEngagement,
        previous: Math.floor(userAnalytics.totalEngagement * 0.85),
        change: 15.2
      },
      reach: {
        current: userAnalytics.totalReach,
        previous: Math.floor(userAnalytics.totalReach * 0.92),
        change: 8.7
      },
      followers: {
        current: userAnalytics.totalFollowers,
        previous: Math.floor(userAnalytics.totalFollowers * 0.95),
        change: 5.3
      },
      engagementRate: {
        current: userAnalytics.engagementRate,
        previous: userAnalytics.engagementRate * 0.88,
        change: 12.1
      }
    };

    res.json({
      success: true,
      growth: growthData
    });

  } catch (error) {
    console.error('Growth metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;