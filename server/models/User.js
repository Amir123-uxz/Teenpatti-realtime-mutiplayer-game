const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    default: 'India'
  },
  wallet: {
    balance: {
      type: Number,
      default: 1000 // Starting bonus
    },
    chips: {
      type: Number,
      default: 100 // Starting chips
    },
    totalDeposited: {
      type: Number,
      default: 0
    },
    totalWithdrawn: {
      type: Number,
      default: 0
    }
  },
  gameStats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    totalWinnings: {
      type: Number,
      default: 0
    },
    totalLosses: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'blocked', 'suspended'],
    default: 'active'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    sound: {
      type: Boolean,
      default: true
    },
    autoPlay: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Generate referral code before saving
userSchema.pre('save', async function(next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = this.username.toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update win rate
userSchema.methods.updateWinRate = function() {
  if (this.gameStats.gamesPlayed > 0) {
    this.gameStats.winRate = (this.gameStats.gamesWon / this.gameStats.gamesPlayed) * 100;
  }
};

// Add chips
userSchema.methods.addChips = function(amount) {
  this.wallet.chips += amount;
  return this.save();
};

// Deduct chips
userSchema.methods.deductChips = function(amount) {
  if (this.wallet.chips >= amount) {
    this.wallet.chips -= amount;
    return this.save();
  }
  throw new Error('Insufficient chips');
};

// Convert balance to chips
userSchema.methods.buyChips = function(balanceAmount, chipRate = 1) {
  if (this.wallet.balance >= balanceAmount) {
    const chipsToAdd = balanceAmount * chipRate;
    this.wallet.balance -= balanceAmount;
    this.wallet.chips += chipsToAdd;
    return this.save();
  }
  throw new Error('Insufficient balance');
};

module.exports = mongoose.model('User', userSchema);