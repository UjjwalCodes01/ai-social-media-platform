# AI Social Media Management Platform - Backend

A comprehensive Node.js/Express backend API for managing social media content, scheduling, analytics, and user authentication.

## 🚀 Features

### Authentication & User Management
- User registration and login with JWT
- Password hashing with bcrypt
- Profile management
- Social media account linking/unlinking

### Content Management
- Create, read, update, delete posts
- Content scheduling
- Multi-platform publishing simulation
- Media upload support

### Analytics & Insights
- Performance metrics tracking
- Platform comparison analytics
- Top posts analysis
- Time-series data for charts
- Growth metrics

### Social Media Integration
- Multi-platform posting (Twitter, LinkedIn, Instagram)
- OAuth simulation for platform connections
- Rate limiting and API status tracking
- AI-powered content suggestions

### Scheduling System
- Calendar view of scheduled posts
- Automated publishing with cron jobs
- Upcoming posts management
- Publish immediately functionality

## 📁 Project Structure

```
backend/
├── server.js                 # Main server file
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── user.js              # User management routes
│   ├── posts.js             # Posts CRUD routes
│   ├── analytics.js         # Analytics endpoints
│   ├── social.js            # Social media integration
│   └── schedule.js          # Scheduling system
├── middleware/
│   └── auth.js              # Authentication middleware
├── utils/
│   └── responses.js         # Response utilities
└── API_CLIENT_REFERENCE.ts  # Frontend integration guide
```

## 🛠️ Installation & Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   - Copy `.env` file and update values
   - Set JWT_SECRET to a secure random string
   - Configure database URLs (when ready)
   - Add social media API keys

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Production Start**
   ```bash
   npm start
   ```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-token` - Verify JWT token

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/connected-accounts` - Get linked accounts
- `POST /api/user/connect-account` - Link social account
- `POST /api/user/disconnect-account` - Unlink social account

### Posts
- `GET /api/posts` - Get user posts (with filters)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post immediately

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/platform-comparison` - Platform engagement data
- `GET /api/analytics/top-posts` - Top performing posts
- `GET /api/analytics/time-series` - Chart data
- `GET /api/analytics/growth` - Growth metrics

### Social Media
- `POST /api/social/publish` - Publish to platforms
- `POST /api/social/schedule` - Schedule content
- `GET /api/social/platforms/status` - Platform connection status
- `POST /api/social/platforms/connect` - Connect platform
- `POST /api/social/platforms/disconnect` - Disconnect platform
- `GET /api/social/content/suggestions` - AI content suggestions

### Scheduling
- `GET /api/schedule/posts` - Get scheduled posts
- `POST /api/schedule/posts` - Create scheduled post
- `PUT /api/schedule/posts/:id` - Update scheduled post
- `DELETE /api/schedule/posts/:id` - Delete scheduled post
- `GET /api/schedule/calendar` - Calendar view
- `GET /api/schedule/upcoming` - Upcoming posts
- `POST /api/schedule/posts/:id/publish-now` - Publish immediately

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```javascript
Authorization: Bearer <your-jwt-token>
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-09-27T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...],
  "timestamp": "2025-09-27T10:00:00.000Z"
}
```

## 🔗 Frontend Integration

1. **Copy the API client**
   - Use `API_CLIENT_REFERENCE.ts` as a template
   - Place it in your frontend's `src/lib/api.ts`

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Usage Example**
   ```typescript
   import { authAPI, postsAPI } from '@/lib/api';

   // Login
   const response = await authAPI.login({
     email: 'user@example.com',
     password: 'password123'
   });

   // Create post
   const post = await postsAPI.createPost({
     content: 'Hello World!',
     platform: 'twitter',
     publishNow: true
   });
   ```

## 🗄️ Data Models

### User
```typescript
{
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  profileImage?: string;
  connectedAccounts: {
    twitter: { connected: boolean; username?: string };
    linkedin: { connected: boolean; username?: string };
    instagram: { connected: boolean; username?: string };
  };
}
```

### Post
```typescript
{
  id: number;
  userId: number;
  content: string;
  platform: 'twitter' | 'linkedin' | 'instagram';
  scheduledDate: string;
  scheduledTime: string;
  status: 'scheduled' | 'published' | 'draft';
  createdAt: Date;
  publishedAt?: Date;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
}
```

## 🚀 Next Steps

### Database Integration
1. Install MongoDB/PostgreSQL
2. Replace mock data with database models
3. Add connection pooling and transactions

### Real Social Media APIs
1. Implement Twitter API v2
2. Add LinkedIn API integration
3. Connect Instagram Basic Display API
4. Handle OAuth flows properly

### Advanced Features
1. Real-time notifications
2. Team collaboration
3. Advanced analytics
4. Content templates
5. Bulk operations

## 🔧 Development

### Adding New Endpoints
1. Create route handler in appropriate file
2. Add validation middleware
3. Update API client reference
4. Test with frontend integration

### Mock Data
- Currently uses in-memory storage
- Data resets on server restart
- Perfect for development and testing

## 🚨 Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production
- Implement proper rate limiting
- Add input sanitization
- Use environment variables for secrets

## 📈 Monitoring

The server includes:
- Request logging
- Error handling
- Health check endpoint at `/api/health`
- Rate limiting
- Security headers

## 🤝 Contributing

1. Follow existing code patterns
2. Add proper error handling
3. Include input validation
4. Update API documentation
5. Test with frontend integration

## 📞 Support

For issues or questions:
- Check the console logs
- Verify environment variables
- Test API endpoints with Postman
- Review the frontend integration

---

**Happy coding! 🚀**