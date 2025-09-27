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

// Real OAuth routes for social media platforms

// @route   GET /api/auth/twitter
// @desc    Initiate Twitter OAuth 2.0 flow
// @access  Public
router.get('/twitter', (req, res) => {
  const { redirect_uri } = req.query;
  
  // Twitter OAuth 2.0 configuration
  const CLIENT_ID = process.env.TWITTER_CLIENT_ID;
  const REDIRECT_URI = process.env.TWITTER_REDIRECT_URI || 'http://localhost:5000/api/auth/twitter/callback';
  
  if (!CLIENT_ID) {
    return res.status(500).json({ 
      success: false, 
      message: 'Twitter OAuth not configured. Please set TWITTER_CLIENT_ID in environment variables.' 
    });
  }
  
  // Store redirect_uri in session or state parameter
  const state = Buffer.from(JSON.stringify({ 
    platform: 'Twitter',
    redirect_uri: redirect_uri || 'http://localhost:3000/dashboard'
  })).toString('base64');
  
  // Twitter OAuth 2.0 authorization URL
  const authUrl = `https://twitter.com/i/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=tweet.read tweet.write users.read offline.access&` +
    `state=${state}&` +
    `code_challenge=challenge&` +
    `code_challenge_method=plain`;
    
  res.redirect(authUrl);
});

// @route   GET /api/auth/linkedin
// @desc    Initiate LinkedIn OAuth 2.0 flow
// @access  Public
router.get('/linkedin', (req, res) => {
  const { redirect_uri } = req.query;
  
  const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
  const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/auth/linkedin/callback';
  
  if (!CLIENT_ID) {
    return res.status(500).json({ 
      success: false, 
      message: 'LinkedIn OAuth not configured. Please set LINKEDIN_CLIENT_ID in environment variables.' 
    });
  }
  
  const state = Buffer.from(JSON.stringify({ 
    platform: 'LinkedIn',
    redirect_uri: redirect_uri || 'http://localhost:3000/dashboard'
  })).toString('base64');
  
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=r_liteprofile r_emailaddress w_member_social&` +
    `state=${state}`;
    
  res.redirect(authUrl);
});

// @route   GET /api/auth/instagram
// @desc    Initiate Instagram Basic Display OAuth flow
// @access  Public
router.get('/instagram', (req, res) => {
  const { redirect_uri } = req.query;
  
  const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
  const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:5000/api/auth/instagram/callback';
  
  if (!CLIENT_ID) {
    return res.status(500).json({ 
      success: false, 
      message: 'Instagram OAuth not configured. Please set INSTAGRAM_CLIENT_ID in environment variables.' 
    });
  }
  
  const state = Buffer.from(JSON.stringify({ 
    platform: 'Instagram',
    redirect_uri: redirect_uri || 'http://localhost:3000/dashboard'
  })).toString('base64');
  
  const authUrl = `https://api.instagram.com/oauth/authorize?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=user_profile,user_media&` +
    `response_type=code&` +
    `state=${state}`;
    
  res.redirect(authUrl);
});

// @route   GET /api/auth/facebook
// @desc    Initiate Facebook Login OAuth flow
// @access  Public
router.get('/facebook', (req, res) => {
  const { redirect_uri } = req.query;
  
  const CLIENT_ID = process.env.FACEBOOK_APP_ID;
  const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/auth/facebook/callback';
  
  if (!CLIENT_ID) {
    return res.status(500).json({ 
      success: false, 
      message: 'Facebook OAuth not configured. Please set FACEBOOK_APP_ID in environment variables.' 
    });
  }
  
  const state = Buffer.from(JSON.stringify({ 
    platform: 'Facebook',
    redirect_uri: redirect_uri || 'http://localhost:3000/dashboard'
  })).toString('base64');
  
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=pages_manage_posts,pages_read_engagement,pages_show_list&` +
    `response_type=code&` +
    `state=${state}`;
    
  res.redirect(authUrl);
});

// OAuth Callback handlers
// @route   GET /api/auth/twitter/callback
router.get('/twitter/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    
    if (code) {
      // Exchange code for access token
      const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          client_id: process.env.TWITTER_CLIENT_ID,
          redirect_uri: process.env.TWITTER_REDIRECT_URI || 'http://localhost:5000/api/auth/twitter/callback',
          code_verifier: 'challenge'
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        // Redirect back to frontend with success
        return res.redirect(`${stateData.redirect_uri}?code=${tokenData.access_token}&state=Twitter`);
      }
    }
    
    res.redirect(`${stateData.redirect_uri}?error=oauth_failed`);
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    res.redirect(`${req.query.redirect_uri || 'http://localhost:3000/dashboard'}?error=oauth_error`);
  }
});

// Similar callback handlers for other platforms...
router.get('/linkedin/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    
    if (code) {
      const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:5000/api/auth/linkedin/callback',
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        return res.redirect(`${stateData.redirect_uri}?code=${tokenData.access_token}&state=LinkedIn`);
      }
    }
    
    res.redirect(`${stateData.redirect_uri}?error=oauth_failed`);
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    res.redirect(`${req.query.redirect_uri || 'http://localhost:3000/dashboard'}?error=oauth_error`);
  }
});

router.get('/instagram/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    
    if (code) {
      const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.INSTAGRAM_CLIENT_ID,
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:5000/api/auth/instagram/callback',
          code
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        return res.redirect(`${stateData.redirect_uri}?code=${tokenData.access_token}&state=Instagram`);
      }
    }
    
    res.redirect(`${stateData.redirect_uri}?error=oauth_failed`);
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    res.redirect(`${req.query.redirect_uri || 'http://localhost:3000/dashboard'}?error=oauth_error`);
  }
});

router.get('/facebook/callback', async (req, res) => {
  const { code, state } = req.query;
  
  try {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    
    if (code) {
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${process.env.FACEBOOK_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:5000/api/auth/facebook/callback')}&` +
        `client_secret=${process.env.FACEBOOK_APP_SECRET}&` +
        `code=${code}`
      );
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        return res.redirect(`${stateData.redirect_uri}?code=${tokenData.access_token}&state=Facebook`);
      }
    }
    
    res.redirect(`${stateData.redirect_uri}?error=oauth_failed`);
  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    res.redirect(`${req.query.redirect_uri || 'http://localhost:3000/dashboard'}?error=oauth_error`);
  }
});

module.exports = router;