const express = require('express');
const User = require('../models/User');
const Game = require('../models/Game');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('referredBy', 'username');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { username, city, country, avatar, preferences } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username is unique (if being changed)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username;
    }

    // Update other fields
    if (city) user.city = city;
    if (country) user.country = country;
    if (avatar) user.avatar = avatar;
    if (preferences) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// Get user game history
router.get('/games', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 'players.user': req.userId };
    if (status) {
      filter.status = status;
    }

    const [games, total] = await Promise.all([
      Game.find(filter)
        .select('gameId status pot winner startedAt endedAt duration players')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Game.countDocuments(filter)
    ]);

    // Process games to show user-specific data
    const processedGames = games.map(game => {
      const userPlayer = game.players.find(p => p.user.toString() === req.userId);
      const isWinner = game.winner && game.winner.user.toString() === req.userId;
      
      return {
        gameId: game.gameId,
        status: game.status,
        startedAt: game.startedAt,
        endedAt: game.endedAt,
        duration: game.duration,
        totalPlayers: game.players.length,
        pot: game.pot,
        userBet: userPlayer ? userPlayer.totalBet : 0,
        userPosition: userPlayer ? userPlayer.position : null,
        userStatus: userPlayer ? userPlayer.status : null,
        isWinner,
        winAmount: isWinner ? game.winner.winAmount : 0
      };
    });

    res.json({
      success: true,
      data: {
        games: processedGames,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get game history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game history',
      error: error.message
    });
  }
});

// Get user statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('gameStats wallet');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats
    const [
      totalGames,
      recentWins,
      bestWin,
      currentStreak
    ] = await Promise.all([
      Game.countDocuments({ 'players.user': req.userId, status: 'completed' }),
      Game.countDocuments({ 
        'winner.user': req.userId,
        endedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      Transaction.findOne({
        user: req.userId,
        type: 'game_win'
      }).sort({ amount: -1 }).select('amount'),
      this.calculateWinStreak(req.userId)
    ]);

    const stats = {
      ...user.gameStats,
      totalGames,
      recentWins,
      bestWin: bestWin ? bestWin.amount : 0,
      currentStreak: currentStreak || 0,
      wallet: user.wallet
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
      error: error.message
    });
  }
});

// Search users by email/ID
router.get('/search', auth, async (req, res) => {
  try {
    const { query, city } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    let filter = {
      status: 'active',
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    };

    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }

    const users = await User.find(filter)
      .select('username email city country avatar isOnline lastSeen gameStats')
      .limit(20)
      .sort({ isOnline: -1, lastSeen: -1 });

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users',
      error: error.message
    });
  }
});

// Get leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { type = 'winnings', period = 'all', limit = 50 } = req.query;
    
    let matchFilter = { status: 'active' };
    let sortField = {};

    // Set date filter for period
    if (period !== 'all') {
      let startDate;
      switch (period) {
        case 'daily':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        matchFilter.updatedAt = { $gte: startDate };
      }
    }

    // Set sort field based on type
    switch (type) {
      case 'winnings':
        sortField = { 'gameStats.totalWinnings': -1 };
        break;
      case 'games':
        sortField = { 'gameStats.gamesPlayed': -1 };
        break;
      case 'winrate':
        sortField = { 'gameStats.winRate': -1 };
        break;
      case 'chips':
        sortField = { 'wallet.chips': -1 };
        break;
      default:
        sortField = { 'gameStats.totalWinnings': -1 };
    }

    const leaderboard = await User.find(matchFilter)
      .select('username city country avatar gameStats wallet isOnline')
      .sort(sortField)
      .limit(parseInt(limit));

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      city: user.city,
      country: user.country,
      avatar: user.avatar,
      isOnline: user.isOnline,
      stats: {
        totalWinnings: user.gameStats.totalWinnings,
        gamesPlayed: user.gameStats.gamesPlayed,
        gamesWon: user.gameStats.gamesWon,
        winRate: user.gameStats.winRate,
        chips: user.wallet.chips
      }
    }));

    res.json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        type,
        period
      }
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
});

// Get online users by city
router.get('/online', auth, async (req, res) => {
  try {
    const { city } = req.query;
    const currentUser = await User.findById(req.userId);
    
    let filter = { 
      isOnline: true, 
      status: 'active',
      _id: { $ne: req.userId } // Exclude current user
    };

    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    } else if (currentUser && currentUser.city) {
      // Default to current user's city
      filter.city = currentUser.city;
    }

    const onlineUsers = await User.find(filter)
      .select('username city country avatar gameStats lastSeen')
      .sort({ lastSeen: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        users: onlineUsers,
        count: onlineUsers.length,
        city: city || currentUser?.city
      }
    });

  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get online users',
      error: error.message
    });
  }
});

// Get user's referrals
router.get('/referrals', auth, async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.userId })
      .select('username email city createdAt gameStats')
      .sort({ createdAt: -1 });

    const totalReferrals = referrals.length;
    const totalBonus = totalReferrals * 50; // 50 chips per referral

    res.json({
      success: true,
      data: {
        referrals,
        totalReferrals,
        totalBonus,
        referralCode: req.user.referralCode
      }
    });

  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referrals',
      error: error.message
    });
  }
});

// Helper function to calculate win streak
async function calculateWinStreak(userId) {
  try {
    const recentGames = await Game.find({
      'players.user': userId,
      status: 'completed'
    })
    .sort({ endedAt: -1 })
    .limit(20)
    .select('winner');

    let streak = 0;
    for (const game of recentGames) {
      if (game.winner && game.winner.user.toString() === userId) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Calculate win streak error:', error);
    return 0;
  }
}

module.exports = router;