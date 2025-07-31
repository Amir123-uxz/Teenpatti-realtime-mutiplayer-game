const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get wallet balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        wallet: user.wallet
      }
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance',
      error: error.message
    });
  }
});

// Buy chips with balance
router.post('/buy-chips', auth, async (req, res) => {
  try {
    const { amount } = req.body; // Amount of balance to convert
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has enough balance
    if (user.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Convert balance to chips (1:1 ratio)
    const chipRate = 1;
    const balanceBefore = {
      chips: user.wallet.chips,
      balance: user.wallet.balance
    };

    await user.buyChips(amount, chipRate);

    // Create transaction record
    const transaction = new Transaction({
      user: req.userId,
      type: 'chip_purchase',
      amount: amount * chipRate,
      currency: 'chips',
      description: `Purchased ${amount * chipRate} chips with ${amount} balance`,
      balanceBefore,
      balanceAfter: {
        chips: user.wallet.chips,
        balance: user.wallet.balance
      },
      status: 'completed',
      processedAt: new Date()
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Chips purchased successfully',
      data: {
        wallet: user.wallet,
        transaction
      }
    });

  } catch (error) {
    console.error('Buy chips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to buy chips',
      error: error.message
    });
  }
});

// Top up balance (simulate payment)
router.post('/topup', auth, async (req, res) => {
  try {
    const { amount, paymentMethod = 'card' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Minimum top-up amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum top-up amount is ₹100'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const balanceBefore = {
      chips: user.wallet.chips,
      balance: user.wallet.balance
    };

    // Simulate payment processing
    // In a real app, you would integrate with payment gateways like Razorpay, Stripe, etc.
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Add amount to balance
    user.wallet.balance += amount;
    user.wallet.totalDeposited += amount;
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      user: req.userId,
      type: 'deposit',
      amount,
      currency: 'balance',
      description: `Wallet top-up via ${paymentMethod}`,
      reference: {
        paymentId,
        orderId: `order_${Date.now()}`
      },
      balanceBefore,
      balanceAfter: {
        chips: user.wallet.chips,
        balance: user.wallet.balance
      },
      metadata: {
        paymentMethod,
        gateway: 'simulation'
      },
      status: 'completed',
      processedAt: new Date()
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Wallet topped up successfully',
      data: {
        wallet: user.wallet,
        transaction,
        paymentId
      }
    });

  } catch (error) {
    console.error('Top-up error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to top up wallet',
      error: error.message
    });
  }
});

// Withdraw balance (simulate)
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { amount, method = 'bank' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Minimum withdrawal amount
    if (amount < 500) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹500'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has enough balance
    if (user.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    const balanceBefore = {
      chips: user.wallet.chips,
      balance: user.wallet.balance
    };

    // Deduct amount from balance
    user.wallet.balance -= amount;
    user.wallet.totalWithdrawn += amount;
    await user.save();

    // Create pending transaction record
    const transaction = new Transaction({
      user: req.userId,
      type: 'withdrawal',
      amount,
      currency: 'balance',
      description: `Withdrawal to ${method}`,
      reference: {
        orderId: `withdraw_${Date.now()}`
      },
      balanceBefore,
      balanceAfter: {
        chips: user.wallet.chips,
        balance: user.wallet.balance
      },
      metadata: {
        withdrawalMethod: method
      },
      status: 'pending' // Withdrawals need admin approval
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        wallet: user.wallet,
        transaction
      }
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    });
  }
});

// Get transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    let filter = { user: req.userId };
    if (type) {
      filter.type = type;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('processedBy', 'username'),
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

// Get wallet statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const [
      totalDeposits,
      totalWithdrawals,
      totalWinnings,
      totalLosses,
      recentTransactions
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'game_win' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'game_loss' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type amount createdAt status')
    ]);

    const stats = {
      totalDeposits: totalDeposits[0]?.total || 0,
      totalWithdrawals: totalWithdrawals[0]?.total || 0,
      totalWinnings: totalWinnings[0]?.total || 0,
      totalLosses: totalLosses[0]?.total || 0,
      netProfitLoss: (totalWinnings[0]?.total || 0) - (totalLosses[0]?.total || 0),
      recentTransactions
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get wallet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet stats',
      error: error.message
    });
  }
});

// Transfer chips to another user (Enhanced version)
router.post('/transfer', auth, async (req, res) => {
  try {
    const { recipientUsername, recipientEmail, amount, message } = req.body;
    
    if ((!recipientUsername && !recipientEmail) || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient identifier (username or email) and valid amount are required'
      });
    }

    // Minimum transfer amount
    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum transfer amount is 1 chip'
      });
    }

    // Find recipient by username or email
    let recipientQuery = { status: 'active' };
    if (recipientUsername) {
      recipientQuery.username = recipientUsername;
    } else {
      recipientQuery.email = recipientEmail;
    }

    const [sender, recipient] = await Promise.all([
      User.findById(req.userId),
      User.findOne(recipientQuery)
    ]);

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: 'Sender not found'
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found or inactive'
      });
    }

    if (sender._id.toString() === recipient._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer to yourself'
      });
    }

    // Check if sender has enough chips
    if (sender.wallet.chips < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient chips'
      });
    }

    // Record balances before transfer
    const senderBalanceBefore = {
      chips: sender.wallet.chips,
      balance: sender.wallet.balance
    };
    const recipientBalanceBefore = {
      chips: recipient.wallet.chips,
      balance: recipient.wallet.balance
    };

    // Perform transfer with automatic wallet updates
    sender.wallet.chips -= amount;
    recipient.wallet.chips += amount;

    await Promise.all([sender.save(), recipient.save()]);

    // Create transaction records
    const transferId = `user_transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const senderTransaction = new Transaction({
      user: sender._id,
      type: 'chip_transfer_out',
      amount,
      currency: 'chips',
      description: `Transferred ${amount} chips to ${recipient.username}`,
      reference: { transferId, recipientId: recipient._id },
      balanceBefore: senderBalanceBefore,
      balanceAfter: {
        chips: sender.wallet.chips,
        balance: sender.wallet.balance
      },
      status: 'completed',
      processedAt: new Date(),
      metadata: { 
        message: message || 'User transfer', 
        recipientUsername: recipient.username,
        recipientEmail: recipient.email,
        transferType: 'user_to_user'
      }
    });

    const recipientTransaction = new Transaction({
      user: recipient._id,
      type: 'chip_transfer_in',
      amount,
      currency: 'chips',
      description: `Received ${amount} chips from ${sender.username}`,
      reference: { transferId, senderId: sender._id },
      balanceBefore: recipientBalanceBefore,
      balanceAfter: {
        chips: recipient.wallet.chips,
        balance: recipient.wallet.balance
      },
      status: 'completed',
      processedAt: new Date(),
      metadata: { 
        message: message || 'User transfer', 
        senderUsername: sender.username,
        senderEmail: sender.email,
        transferType: 'user_to_user'
      }
    });

    await Promise.all([
      senderTransaction.save(),
      recipientTransaction.save()
    ]);

    res.json({
      success: true,
      message: 'Chips transferred successfully',
      data: {
        transferId,
        amount,
        sender: {
          username: sender.username,
          newBalance: sender.wallet.chips
        },
        recipient: {
          username: recipient.username,
          newBalance: recipient.wallet.chips
        },
        message: message || 'User transfer'
      }
    });

  } catch (error) {
    console.error('Transfer chips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer chips',
      error: error.message
    });
  }
});

// Get transfer history for current user
router.get('/transfers', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 
      user: req.userId,
      type: { $in: ['chip_transfer_in', 'chip_transfer_out', 'admin_token_receive', 'admin_token_send'] }
    };
    
    if (type && ['sent', 'received'].includes(type)) {
      if (type === 'sent') {
        filter.type = { $in: ['chip_transfer_out', 'admin_token_send'] };
      } else {
        filter.type = { $in: ['chip_transfer_in', 'admin_token_receive'] };
      }
    }

    const [transfers, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('processedBy', 'username'),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        transfers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transfer history',
      error: error.message
    });
  }
});

// Request chips from another user
router.post('/request-chips', auth, async (req, res) => {
  try {
    const { recipientUsername, amount, message } = req.body;
    
    if (!recipientUsername || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipient username and valid amount are required'
      });
    }

    const [requester, recipient] = await Promise.all([
      User.findById(req.userId),
      User.findOne({ username: recipientUsername, status: 'active' })
    ]);

    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'Requester not found'
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found or inactive'
      });
    }

    if (requester._id.toString() === recipient._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request chips from yourself'
      });
    }

    // Create a chip request record (could be expanded to a separate ChipRequest model)
    const requestId = `chip_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // For now, we'll just create a notification-like transaction
    const requestTransaction = new Transaction({
      user: requester._id,
      type: 'chip_request',
      amount,
      currency: 'chips',
      description: `Requested ${amount} chips from ${recipientUsername}`,
      reference: { requestId, recipientId: recipient._id },
      status: 'pending',
      metadata: { 
        message: message || 'Chip request', 
        recipientUsername: recipient.username,
        requestType: 'chip_request'
      }
    });

    await requestTransaction.save();

    res.json({
      success: true,
      message: `Chip request sent to ${recipientUsername}`,
      data: {
        requestId,
        amount,
        recipient: recipientUsername,
        message: message || 'Chip request'
      }
    });

  } catch (error) {
    console.error('Request chips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request chips',
      error: error.message
    });
  }
});

module.exports = router;