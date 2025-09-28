# 🚀 Vercel Deployment Guide

## Prerequisites
- Vercel account (free at [vercel.com](https://vercel.com))
- Your backend deployed (Railway, Heroku, AWS, etc.)
- GitHub repository

## 📋 Deployment Steps

### 1. Prepare Environment Variables
Before deploying, you need to set these environment variables in Vercel:

**Required:**
- `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://your-backend.railway.app/api`)

**Optional:**
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID
- `NEXT_PUBLIC_HOTJAR_ID` - Hotjar tracking ID

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow the prompts:
# - Set up new project? Yes
# - Project name: ai-social-media-platform
# - Framework: Next.js
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `frontend` folder as root directory
5. Set environment variables in settings
6. Deploy

### 3. Configure Environment Variables in Vercel
1. Go to your project dashboard
2. Click "Settings" > "Environment Variables"
3. Add your variables:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-domain.com/api`

### 4. Update Backend CORS
Make sure your backend allows requests from your Vercel domain:
```javascript
// In your backend server.js
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app' // Add your Vercel URL
  ],
  credentials: true
};
```

### 5. Domain Configuration (Optional)
- Add custom domain in Vercel dashboard
- Update DNS settings with your domain provider

## 🔧 Build Optimization

The project is already optimized with:
- ✅ Standalone output for faster cold starts
- ✅ Image optimization
- ✅ Bundle optimization
- ✅ Security headers
- ✅ Compression enabled
- ✅ React strict mode
- ✅ SWC minification

## 🌍 Environment Files
- `.env.local` - Local development
- `.env.production` - Production variables
- `vercel.json` - Vercel deployment config
- `next.config.ts` - Next.js optimizations

## 📊 Performance Monitoring
After deployment, monitor your app:
- Vercel Analytics (built-in)
- Core Web Vitals
- Function execution times
- Error tracking

## 🔄 Automatic Deployments
- Push to `main` branch = Production deployment
- Push to other branches = Preview deployments
- Pull requests get automatic preview URLs

## 🛠 Troubleshooting

### Build Errors
```bash
# Test build locally first
npm run build
npm run start
```

### Environment Variable Issues
- Check Vercel dashboard settings
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new variables

### API Connection Issues
- Verify backend is deployed and accessible
- Check CORS configuration
- Test API endpoints with Postman/curl

## 📞 Support
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)