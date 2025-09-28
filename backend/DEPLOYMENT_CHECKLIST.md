# 🚀 Backend Deployment Checklist for Render

## Pre-Deployment Setup

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account at https://mongodb.com/atlas
- [ ] Create a new cluster (free tier is sufficient for testing)
- [ ] Create database user with password
- [ ] Configure Network Access (add 0.0.0.0/0 for Render)
- [ ] Get connection string (replace <username>, <password>, <cluster-name>)
- [ ] Test connection locally

### 2. Environment Variables Setup
- [ ] Copy `.env.production` template
- [ ] Set MONGODB_URI with your Atlas connection string
- [ ] Generate secure JWT_SECRET (minimum 32 characters)
- [ ] Get OpenAI API key from https://platform.openai.com/account/api-keys
- [ ] Set FRONTEND_URL to your deployed frontend URL

### 3. Optional Social Media APIs (for OAuth features)
- [ ] Twitter API: https://developer.twitter.com/
- [ ] LinkedIn API: https://developer.linkedin.com/
- [ ] Facebook/Instagram API: https://developers.facebook.com/

## Render Deployment

### 4. Create Render Service
- [ ] Sign up at https://render.com
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Configure service:
  - Name: `ai-social-platform-backend`
  - Environment: `Node`
  - Region: Choose closest to your users
  - Branch: `main`
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`

### 5. Environment Variables in Render
Copy these from your `.env.production` file to Render dashboard:

**Required:**
- [ ] `NODE_ENV` = `production`
- [ ] `MONGODB_URI` = `mongodb+srv://...`
- [ ] `JWT_SECRET` = `your-secure-secret-key`
- [ ] `OPENAI_API_KEY` = `sk-proj-...`
- [ ] `FRONTEND_URL` = `https://ai-social-media-platform.vercel.app`

**Optional (for OAuth):**
- [ ] `TWITTER_API_KEY`
- [ ] `TWITTER_API_SECRET`
- [ ] `TWITTER_BEARER_TOKEN`
- [ ] `LINKEDIN_CLIENT_ID`
- [ ] `LINKEDIN_CLIENT_SECRET`
- [ ] `INSTAGRAM_APP_ID`
- [ ] `INSTAGRAM_APP_SECRET`
- [ ] `FACEBOOK_APP_ID`
- [ ] `FACEBOOK_APP_SECRET`

### 6. Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for deployment to complete (5-10 minutes)
- [ ] Check logs for any errors

## Post-Deployment Testing

### 7. Test API Endpoints
- [ ] Health check: `GET https://your-app.onrender.com/api/health`
- [ ] Should return status 200 with server info
- [ ] Test registration: `POST https://your-app.onrender.com/api/auth/register`
- [ ] Test login: `POST https://your-app.onrender.com/api/auth/login`

### 8. Update Frontend Configuration
- [ ] Update frontend environment variables:
  - `NEXT_PUBLIC_API_URL` = `https://your-app.onrender.com/api`
- [ ] Test frontend connection to backend
- [ ] Redeploy frontend with new API URL

### 9. Configure OAuth Redirects (if using social login)
Update OAuth app settings with new URLs:
- [ ] Twitter: `https://your-app.onrender.com/api/social/callback/twitter`
- [ ] LinkedIn: `https://your-app.onrender.com/api/social/callback/linkedin`
- [ ] Instagram: `https://your-app.onrender.com/api/social/callback/instagram`
- [ ] Facebook: `https://your-app.onrender.com/api/social/callback/facebook`

## Common Issues & Solutions

### Deployment Fails
- Check build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Database Connection Fails
- Check MongoDB Atlas network access settings
- Verify connection string format
- Ensure database user has correct permissions

### Environment Variables Not Loading
- Double-check variable names (case-sensitive)
- Ensure no extra spaces in values
- Redeploy after adding variables

### API Returns 500 Errors
- Check application logs in Render
- Verify all required environment variables are set
- Test endpoints individually

## Production Best Practices

### Security
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable MongoDB IP whitelist in production
- [ ] Use HTTPS only (Render provides this automatically)
- [ ] Monitor API usage and set rate limits

### Performance
- [ ] Consider upgrading to paid Render plan for production
- [ ] Monitor response times and database performance
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure logging for debugging

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Monitor database connections
- [ ] Track API usage patterns
- [ ] Set up alerts for errors

## Support URLs

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **OpenAI API**: https://platform.openai.com/docs
- **Node.js**: https://nodejs.org/en/docs/

---

🎉 **Congratulations!** Your backend is now ready for production deployment on Render!