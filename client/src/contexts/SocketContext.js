import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket']
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        toast.success('Connected to game server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
        toast.error('Disconnected from game server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnected(false);
        toast.error('Failed to connect to game server');
      });

      // Game events
      newSocket.on('joined-room', (data) => {
        setRoomData(data);
        toast.success(`Joined ${data.roomName} room`);
      });

      newSocket.on('player-joined', (data) => {
        setRoomData(prev => prev ? {
          ...prev,
          waitingPlayers: [...prev.waitingPlayers, data.player]
        } : null);
        toast.success(`${data.player.username} joined the room`);
      });

      newSocket.on('player-left', (data) => {
        setRoomData(prev => prev ? {
          ...prev,
          waitingPlayers: prev.waitingPlayers.filter(p => p.userId !== data.userId)
        } : null);
      });

      newSocket.on('game-started', (data) => {
        setGameState(data);
        setRoomData(null);
        toast.success('Game started!');
      });

      newSocket.on('your-cards', (data) => {
        setGameState(prev => prev ? {
          ...prev,
          myCards: data.cards
        } : null);
      });

      newSocket.on('betting-turn', (data) => {
        setGameState(prev => prev ? {
          ...prev,
          currentPlayer: data.currentPlayer,
          minBet: data.minBet,
          maxBet: data.maxBet,
          pot: data.pot,
          timeLimit: data.timeLimit
        } : null);

        if (data.username === user.username) {
          toast.success("It's your turn!");
        }
      });

      newSocket.on('player-action', (data) => {
        setGameState(prev => {
          if (!prev) return null;
          
          const updatedPlayers = [...prev.players];
          updatedPlayers[data.playerIndex] = {
            ...updatedPlayers[data.playerIndex],
            status: data.playerStatus
          };

          return {
            ...prev,
            players: updatedPlayers,
            pot: data.pot
          };
        });

        toast.success(`${data.username} ${data.action}${data.amount ? ` ${data.amount} chips` : ''}`);
      });

      newSocket.on('game-ended', (data) => {
        setGameState(prev => prev ? {
          ...prev,
          gameEnded: true,
          winner: data.winner,
          allHands: data.allHands,
          gameStats: data.gameStats
        } : null);

        if (data.winner.username === user.username) {
          toast.success(`Congratulations! You won ${data.winner.winAmount} chips!`);
        } else {
          toast.success(`${data.winner.username} won the game!`);
        }
      });

      newSocket.on('search-results', (data) => {
        setSearchResults(data.users);
      });

      newSocket.on('error', (data) => {
        toast.error(data.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Clean up when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
        setGameState(null);
        setRoomData(null);
      }
    }
  }, [user, token]);

  const joinRoom = (roomName) => {
    if (socket && user) {
      socket.emit('join-room', {
        userId: user._id,
        roomName,
        userInfo: {
          username: user.username,
          avatar: user.avatar,
          city: user.city,
          country: user.country
        }
      });
    }
  };

  const leaveRoom = (roomName) => {
    if (socket) {
      socket.emit('leave-room', { roomName });
      setRoomData(null);
    }
  };

  const placeBet = (gameId, action, amount = 0) => {
    if (socket) {
      socket.emit('place-bet', { gameId, action, amount });
    }
  };

  const searchUsers = (query, city = '') => {
    if (socket) {
      socket.emit('search-users', { query, city });
    }
  };

  const value = {
    socket,
    connected,
    gameState,
    roomData,
    searchResults,
    joinRoom,
    leaveRoom,
    placeBet,
    searchUsers,
    setGameState,
    setRoomData,
    setSearchResults
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};