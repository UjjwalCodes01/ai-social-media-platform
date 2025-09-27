const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [2000, 'Post content cannot exceed 2000 characters']
  },
  platforms: [{
    type: String,
    enum: ['twitter', 'linkedin', 'instagram', 'facebook'],
    required: true
  }],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    }
  }],
  scheduledFor: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  publishResults: [{
    platform: {
      type: String,
      enum: ['twitter', 'linkedin', 'instagram', 'facebook']
    },
    success: {
      type: Boolean,
      default: false
    },
    postId: {
      type: String,
      default: null
    },
    error: {
      type: String,
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    }
  }],
  analytics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ user: 1, status: 1 });
postSchema.index({ scheduledFor: 1 });
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);