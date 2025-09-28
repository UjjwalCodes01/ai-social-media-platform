# 🔗 Connect Your Frontend to Backend

## Current Status
- ✅ **Frontend**: https://ai-social-media-platform.vercel.app (DEPLOYED)
- ⏳ **Backend**: Ready to deploy to Render

## After Backend Deployment

Once your backend is deployed to Render (e.g., `https://ai-social-platform-backend.onrender.com`):

### Update Vercel Environment Variables

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Find your project: `ai-social-media-platform`

2. **Update Environment Variables**
   - Go to: Settings → Environment Variables
   - Add/Update this variable:
   
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend-name.onrender.com/api
   ```
   
   - Select: Production, Preview, and Development
   - Click "Save"

3. **Redeploy Frontend**
   - Go to: Deployments tab
   - Click "..." next to latest deployment
   - Select "Redeploy"
   - Wait for deployment to complete

### Test the Connection

1. **Visit your frontend**: https://ai-social-media-platform.vercel.app
2. **Open browser dev tools** (F12)
3. **Go to Network tab**
4. **Try to register/login**
5. **Check API calls** - should go to your Render backend URL

### Troubleshooting

**If you see CORS errors:**
- Check that `FRONTEND_URL=https://ai-social-media-platform.vercel.app` is set in your Render backend environment variables
- Wait a few minutes for backend to restart with new env vars

**If API calls fail:**
- Verify `NEXT_PUBLIC_API_URL` is correctly set in Vercel
- Check that backend health endpoint responds: `https://your-backend.onrender.com/api/health`
- Ensure backend is not sleeping (free Render services sleep after 15 minutes)

**Common URLs to check:**
- Frontend: https://ai-social-media-platform.vercel.app
- Backend Health: https://your-backend.onrender.com/api/health
- Backend API: https://your-backend.onrender.com/api

---

💡 **Pro Tip**: Keep both Vercel and Render dashboards open during setup to monitor deployments and logs!