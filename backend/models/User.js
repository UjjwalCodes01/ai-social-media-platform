const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  connectedAccounts: {
    twitter: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: null },
      accessToken: { type: String, default: null },
      accessTokenSecret: { type: String, default: null }
    },
    linkedin: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: null },
      accessToken: { type: String, default: null }
    },
    instagram: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: null },
      accessToken: { type: String, default: null }
    },
    facebook: {
      connected: { type: Boolean, default: false },
      username: { type: String, default: null },
      accessToken: { type: String, default: null }
    }
  },
  subscription: {
    plan: { type: String, default: 'free', enum: ['free', 'pro', 'enterprise'] },
    status: { type: String, default: 'active', enum: ['active', 'cancelled', 'expired'] },
    expiresAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);