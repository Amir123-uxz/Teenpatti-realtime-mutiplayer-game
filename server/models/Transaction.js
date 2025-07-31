const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'game_win', 'game_loss', 'commission', 'chip_purchase', 'bonus', 'referral', 'admin_adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['chips', 'balance'],
    default: 'chips'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    gameId: String,
    orderId: String,
    paymentId: String,
    adminId: String
  },
  balanceBefore: {
    chips: Number,
    balance: Number
  },
  balanceAfter: {
    chips: Number,
    balance: Number
  },
  metadata: {
    paymentMethod: String,
    gateway: String,
    commission: Number,
    ipAddress: String,
    userAgent: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ 'reference.gameId': 1 });

// Static method to create game transaction
transactionSchema.statics.createGameTransaction = async function(userId, type, amount, gameId, description) {
  const User = require('./User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const balanceBefore = {
    chips: user.wallet.chips,
    balance: user.wallet.balance
  };

  // Create transaction
  const transaction = new this({
    user: userId,
    type,
    amount,
    currency: 'chips',
    description,
    reference: { gameId },
    balanceBefore,
    status: 'completed',
    processedAt: new Date()
  });

  // Update user balance
  if (type === 'game_win') {
    user.wallet.chips += amount;
    user.gameStats.totalWinnings += amount;
    user.gameStats.gamesWon += 1;
  } else if (type === 'game_loss') {
    user.wallet.chips -= amount;
    user.gameStats.totalLosses += amount;
  }

  user.gameStats.gamesPlayed += 1;
  user.updateWinRate();

  transaction.balanceAfter = {
    chips: user.wallet.chips,
    balance: user.wallet.balance
  };

  await Promise.all([transaction.save(), user.save()]);
  return transaction;
};

// Static method to create commission transaction
transactionSchema.statics.createCommissionTransaction = async function(gameId, totalPot, commission) {
  const transaction = new this({
    user: null, // System transaction
    type: 'commission',
    amount: commission,
    currency: 'chips',
    description: `Commission from game ${gameId}`,
    reference: { gameId },
    status: 'completed',
    processedAt: new Date(),
    metadata: {
      totalPot,
      commissionRate: 3
    }
  });

  await transaction.save();
  return transaction;
};

// Static method to create admin adjustment
transactionSchema.statics.createAdminAdjustment = async function(userId, adminId, amount, type, description) {
  const User = require('./User');
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const balanceBefore = {
    chips: user.wallet.chips,
    balance: user.wallet.balance
  };

  // Update user balance
  if (type === 'balance') {
    user.wallet.balance += amount;
  } else {
    user.wallet.chips += amount;
  }

  const transaction = new this({
    user: userId,
    type: 'admin_adjustment',
    amount: Math.abs(amount),
    currency: type,
    description,
    reference: { adminId },
    balanceBefore,
    balanceAfter: {
      chips: user.wallet.chips,
      balance: user.wallet.balance
    },
    status: 'completed',
    processedBy: adminId,
    processedAt: new Date()
  });

  await Promise.all([transaction.save(), user.save()]);
  return transaction;
};

module.exports = mongoose.model('Transaction', transactionSchema);