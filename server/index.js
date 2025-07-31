const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/wallet');

const GameManager = require('./game/GameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teenpatti', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);

// Initialize Game Manager
const gameManager = new GameManager(io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (data) => {
    gameManager.handleJoinRoom(socket, data);
  });

  socket.on('leave-room', (data) => {
    gameManager.handleLeaveRoom(socket, data);
  });

  socket.on('place-bet', (data) => {
    gameManager.handlePlaceBet(socket, data);
  });

  socket.on('game-action', (data) => {
    gameManager.handleGameAction(socket, data);
  });

  socket.on('search-users', (data) => {
    gameManager.handleSearchUsers(socket, data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameManager.handleDisconnect(socket);
  });
});

// Serve React app for production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };