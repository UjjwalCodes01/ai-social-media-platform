# Render Deployment Configuration

## Build Command
```
npm install
```

## Start Command
```
npm start
```

## Environment Variables
Set these in your Render dashboard:

### Required Variables
- `NODE_ENV=production`
- `PORT=10000` (Render will set this automatically)
- `MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/ai_social_platform?retryWrites=true&w=majority`
- `JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long`
- `OPENAI_API_KEY=sk-proj-your-openai-api-key-here`
- `FRONTEND_URL=https://ai-social-media-platform.vercel.app`

### Optional Social Media API Keys
- `TWITTER_API_KEY=your-twitter-api-key`
- `TWITTER_API_SECRET=your-twitter-api-secret`
- `TWITTER_BEARER_TOKEN=your-twitter-bearer-token`
- `LINKEDIN_CLIENT_ID=your-linkedin-client-id`
- `LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret`
- `INSTAGRAM_APP_ID=your-instagram-app-id`
- `INSTAGRAM_APP_SECRET=your-instagram-app-secret`
- `FACEBOOK_APP_ID=your-facebook-app-id`
- `FACEBOOK_APP_SECRET=your-facebook-app-secret`

## Deployment Steps

1. **Create Render Account**: Sign up at https://render.com
2. **Connect GitHub**: Link your GitHub repository
3. **Create Web Service**: Select "Web Service" and connect your repository
4. **Configure Service**:
   - Name: `ai-social-platform-backend`
   - Environment: `Node`
   - Region: Choose closest to your users
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Add Environment Variables**: Copy all variables from above
6. **Deploy**: Click deploy and wait for completion

## Database Setup (MongoDB Atlas)

1. **Create Account**: Sign up at https://mongodb.com/atlas
2. **Create Cluster**: Choose free tier
3. **Create Database User**: Set username and password
4. **Configure Network Access**: Add 0.0.0.0/0 for Render access
5. **Get Connection String**: Copy and set as MONGODB_URI

## Post-Deployment

1. **Test Health Check**: Visit `https://your-app.onrender.com/api/health`
2. **Update Frontend**: Update API_URL in frontend environment variables
3. **Test OAuth**: Configure OAuth redirect URLs to point to your Render domain

## Important Notes

- Render services sleep after 15 minutes of inactivity on free tier
- First request after sleep may take 30+ seconds to wake up
- Consider paid tier for production applications
- Keep environment variables secure and never commit to Git