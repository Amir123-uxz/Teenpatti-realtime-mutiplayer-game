const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    default: 'teenpatti',
    enum: ['teenpatti']
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: String,
    avatar: String,
    position: Number,
    cards: [String],
    bet: {
      type: Number,
      default: 0
    },
    totalBet: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['active', 'folded', 'all-in', 'disconnected'],
      default: 'active'
    },
    isDealer: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  room: {
    name: String,
    maxPlayers: {
      type: Number,
      default: 6
    },
    minBet: {
      type: Number,
      default: 10
    },
    maxBet: {
      type: Number,
      default: 1000
    },
    buyIn: {
      type: Number,
      default: 100
    }
  },
  pot: {
    total: {
      type: Number,
      default: 0
    },
    commission: {
      type: Number,
      default: 0
    },
    netPot: {
      type: Number,
      default: 0
    }
  },
  currentRound: {
    type: Number,
    default: 1
  },
  currentPlayer: {
    type: Number,
    default: 0
  },
  deck: [String],
  communityCards: [String],
  gameHistory: [{
    round: Number,
    action: String,
    player: String,
    amount: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  winner: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    winningHand: String,
    winAmount: Number
  },
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in seconds
}, {
  timestamps: true
});

// Calculate commission (3% of total pot)
gameSchema.methods.calculateCommission = function() {
  this.pot.commission = Math.floor(this.pot.total * 0.03);
  this.pot.netPot = this.pot.total - this.pot.commission;
};

// Add bet to pot
gameSchema.methods.addToPot = function(amount) {
  this.pot.total += amount;
  this.calculateCommission();
};

// Get active players
gameSchema.methods.getActivePlayers = function() {
  return this.players.filter(player => player.status === 'active');
};

// Check if game can start
gameSchema.methods.canStart = function() {
  const activePlayers = this.getActivePlayers();
  return activePlayers.length >= 2 && this.status === 'waiting';
};

// End game
gameSchema.methods.endGame = function(winner) {
  this.status = 'completed';
  this.endedAt = new Date();
  this.duration = Math.floor((this.endedAt - this.startedAt) / 1000);
  
  if (winner) {
    this.winner = winner;
  }
};

// Add game action to history
gameSchema.methods.addAction = function(action, player, amount = 0) {
  this.gameHistory.push({
    round: this.currentRound,
    action,
    player,
    amount,
    timestamp: new Date()
  });
};

module.exports = mongoose.model('Game', gameSchema);