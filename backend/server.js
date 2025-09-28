const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Validate environment variables
const validateEnvironment = require('./utils/validateEnv');
validateEnvironment();

// Connect to database
const connectDB = require('./config/database');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, only allow specific origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://ai-social-media-platform.vercel.app', // Your Vercel app
      'http://localhost:3000', // For local development
      'https://localhost:3000',
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const postRoutes = require('./routes/posts');
const analyticsRoutes = require('./routes/analytics');
const socialRoutes = require('./routes/social');
const scheduleRoutes = require('./routes/schedule');
const aiRoutes = require('./routes/ai');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: process.env.MONGODB_URI ? 'configured' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      twitter: process.env.TWITTER_API_KEY ? 'configured' : 'not configured',
      linkedin: process.env.LINKEDIN_CLIENT_ID ? 'configured' : 'not configured'
    }
  });
});

// Detailed health check for monitoring
app.get('/api/health/detailed', (req, res) => {
  const mongoose = require('mongoose');
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: require('./package.json').version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    services: {
      openai: !!process.env.OPENAI_API_KEY,
      twitter: !!process.env.TWITTER_API_KEY,
      linkedin: !!process.env.LINKEDIN_CLIENT_ID,
      instagram: !!process.env.INSTAGRAM_APP_ID,
      facebook: !!process.env.FACEBOOK_APP_ID
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📡 API Base URL: ${process.env.NODE_ENV === 'production' ? `https://your-app.onrender.com/api` : `http://localhost:${PORT}/api`}`);
  console.log(`✅ Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('Unhandled Promise Rejection: ', err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception: ', err.message);
  console.log('Shutting down...');
  process.exit(1);
});

module.exports = app;