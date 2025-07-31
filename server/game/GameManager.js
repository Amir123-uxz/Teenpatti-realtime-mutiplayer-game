const { v4: uuidv4 } = require('uuid');
const Game = require('../models/Game');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TeenPattiGame = require('./TeenPattiGame');

class GameManager {
  constructor(io) {
    this.io = io;
    this.activeGames = new Map();
    this.userSockets = new Map();
    this.roomQueues = new Map();
    this.teenPattiGame = new TeenPattiGame();
    
    // Initialize default rooms
    this.initializeRooms();
  }

  initializeRooms() {
    const defaultRooms = [
      { name: 'Beginner', minBet: 10, maxBet: 100, buyIn: 100 },
      { name: 'Intermediate', minBet: 50, maxBet: 500, buyIn: 500 },
      { name: 'Advanced', minBet: 100, maxBet: 1000, buyIn: 1000 },
      { name: 'VIP', minBet: 500, maxBet: 5000, buyIn: 5000 }
    ];

    defaultRooms.forEach(room => {
      this.roomQueues.set(room.name, {
        ...room,
        waitingPlayers: []
      });
    });
  }

  async handleJoinRoom(socket, data) {
    try {
      const { userId, roomName, userInfo } = data;
      
      // Validate user
      const user = await User.findById(userId);
      if (!user || user.status !== 'active') {
        socket.emit('error', { message: 'User not found or inactive' });
        return;
      }

      // Check if user has enough chips
      const room = this.roomQueues.get(roomName);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (user.wallet.chips < room.buyIn) {
        socket.emit('error', { message: 'Insufficient chips to join this room' });
        return;
      }

      // Store user socket mapping
      this.userSockets.set(userId, socket);
      socket.userId = userId;
      socket.username = user.username;

      // Update user online status
      user.isOnline = true;
      await user.save();

      // Add to room queue
      const playerInfo = {
        userId,
        username: user.username,
        avatar: user.avatar || '',
        chips: user.wallet.chips,
        socketId: socket.id,
        city: user.city,
        country: user.country
      };

      room.waitingPlayers.push(playerInfo);
      socket.join(roomName);

      // Notify room about new player
      this.io.to(roomName).emit('player-joined', {
        player: playerInfo,
        waitingCount: room.waitingPlayers.length
      });

      // Try to start a game if enough players
      if (room.waitingPlayers.length >= 2) {
        await this.startGame(roomName);
      }

      socket.emit('joined-room', {
        roomName,
        player: playerInfo,
        waitingPlayers: room.waitingPlayers
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  async startGame(roomName) {
    try {
      const room = this.roomQueues.get(roomName);
      if (!room || room.waitingPlayers.length < 2) return;

      // Take players for the game (max 6 players)
      const gamePlayers = room.waitingPlayers.splice(0, Math.min(6, room.waitingPlayers.length));
      
      // Create new game
      const gameId = uuidv4();
      const deck = this.teenPattiGame.createDeck();
      const hands = this.teenPattiGame.dealCards(deck, gamePlayers.length);

      // Create game document
      const gameDoc = new Game({
        gameId,
        status: 'active',
        room: {
          name: roomName,
          minBet: room.minBet,
          maxBet: room.maxBet,
          buyIn: room.buyIn,
          maxPlayers: 6
        },
        players: gamePlayers.map((player, index) => ({
          user: player.userId,
          username: player.username,
          avatar: player.avatar,
          position: index,
          cards: hands[index],
          bet: 0,
          totalBet: 0,
          status: 'active',
          isDealer: index === 0
        })),
        deck: deck,
        startedAt: new Date()
      });

      await gameDoc.save();

      // Store active game
      this.activeGames.set(gameId, {
        game: gameDoc,
        roomName,
        players: gamePlayers,
        currentPlayerIndex: 0,
        roundBet: room.minBet,
        lastAction: null
      });

      // Create game room
      const gameRoomName = `game-${gameId}`;
      gamePlayers.forEach(player => {
        const socket = this.userSockets.get(player.userId);
        if (socket) {
          socket.leave(roomName);
          socket.join(gameRoomName);
        }
      });

      // Deduct buy-in from players
      for (const player of gamePlayers) {
        const user = await User.findById(player.userId);
        await user.deductChips(room.buyIn);
        gameDoc.addToPot(room.buyIn);
      }

      await gameDoc.save();

      // Start the game
      this.io.to(gameRoomName).emit('game-started', {
        gameId,
        players: gameDoc.players.map(p => ({
          username: p.username,
          avatar: p.avatar,
          position: p.position,
          chips: p.totalBet,
          status: p.status,
          isDealer: p.isDealer,
          cards: [] // Don't send cards to other players
        })),
        pot: gameDoc.pot,
        currentPlayer: 0,
        minBet: room.minBet,
        maxBet: room.maxBet
      });

      // Send private cards to each player
      gamePlayers.forEach((player, index) => {
        const socket = this.userSockets.get(player.userId);
        if (socket) {
          socket.emit('your-cards', {
            cards: hands[index]
          });
        }
      });

      // Start betting round
      setTimeout(() => {
        this.startBettingRound(gameId);
      }, 3000);

    } catch (error) {
      console.error('Error starting game:', error);
    }
  }

  startBettingRound(gameId) {
    const gameSession = this.activeGames.get(gameId);
    if (!gameSession) return;

    const gameRoomName = `game-${gameId}`;
    const currentPlayer = gameSession.game.players[gameSession.currentPlayerIndex];

    this.io.to(gameRoomName).emit('betting-turn', {
      currentPlayer: gameSession.currentPlayerIndex,
      username: currentPlayer.username,
      minBet: gameSession.roundBet,
      maxBet: gameSession.game.room.maxBet,
      pot: gameSession.game.pot,
      timeLimit: 30000 // 30 seconds
    });

    // Set timeout for auto-fold
    setTimeout(() => {
      this.handleAutoAction(gameId, gameSession.currentPlayerIndex);
    }, 30000);
  }

  async handlePlaceBet(socket, data) {
    try {
      const { gameId, action, amount } = data;
      const gameSession = this.activeGames.get(gameId);
      
      if (!gameSession) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const playerIndex = gameSession.game.players.findIndex(p => p.user.toString() === socket.userId);
      if (playerIndex === -1 || playerIndex !== gameSession.currentPlayerIndex) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      const player = gameSession.game.players[playerIndex];
      const user = await User.findById(socket.userId);

      // Validate action
      if (!this.validateAction(action, amount, player, gameSession, user)) {
        socket.emit('error', { message: 'Invalid action' });
        return;
      }

      // Process action
      await this.processPlayerAction(gameId, playerIndex, action, amount);

    } catch (error) {
      console.error('Error placing bet:', error);
      socket.emit('error', { message: 'Failed to place bet' });
    }
  }

  validateAction(action, amount, player, gameSession, user) {
    switch (action) {
      case 'fold':
        return true;
      case 'call':
        return user.wallet.chips >= gameSession.roundBet;
      case 'raise':
        return amount >= gameSession.roundBet * 2 && 
               amount <= gameSession.game.room.maxBet &&
               user.wallet.chips >= amount;
      default:
        return false;
    }
  }

  async processPlayerAction(gameId, playerIndex, action, amount = 0) {
    const gameSession = this.activeGames.get(gameId);
    const gameRoomName = `game-${gameId}`;
    const player = gameSession.game.players[playerIndex];
    const user = await User.findById(player.user);

    // Update player based on action
    switch (action) {
      case 'fold':
        player.status = 'folded';
        break;
      case 'call':
        await user.deductChips(gameSession.roundBet);
        player.bet = gameSession.roundBet;
        player.totalBet += gameSession.roundBet;
        gameSession.game.addToPot(gameSession.roundBet);
        break;
      case 'raise':
        await user.deductChips(amount);
        player.bet = amount;
        player.totalBet += amount;
        gameSession.game.addToPot(amount);
        gameSession.roundBet = amount;
        break;
    }

    // Add to game history
    gameSession.game.addAction(action, player.username, amount);

    // Broadcast action to all players
    this.io.to(gameRoomName).emit('player-action', {
      playerIndex,
      username: player.username,
      action,
      amount,
      pot: gameSession.game.pot,
      playerStatus: player.status
    });

    // Check if round/game should end
    const activePlayers = gameSession.game.getActivePlayers();
    if (activePlayers.length <= 1) {
      await this.endGame(gameId);
      return;
    }

    // Move to next player
    this.moveToNextPlayer(gameId);
  }

  moveToNextPlayer(gameId) {
    const gameSession = this.activeGames.get(gameId);
    const players = gameSession.game.players;
    
    do {
      gameSession.currentPlayerIndex = (gameSession.currentPlayerIndex + 1) % players.length;
    } while (players[gameSession.currentPlayerIndex].status !== 'active');

    // Check if betting round is complete
    const activePlayers = players.filter(p => p.status === 'active');
    const allCalled = activePlayers.every(p => p.bet === gameSession.roundBet || p.status === 'folded');

    if (allCalled || activePlayers.length === 1) {
      setTimeout(() => this.endGame(gameId), 2000);
    } else {
      setTimeout(() => this.startBettingRound(gameId), 1000);
    }
  }

  async endGame(gameId) {
    try {
      const gameSession = this.activeGames.get(gameId);
      if (!gameSession) return;

      const gameRoomName = `game-${gameId}`;
      const game = gameSession.game;
      
      // Find winner
      const activePlayers = game.players.filter(p => p.status === 'active');
      let winner = null;

      if (activePlayers.length === 1) {
        // Winner by fold
        winner = activePlayers[0];
      } else {
        // Showdown - compare hands
        const playersWithHands = activePlayers.map(p => ({
          ...p,
          cards: p.cards
        }));
        winner = this.teenPattiGame.findWinner(playersWithHands);
      }

      // Update game document
      game.endGame({
        user: winner.user,
        username: winner.username,
        winningHand: this.teenPattiGame.evaluateHand(winner.cards).description,
        winAmount: game.pot.netPot
      });

      await game.save();

      // Create transactions
      await Transaction.createGameTransaction(
        winner.user,
        'game_win',
        game.pot.netPot,
        gameId,
        `Won Teen Patti game ${gameId}`
      );

      // Create commission transaction
      await Transaction.createCommissionTransaction(gameId, game.pot.total, game.pot.commission);

      // Update user chips
      const winnerUser = await User.findById(winner.user);
      await winnerUser.addChips(game.pot.netPot);

      // Generate game stats
      const gameStats = this.teenPattiGame.generateGameStats(game.players, winner, game.pot);

      // Broadcast game end
      this.io.to(gameRoomName).emit('game-ended', {
        winner: {
          username: winner.username,
          hand: this.teenPattiGame.evaluateHand(winner.cards),
          winAmount: game.pot.netPot
        },
        allHands: game.players.map(p => ({
          username: p.username,
          cards: p.cards,
          hand: this.teenPattiGame.evaluateHand(p.cards)
        })),
        gameStats
      });

      // Clean up
      this.activeGames.delete(gameId);

      // Move players back to room lobby
      setTimeout(() => {
        gameSession.players.forEach(player => {
          const socket = this.userSockets.get(player.userId);
          if (socket) {
            socket.leave(gameRoomName);
            socket.join(gameSession.roomName);
          }
        });
      }, 10000);

    } catch (error) {
      console.error('Error ending game:', error);
    }
  }

  async handleAutoAction(gameId, playerIndex) {
    const gameSession = this.activeGames.get(gameId);
    if (!gameSession) return;

    const player = gameSession.game.players[playerIndex];
    if (player.status !== 'active' || gameSession.currentPlayerIndex !== playerIndex) return;

    // Auto-fold the player
    await this.processPlayerAction(gameId, playerIndex, 'fold');
  }

  async handleSearchUsers(socket, data) {
    try {
      const { query, city } = data;
      let searchFilter = {
        status: 'active',
        isOnline: true
      };

      if (query) {
        searchFilter.$or = [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ];
      }

      if (city) {
        searchFilter.city = { $regex: city, $options: 'i' };
      }

      const users = await User.find(searchFilter)
        .select('username email city avatar isOnline lastSeen')
        .limit(20);

      socket.emit('search-results', { users });

    } catch (error) {
      console.error('Error searching users:', error);
      socket.emit('error', { message: 'Search failed' });
    }
  }

  async handleLeaveRoom(socket, data) {
    try {
      const { roomName } = data;
      const room = this.roomQueues.get(roomName);
      
      if (room && socket.userId) {
        // Remove from waiting players
        room.waitingPlayers = room.waitingPlayers.filter(p => p.userId !== socket.userId);
        
        socket.leave(roomName);
        
        // Update user offline status
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          await user.save();
        }

        // Notify room
        this.io.to(roomName).emit('player-left', {
          userId: socket.userId,
          waitingCount: room.waitingPlayers.length
        });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  async handleDisconnect(socket) {
    try {
      if (socket.userId) {
        // Update user offline status
        const user = await User.findById(socket.userId);
        if (user) {
          user.isOnline = false;
          user.lastSeen = new Date();
          await user.save();
        }

        // Remove from user sockets
        this.userSockets.delete(socket.userId);

        // Handle game disconnection
        for (const [gameId, gameSession] of this.activeGames) {
          const playerIndex = gameSession.game.players.findIndex(p => p.user.toString() === socket.userId);
          if (playerIndex !== -1) {
            gameSession.game.players[playerIndex].status = 'disconnected';
            
            // If it's their turn, auto-fold
            if (gameSession.currentPlayerIndex === playerIndex) {
              await this.processPlayerAction(gameId, playerIndex, 'fold');
            }
          }
        }

        // Remove from room queues
        for (const [roomName, room] of this.roomQueues) {
          room.waitingPlayers = room.waitingPlayers.filter(p => p.userId !== socket.userId);
          this.io.to(roomName).emit('player-left', {
            userId: socket.userId,
            waitingCount: room.waitingPlayers.length
          });
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  }

  // Get room statistics
  getRoomStats() {
    const stats = {};
    for (const [roomName, room] of this.roomQueues) {
      stats[roomName] = {
        waitingPlayers: room.waitingPlayers.length,
        minBet: room.minBet,
        maxBet: room.maxBet,
        buyIn: room.buyIn
      };
    }
    return stats;
  }

  // Get active games count
  getActiveGamesCount() {
    return this.activeGames.size;
  }
}

module.exports = GameManager;