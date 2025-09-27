# Real Social Media OAuth Setup Guide

This guide will help you set up real OAuth integration with Twitter, LinkedIn, Instagram, and Facebook APIs.

## 🔐 Required OAuth Apps

### 1. Twitter API Setup
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new App (or use existing)
3. Go to "Keys and tokens" tab
4. Copy your **Client ID** and **Client Secret**
5. In "App settings" > "App details", add redirect URI: `http://localhost:5000/api/auth/twitter/callback`
6. Enable OAuth 2.0 with PKCE
7. Set read/write permissions

### 2. LinkedIn API Setup
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Create a new App
3. Add "Sign In with LinkedIn" product
4. In "Auth" tab, add redirect URI: `http://localhost:5000/api/auth/linkedin/callback`
5. Copy your **Client ID** and **Client Secret**
6. Request additional scopes if needed

### 3. Instagram Basic Display Setup
1. Go to [Meta for Developers](https://developers.facebook.com/apps/)
2. Create a new App > "Consumer" type
3. Add "Instagram Basic Display" product
4. Go to Instagram Basic Display > Basic Display
5. Add redirect URI: `http://localhost:5000/api/auth/instagram/callback`
6. Copy your **Instagram App ID** and **App Secret**
7. Add test users in the "Roles" section

### 4. Facebook Login Setup
1. Use the same app from Instagram setup
2. Add "Facebook Login" product
3. In Facebook Login settings, add redirect URI: `http://localhost:5000/api/auth/facebook/callback`
4. Copy your **App ID** and **App Secret**

## 🛠️ Environment Configuration

1. Copy `.env.example` to `.env`
2. Fill in your OAuth credentials:

```bash
# Twitter
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# Instagram
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret

# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

## 🔄 OAuth Flow

1. User clicks "Connect" button on Dashboard/Settings
2. Redirects to social media OAuth page
3. User authorizes the app
4. Callback endpoint exchanges code for access token
5. App fetches real user profile data
6. User is redirected back to Dashboard with success message

## ✅ Features

- **Real Profile Data**: Fetches actual username, follower count, profile pictures
- **Automatic Fallback**: If API calls fail, gracefully falls back to simulated data
- **Secure Token Handling**: OAuth tokens are handled securely
- **Error Handling**: Comprehensive error handling for OAuth failures

## 🧪 Testing

1. Start the backend: `npm run dev`
2. Start the frontend: `npm run dev`  
3. Navigate to Dashboard or Settings
4. Click "Connect" on any social platform
5. Complete OAuth flow on the social media site
6. Verify real profile data is displayed

## 📝 Notes

- Instagram requires your app to be approved for production use
- Facebook/Instagram apps start in "Development" mode
- LinkedIn scopes may require approval for production
- Twitter API v2 requires approval for elevated access

## 🔒 Security

- Never commit `.env` file to version control
- Use HTTPS in production
- Implement proper token refresh mechanisms
- Follow each platform's API usage guidelines