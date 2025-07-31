const express = require('express');
const User = require('../models/User');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalGames,
      activeGames,
      totalRevenue,
      todayRevenue
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isOnline: true }),
      Game.countDocuments(),
      Game.countDocuments({ status: 'active' }),
      Transaction.aggregate([
        { $match: { type: 'commission' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            type: 'commission',
            createdAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        offline: totalUsers - activeUsers
      },
      games: {
        total: totalGames,
        active: activeGames,
        completed: totalGames - activeGames
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        today: todayRevenue[0]?.total || 0
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats',
      error: error.message
    });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Get user details
router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [user, recentTransactions, gameStats] = await Promise.all([
      User.findById(userId).select('-password'),
      Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('processedBy', 'username'),
      Game.find({ 'players.user': userId })
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user,
        recentTransactions,
        recentGames: gameStats
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details',
      error: error.message
    });
  }
});

// Block/Unblock user
router.patch('/users/:userId/status', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'blocked', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = status;
    if (status !== 'active') {
      user.isOnline = false;
    }
    await user.save();

    // Log the action
    console.log(`Admin ${req.user.username} changed user ${user.username} status to ${status}. Reason: ${reason}`);

    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : status} successfully`,
      data: { user: user }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// Delete user account
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active games
    const activeGames = await Game.countDocuments({
      'players.user': userId,
      status: 'active'
    });

    if (activeGames > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active games'
      });
    }

    // Soft delete - change status instead of removing
    user.status = 'deleted';
    user.isOnline = false;
    user.email = `deleted_${user.email}`;
    user.username = `deleted_${user.username}`;
    await user.save();

    // Log the action
    console.log(`Admin ${req.user.username} deleted user ${user.username}. Reason: ${reason}`);

    res.json({
      success: true,
      message: 'User account deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Adjust user balance
router.post('/users/:userId/balance', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, description } = req.body;

    if (!amount || !type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Amount, type, and description are required'
      });
    }

    if (!['chips', 'balance'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "chips" or "balance"'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create admin adjustment transaction
    const transaction = await Transaction.createAdminAdjustment(
      userId,
      req.userId,
      amount,
      type,
      description
    );

    // Get updated user
    const updatedUser = await User.findById(userId).select('-password');

    // Log the action
    console.log(`Admin ${req.user.username} adjusted ${user.username}'s ${type} by ${amount}. Reason: ${description}`);

    res.json({
      success: true,
      message: 'Balance adjusted successfully',
      data: {
        user: updatedUser,
        transaction
      }
    });

  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust balance',
      error: error.message
    });
  }
});

// Get game statistics
router.get('/games', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) {
      filter.status = status;
    }

    const [games, total] = await Promise.all([
      Game.find(filter)
        .populate('players.user', 'username email')
        .populate('winner.user', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Game.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        games,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get games',
      error: error.message
    });
  }
});

// Get transactions
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('user', 'username email')
        .populate('processedBy', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
});

// Get revenue analytics
router.get('/analytics/revenue', adminAuth, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let startDate;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          type: 'commission',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        revenueData
      }
    });

  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue analytics',
      error: error.message
    });
  }
});

// Generate tokens (Admin can create millions)
router.post('/generate-tokens', adminAuth, async (req, res) => {
  try {
    const { amount, description = 'Admin token generation' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Find admin user
    const admin = await User.findById(req.userId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    const balanceBefore = {
      chips: admin.wallet.chips,
      balance: admin.wallet.balance
    };

    // Add tokens to admin wallet
    admin.wallet.chips += amount;
    await admin.save();

    // Create transaction record
    const transaction = new Transaction({
      user: req.userId,
      type: 'admin_token_generation',
      amount,
      currency: 'chips',
      description,
      balanceBefore,
      balanceAfter: {
        chips: admin.wallet.chips,
        balance: admin.wallet.balance
      },
      status: 'completed',
      processedBy: req.userId,
      processedAt: new Date(),
      metadata: {
        generationType: 'bulk_generation',
        adminAction: true
      }
    });

    await transaction.save();

    // Log the action
    console.log(`Admin ${admin.username} generated ${amount} tokens. Reason: ${description}`);

    res.json({
      success: true,
      message: `Successfully generated ${amount} tokens`,
      data: {
        admin: {
          username: admin.username,
          wallet: admin.wallet
        },
        transaction,
        generatedAmount: amount
      }
    });

  } catch (error) {
    console.error('Generate tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tokens',
      error: error.message
    });
  }
});

// Admin send tokens to user
router.post('/send-tokens', adminAuth, async (req, res) => {
  try {
    const { recipientId, amount, message = 'Tokens from admin' } = req.body;

    if (!recipientId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID and valid amount are required'
      });
    }

    const [admin, recipient] = await Promise.all([
      User.findById(req.userId),
      User.findById(recipientId)
    ]);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    if (recipient.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Recipient account is not active'
      });
    }

    // Check if admin has enough tokens
    if (admin.wallet.chips < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient tokens in admin wallet'
      });
    }

    // Record balances before transfer
    const adminBalanceBefore = {
      chips: admin.wallet.chips,
      balance: admin.wallet.balance
    };
    const recipientBalanceBefore = {
      chips: recipient.wallet.chips,
      balance: recipient.wallet.balance
    };

    // Perform transfer
    admin.wallet.chips -= amount;
    recipient.wallet.chips += amount;

    await Promise.all([admin.save(), recipient.save()]);

    // Create transaction records
    const transferId = `admin_transfer_${Date.now()}`;

    const adminTransaction = new Transaction({
      user: admin._id,
      type: 'admin_token_send',
      amount,
      currency: 'chips',
      description: `Sent ${amount} tokens to ${recipient.username}`,
      reference: { transferId, recipientId },
      balanceBefore: adminBalanceBefore,
      balanceAfter: {
        chips: admin.wallet.chips,
        balance: admin.wallet.balance
      },
      status: 'completed',
      processedBy: req.userId,
      processedAt: new Date(),
      metadata: { message, recipientUsername: recipient.username }
    });

    const recipientTransaction = new Transaction({
      user: recipient._id,
      type: 'admin_token_receive',
      amount,
      currency: 'chips',
      description: `Received ${amount} tokens from admin`,
      reference: { transferId, senderId: admin._id },
      balanceBefore: recipientBalanceBefore,
      balanceAfter: {
        chips: recipient.wallet.chips,
        balance: recipient.wallet.balance
      },
      status: 'completed',
      processedBy: req.userId,
      processedAt: new Date(),
      metadata: { message, senderUsername: admin.username }
    });

    await Promise.all([
      adminTransaction.save(),
      recipientTransaction.save()
    ]);

    // Log the action
    console.log(`Admin ${admin.username} sent ${amount} tokens to ${recipient.username}. Message: ${message}`);

    res.json({
      success: true,
      message: `Successfully sent ${amount} tokens to ${recipient.username}`,
      data: {
        transferId,
        amount,
        recipient: {
          username: recipient.username,
          newBalance: recipient.wallet.chips
        },
        admin: {
          username: admin.username,
          newBalance: admin.wallet.chips
        }
      }
    });

  } catch (error) {
    console.error('Admin send tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send tokens',
      error: error.message
    });
  }
});

// Admin receive tokens from user (for special cases)
router.post('/receive-tokens', adminAuth, async (req, res) => {
  try {
    const { senderId, amount, reason = 'Admin token collection' } = req.body;

    if (!senderId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sender ID and valid amount are required'
      });
    }

    const [admin, sender] = await Promise.all([
      User.findById(req.userId),
      User.findById(senderId)
    ]);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found'
      });
    }

    // Check if sender has enough tokens
    if (sender.wallet.chips < amount) {
      return res.status(400).json({
        success: false,
        message: 'Sender has insufficient tokens'
      });
    }

    // Record balances before transfer
    const adminBalanceBefore = {
      chips: admin.wallet.chips,
      balance: admin.wallet.balance
    };
    const senderBalanceBefore = {
      chips: sender.wallet.chips,
      balance: sender.wallet.balance
    };

    // Perform transfer
    sender.wallet.chips -= amount;
    admin.wallet.chips += amount;

    await Promise.all([admin.save(), sender.save()]);

    // Create transaction records
    const transferId = `admin_collect_${Date.now()}`;

    const adminTransaction = new Transaction({
      user: admin._id,
      type: 'admin_token_receive',
      amount,
      currency: 'chips',
      description: `Received ${amount} tokens from ${sender.username}`,
      reference: { transferId, senderId },
      balanceBefore: adminBalanceBefore,
      balanceAfter: {
        chips: admin.wallet.chips,
        balance: admin.wallet.balance
      },
      status: 'completed',
      processedBy: req.userId,
      processedAt: new Date(),
      metadata: { reason, senderUsername: sender.username }
    });

    const senderTransaction = new Transaction({
      user: sender._id,
      type: 'admin_token_deduction',
      amount,
      currency: 'chips',
      description: `${amount} tokens collected by admin`,
      reference: { transferId, adminId: admin._id },
      balanceBefore: senderBalanceBefore,
      balanceAfter: {
        chips: sender.wallet.chips,
        balance: sender.wallet.balance
      },
      status: 'completed',
      processedBy: req.userId,
      processedAt: new Date(),
      metadata: { reason, adminUsername: admin.username }
    });

    await Promise.all([
      adminTransaction.save(),
      senderTransaction.save()
    ]);

    // Log the action
    console.log(`Admin ${admin.username} collected ${amount} tokens from ${sender.username}. Reason: ${reason}`);

    res.json({
      success: true,
      message: `Successfully collected ${amount} tokens from ${sender.username}`,
      data: {
        transferId,
        amount,
        sender: {
          username: sender.username,
          newBalance: sender.wallet.chips
        },
        admin: {
          username: admin.username,
          newBalance: admin.wallet.chips
        }
      }
    });

  } catch (error) {
    console.error('Admin receive tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive tokens',
      error: error.message
    });
  }
});

// Get admin token management stats
router.get('/token-stats', adminAuth, async (req, res) => {
  try {
    const [
      totalGenerated,
      totalSent,
      totalReceived,
      recentTransfers
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { type: 'admin_token_generation' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'admin_token_send' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { type: 'admin_token_receive' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.find({
        type: { $in: ['admin_token_generation', 'admin_token_send', 'admin_token_receive'] }
      })
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    const stats = {
      totalGenerated: totalGenerated[0]?.total || 0,
      totalSent: totalSent[0]?.total || 0,
      totalReceived: totalReceived[0]?.total || 0,
      netTokens: (totalGenerated[0]?.total || 0) + (totalReceived[0]?.total || 0) - (totalSent[0]?.total || 0),
      recentTransfers
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get token stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get token stats',
      error: error.message
    });
  }
});

module.exports = router;