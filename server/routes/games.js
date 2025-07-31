const express = require('express');
const Game = require('../models/Game');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get available rooms
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = [
      {
        name: 'Beginner',
        description: 'Perfect for new players',
        minBet: 10,
        maxBet: 100,
        buyIn: 100,
        maxPlayers: 6,
        difficulty: 'Easy',
        waitingPlayers: 0,
        activeGames: 0
      },
      {
        name: 'Intermediate',
        description: 'For experienced players',
        minBet: 50,
        maxBet: 500,
        buyIn: 500,
        maxPlayers: 6,
        difficulty: 'Medium',
        waitingPlayers: 0,
        activeGames: 0
      },
      {
        name: 'Advanced',
        description: 'High stakes gaming',
        minBet: 100,
        maxBet: 1000,
        buyIn: 1000,
        maxPlayers: 6,
        difficulty: 'Hard',
        waitingPlayers: 0,
        activeGames: 0
      },
      {
        name: 'VIP',
        description: 'Elite players only',
        minBet: 500,
        maxBet: 5000,
        buyIn: 5000,
        maxPlayers: 6,
        difficulty: 'Expert',
        waitingPlayers: 0,
        activeGames: 0
      }
    ];

    // Get real-time stats for each room
    const activeGamesStats = await Game.aggregate([
      {
        $match: { status: { $in: ['waiting', 'active'] } }
      },
      {
        $group: {
          _id: '$room.name',
          activeCount: { $sum: 1 },
          waitingCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Update room stats
    rooms.forEach(room => {
      const stats = activeGamesStats.find(stat => stat._id === room.name);
      if (stats) {
        room.activeGames = stats.activeCount;
        room.waitingPlayers = stats.waitingCount;
      }
    });

    res.json({
      success: true,
      data: { rooms }
    });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get rooms',
      error: error.message
    });
  }
});

// Get game details
router.get('/:gameId', auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = await Game.findOne({ gameId })
      .populate('players.user', 'username avatar city')
      .populate('winner.user', 'username avatar');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user is part of this game
    const userPlayer = game.players.find(p => p.user._id.toString() === req.userId);
    
    // Only show cards if user is part of the game or game is completed
    let gameData = game.toObject();
    if (!userPlayer && game.status !== 'completed') {
      gameData.players.forEach(player => {
        player.cards = [];
      });
    }

    res.json({
      success: true,
      data: { game: gameData }
    });

  } catch (error) {
    console.error('Get game details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game details',
      error: error.message
    });
  }
});

// Get game statistics
router.get('/stats/overview', auth, async (req, res) => {
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

    const [
      totalGames,
      activeGames,
      totalPot,
      averageGameDuration,
      popularRooms
    ] = await Promise.all([
      Game.countDocuments({
        createdAt: { $gte: startDate }
      }),
      Game.countDocuments({
        status: 'active'
      }),
      Game.aggregate([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalPot: { $sum: '$pot.total' },
            avgPot: { $avg: '$pot.total' }
          }
        }
      ]),
      Game.aggregate([
        {
          $match: {
            status: 'completed',
            duration: { $exists: true },
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' }
          }
        }
      ]),
      Game.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$room.name',
            count: { $sum: 1 },
            totalPot: { $sum: '$pot.total' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const stats = {
      totalGames,
      activeGames,
      totalPot: totalPot[0]?.totalPot || 0,
      averagePot: totalPot[0]?.avgPot || 0,
      averageGameDuration: Math.round(averageGameDuration[0]?.avgDuration || 0),
      popularRooms,
      period
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game statistics',
      error: error.message
    });
  }
});

// Get recent games
router.get('/recent/all', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentGames = await Game.find({
      status: 'completed'
    })
    .select('gameId room pot winner players startedAt endedAt duration')
    .populate('winner.user', 'username avatar')
    .populate('players.user', 'username avatar')
    .sort({ endedAt: -1 })
    .limit(parseInt(limit));

    const processedGames = recentGames.map(game => ({
      gameId: game.gameId,
      room: game.room.name,
      totalPlayers: game.players.length,
      pot: game.pot,
      winner: game.winner ? {
        username: game.winner.username,
        avatar: game.winner.user?.avatar,
        winAmount: game.winner.winAmount
      } : null,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      duration: game.duration
    }));

    res.json({
      success: true,
      data: { games: processedGames }
    });

  } catch (error) {
    console.error('Get recent games error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent games',
      error: error.message
    });
  }
});

// Get live games
router.get('/live/all', auth, async (req, res) => {
  try {
    const liveGames = await Game.find({
      status: 'active'
    })
    .select('gameId room pot players currentRound startedAt')
    .populate('players.user', 'username avatar city')
    .sort({ startedAt: -1 });

    const processedGames = liveGames.map(game => ({
      gameId: game.gameId,
      room: game.room.name,
      totalPlayers: game.players.length,
      activePlayers: game.players.filter(p => p.status === 'active').length,
      pot: game.pot,
      currentRound: game.currentRound,
      startedAt: game.startedAt,
      players: game.players.map(p => ({
        username: p.username,
        avatar: p.user?.avatar,
        city: p.user?.city,
        status: p.status,
        position: p.position
      }))
    }));

    res.json({
      success: true,
      data: { games: processedGames }
    });

  } catch (error) {
    console.error('Get live games error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get live games',
      error: error.message
    });
  }
});

// Get hand rankings reference
router.get('/rules/hands', auth, async (req, res) => {
  try {
    const handRankings = [
      {
        name: 'Trail (Three of a Kind)',
        description: 'Three cards of the same rank',
        example: 'A♠ A♥ A♦',
        rank: 5,
        probability: '0.24%'
      },
      {
        name: 'Pure Sequence (Straight Flush)',
        description: 'Three consecutive cards of the same suit',
        example: 'A♠ 2♠ 3♠',
        rank: 4,
        probability: '0.22%'
      },
      {
        name: 'Sequence (Straight)',
        description: 'Three consecutive cards of different suits',
        example: 'A♠ 2♥ 3♦',
        rank: 3,
        probability: '3.26%'
      },
      {
        name: 'Color (Flush)',
        description: 'Three cards of the same suit',
        example: 'K♠ 9♠ 5♠',
        rank: 2,
        probability: '4.96%'
      },
      {
        name: 'Pair',
        description: 'Two cards of the same rank',
        example: 'A♠ A♥ 5♦',
        rank: 1,
        probability: '16.94%'
      },
      {
        name: 'High Card',
        description: 'No matching cards',
        example: 'A♠ K♥ 9♦',
        rank: 0,
        probability: '74.38%'
      }
    ];

    res.json({
      success: true,
      data: { handRankings }
    });

  } catch (error) {
    console.error('Get hand rankings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hand rankings',
      error: error.message
    });
  }
});

module.exports = router;