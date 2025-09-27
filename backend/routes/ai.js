const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const AIService = require('../services/AIService');
const router = express.Router();

// Auth middleware
const authenticateToken = async (req, res, next) => {
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

// @route   POST /api/ai/generate-content
// @desc    Generate social media content using AI
// @access  Private
router.post('/generate-content', authenticateToken, [
  body('prompt').notEmpty().withMessage('Prompt is required'),
  body('platform').optional().isIn(['twitter', 'linkedin', 'instagram', 'facebook', 'general']).withMessage('Invalid platform'),
  body('contentType').optional().isIn(['text', 'image', 'video']).withMessage('Invalid content type')
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

    const { prompt, platform = 'general', contentType = 'text' } = req.body;

    // Generate content using AI service
    const result = await AIService.generateContent(prompt, platform, contentType);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Content generated successfully',
      data: {
        content: result.content,
        hashtags: result.hashtags,
        platform: result.platform,
        contentType: result.contentType,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during content generation'
    });
  }
});

// @route   POST /api/ai/improve-content
// @desc    Improve existing content using AI
// @access  Private
router.post('/improve-content', authenticateToken, [
  body('content').notEmpty().withMessage('Content is required'),
  body('improvements').notEmpty().withMessage('Improvement suggestions are required')
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

    const { content, improvements } = req.body;

    // Improve content using AI service
    const result = await AIService.improveContent(content, improvements);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Content improved successfully',
      data: {
        originalContent: content,
        improvedContent: result.content,
        hashtags: result.hashtags,
        improvedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Content improvement error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during content improvement'
    });
  }
});

// @route   GET /api/ai/suggestions
// @desc    Get content suggestions based on trends
// @access  Private
router.get('/suggestions', authenticateToken, async (req, res) => {
  try {
    const { platform = 'general' } = req.query;

    // For now, provide static suggestions, but this could be enhanced with real trend analysis
    const suggestions = {
      twitter: [
        'Share a behind-the-scenes moment from your business',
        'Ask your followers an engaging question',
        'Share a quick tip related to your industry',
        'Celebrate a recent achievement or milestone',
        'Share an inspiring quote with your personal take'
      ],
      linkedin: [
        'Share insights from a recent industry report',
        'Write about lessons learned from a recent project',
        'Discuss emerging trends in your field',
        'Share professional development tips',
        'Highlight team achievements and culture'
      ],
      instagram: [
        'Share a visually appealing behind-the-scenes photo',
        'Create a carousel post with tips or insights',
        'Share user-generated content or testimonials',
        'Post about your daily routine or process',
        'Showcase your product or service in action'
      ],
      facebook: [
        'Ask your community for their opinions',
        'Share a longer-form story or case study',
        'Highlight customer success stories',
        'Share community events or updates',
        'Post educational content with engaging visuals'
      ]
    };

    res.json({
      success: true,
      message: 'Content suggestions retrieved successfully',
      suggestions: suggestions[platform] || suggestions['twitter'],
      platform
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching suggestions'
    });
  }
});

module.exports = router;