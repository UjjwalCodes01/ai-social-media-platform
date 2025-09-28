# 🚀 Quick Deploy Guide - Your Setup

## Frontend Already Deployed ✅
Your frontend is live at: **https://ai-social-media-platform.vercel.app**

## Backend Deployment to Render

### 1. Environment Variables for Render Dashboard

Copy these exact values to your Render environment variables:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/ai_social_platform?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
FRONTEND_URL=https://ai-social-media-platform.vercel.app
```

### 2. Deploy to Render

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `UjjwalCodes01/ai-social-media-platform`
4. Configure:
   - **Name**: `ai-social-platform-backend`
   - **Environment**: Node
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (for now)

5. Add all environment variables from step 1
6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment

### 3. Update Frontend API URL

Once your backend is deployed (e.g., `https://your-backend.onrender.com`):

1. Go to your Vercel dashboard
2. Find your `ai-social-media-platform` project
3. Go to Settings → Environment Variables
4. Update or add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   ```
5. Redeploy your frontend

### 4. Test Everything

1. **Backend Health**: Visit `https://your-backend.onrender.com/api/health`
2. **Frontend**: Visit `https://ai-social-media-platform.vercel.app`
3. **Registration**: Try creating a new account
4. **Login**: Test the login flow

### 5. OAuth Redirect URLs (Optional)

If you set up social media OAuth, update these URLs in your developer consoles:

- **Twitter**: `https://your-backend.onrender.com/api/social/callback/twitter`
- **LinkedIn**: `https://your-backend.onrender.com/api/social/callback/linkedin`
- **Instagram**: `https://your-backend.onrender.com/api/social/callback/instagram`
- **Facebook**: `https://your-backend.onrender.com/api/social/callback/facebook`

## Quick Troubleshooting

### If frontend can't connect to backend:
- Check CORS settings include your Vercel URL
- Verify `NEXT_PUBLIC_API_URL` in Vercel environment variables
- Check browser network tab for actual API calls

### If backend won't start:
- Check Render logs for startup errors
- Verify all required environment variables are set
- Ensure MongoDB connection string is correct

---

🎉 **You're almost there!** Your frontend is already live, just need to deploy the backend and connect them!