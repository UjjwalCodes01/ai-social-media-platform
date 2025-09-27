const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user (password will be hashed automatically by the pre-save middleware)
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        connectedAccounts: user.connectedAccounts
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
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

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        connectedAccounts: user.connectedAccounts
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token
// @access  Private
router.post('/verify-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        connectedAccounts: user.connectedAccounts || {}
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// @route   GET /api/auth/test
// @desc    Test route to verify auth router is working
// @access  Public
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth router is working!' });
});

// @route   GET /api/auth/oauth/:platform
// @desc    Initiate OAuth flow for social platform
// @access  Public
router.get('/oauth/:platform', (req, res) => {
  try {
    const { platform } = req.params;
    const { redirect } = req.query;
    
    console.log('OAuth request received:', { platform, redirect });
    
    const validPlatforms = ['twitter', 'linkedin', 'instagram'];
    if (!validPlatforms.includes(platform)) {
      console.log('Invalid platform:', platform);
      return res.status(400).send('Invalid platform');
    }

    const redirectOrigin = redirect ? new URL(redirect).origin : 'http://localhost:3000';
    console.log('Redirect origin:', redirectOrigin);

    // Create OAuth simulation page
    const oauthHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 400px; 
            margin: 50px auto; 
            padding: 20px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            text-align: center;
        }
        .platform-icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        button {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        .auth-btn {
            background-color: #4CAF50;
            color: white;
        }
        .auth-btn:hover {
            background-color: #45a049;
        }
        .cancel-btn {
            background-color: #f44336;
            color: white;
        }
        .cancel-btn:hover {
            background-color: #da190b;
        }
    </style>
</head>
<body>
    <div class="platform-icon">${platform === 'twitter' ? '🐦' : platform === 'linkedin' ? '💼' : '📸'}</div>
    <h2>Connect ${platform.charAt(0).toUpperCase() + platform.slice(1)}</h2>
    <p>Authorize to connect your account</p>
    
    <button class="auth-btn" onclick="authorize()">
        Authorize ${platform.charAt(0).toUpperCase() + platform.slice(1)}
    </button>
    
    <button class="cancel-btn" onclick="cancel()">
        Cancel
    </button>

    <script>
        function authorize() {
            const token = 'oauth_${platform}_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            console.log('Generated token:', token);
            
            if (window.opener) {
                window.opener.postMessage({
                    type: 'OAUTH_SUCCESS',
                    platform: '${platform}',
                    token: token
                }, '${redirectOrigin}');
                
                window.opener.sessionStorage.setItem('oauth_${platform}', JSON.stringify({
                    success: true,
                    token: token
                }));
            }
            
            window.close();
        }
        
        function cancel() {
            if (window.opener) {
                window.opener.postMessage({
                    type: 'OAUTH_ERROR',
                    error: 'User cancelled authorization'
                }, '${redirectOrigin}');
            }
            window.close();
        }
    </script>
</body>
</html>`;
    
    res.set('Content-Type', 'text/html');
    res.send(oauthHTML);
    
  } catch (error) {
    console.error('OAuth route error:', error);
    res.status(500).send('OAuth service error');
  }
});

module.exports = router;