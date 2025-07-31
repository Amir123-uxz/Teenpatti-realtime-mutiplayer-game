# 🎰 Teen Patti Multiplayer Casino App

A comprehensive, real-time multiplayer Teen Patti game with stunning casino-themed UI, featuring AI girl images, advanced wallet system, and complete admin panel.

## ✨ Features

### 🎮 Core Game Features
- **Real-time Multiplayer**: Play with up to 6 players simultaneously using WebSocket technology
- **Teen Patti Game Logic**: Complete implementation with hand rankings, betting rounds, and showdowns
- **Multiple Rooms**: Beginner, Intermediate, Advanced, and VIP rooms with different stakes
- **Auto Commission**: Automatic 3% deduction from each game pot
- **User Search**: Find players by email/ID from different cities

### 💰 Wallet & Payment System
- **Chips/Tokens System**: Convert balance to chips for gameplay
- **Wallet Top-up**: Add funds to your account (simulation included)
- **Withdrawal System**: Request withdrawals with admin approval
- **Transaction History**: Complete record of all financial activities
- **Referral System**: Earn bonuses for referring new players

### 👑 Admin Features
- **User Management**: Block, unblock, or delete user accounts
- **Balance Control**: Add or deduct chips/balance from any user
- **Game Monitoring**: View live games and statistics
- **Revenue Analytics**: Track commission earnings and platform metrics
- **Transaction Oversight**: Monitor all platform transactions

### 🎨 UI/UX Features
- **Casino Theme**: Stunning gold and red color scheme
- **AI Girl Images**: Beautiful AI-generated character avatars
- **Responsive Design**: Works perfectly on desktop and mobile
- **Real-time Notifications**: Toast notifications for all game events
- **Smooth Animations**: Engaging transitions and effects

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** authentication
- **bcryptjs** for password hashing

### Frontend
- **React 18** with Hooks
- **Styled Components** for styling
- **Socket.IO Client** for real-time features
- **React Router** for navigation
- **Axios** for API calls
- **React Hot Toast** for notifications

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd teenpatti-multiplayer
```

2. **Install server dependencies**
```bash
npm install
```

3. **Install client dependencies**
```bash
cd client
npm install
cd ..
```

4. **Environment Setup**
Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/teenpatti

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Client Configuration
CLIENT_URL=http://localhost:3000
```

5. **Start MongoDB**
Make sure MongoDB is running on your system.

6. **Run the application**

For development (runs both server and client):
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 - Server
npm run server

# Terminal 2 - Client
npm run client
```

7. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📱 Usage Guide

### For Players

1. **Registration**
   - Create account with username, email, password, and city
   - Get starting bonus of 1000 balance and 100 chips

2. **Playing Games**
   - Choose a room based on your skill level
   - Wait for other players to join
   - Play Teen Patti with real-time betting
   - Win chips and climb the leaderboard

3. **Wallet Management**
   - Top up your balance (minimum ₹100)
   - Convert balance to chips for playing
   - Request withdrawals (minimum ₹500)
   - Track all transactions

### For Admins

1. **User Management**
   - View all registered users
   - Block/unblock accounts
   - Adjust user balances
   - Delete accounts if needed

2. **Platform Monitoring**
   - View live games and statistics
   - Monitor revenue and commissions
   - Track user activity
   - Generate analytics reports

## 🎮 Game Rules

### Teen Patti Hand Rankings (Highest to Lowest)
1. **Trail (Three of a Kind)** - AAA, KKK, etc.
2. **Pure Sequence** - Consecutive cards of same suit (A-2-3 of hearts)
3. **Sequence** - Consecutive cards of different suits
4. **Color (Flush)** - Three cards of same suit
5. **Pair** - Two cards of same rank
6. **High Card** - No matching cards

### Betting Actions
- **Call**: Match the current bet
- **Raise**: Increase the bet amount
- **Fold**: Leave the current round

## 🏗️ Project Structure

```
teenpatti-multiplayer/
├── server/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── game/           # Game logic
│   └── index.js        # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/      # Page components
│   │   ├── contexts/   # React contexts
│   │   ├── styles/     # Styled components
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
├── package.json        # Server dependencies
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Game Management
- `GET /api/games/rooms` - Get available rooms
- `GET /api/games/stats/overview` - Game statistics
- `GET /api/games/recent/all` - Recent games
- `GET /api/games/live/all` - Live games

### Wallet Operations
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/buy-chips` - Convert balance to chips
- `POST /api/wallet/topup` - Add funds to wallet
- `POST /api/wallet/withdraw` - Request withdrawal
- `GET /api/wallet/transactions` - Transaction history

### Admin Operations
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/status` - Update user status
- `POST /api/admin/users/:id/balance` - Adjust user balance

## 🔌 WebSocket Events

### Client to Server
- `join-room` - Join a game room
- `leave-room` - Leave a game room
- `place-bet` - Make a betting action
- `search-users` - Search for users

### Server to Client
- `game-started` - Game has begun
- `betting-turn` - Player's turn to bet
- `player-action` - Another player's action
- `game-ended` - Game finished with results

## 🎨 Customization

### Adding New Themes
1. Update `client/src/styles/theme.js`
2. Add new color schemes in the `colors.gradients` section
3. Update components to use new theme variables

### Adding New Game Modes
1. Extend the `TeenPattiGame` class in `server/game/TeenPattiGame.js`
2. Add new room configurations
3. Update the frontend to handle new game modes

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the connection string in `.env`

2. **Socket Connection Failed**
   - Verify the server is running on correct port
   - Check firewall settings

3. **JWT Token Issues**
   - Clear localStorage and login again
   - Verify JWT_SECRET in environment

### Debug Mode
Set `NODE_ENV=development` in `.env` for detailed error logs.

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-cluster-url
JWT_SECRET=your-production-secret
CLIENT_URL=https://your-domain.com
```

2. **Build for Production**
```bash
npm run build
```

3. **Deploy Options**
- **Heroku**: Use the included Procfile
- **DigitalOcean**: Deploy using Docker
- **AWS**: Use Elastic Beanstalk or EC2

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@teenpattiapp.com

## 🔮 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Tournament system
- [ ] Chat system during games
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Push notifications

---

**Made with ❤️ for the Teen Patti gaming community**