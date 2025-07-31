#!/bin/bash

# Teen Patti Multiplayer Setup Script
echo "🎰 Setting up Teen Patti Multiplayer Casino App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    print_warning "MongoDB is not installed. Please install MongoDB or use MongoDB Atlas."
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Install server dependencies
print_status "Installing server dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Server dependencies installed successfully"
else
    print_error "Failed to install server dependencies"
    exit 1
fi

# Install client dependencies
print_status "Installing client dependencies..."
cd client
npm install
if [ $? -eq 0 ]; then
    print_success "Client dependencies installed successfully"
else
    print_error "Failed to install client dependencies"
    exit 1
fi

cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cat > .env << EOL
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/teenpatti

# JWT Configuration
JWT_SECRET=teenpatti-secret-key-$(openssl rand -hex 32)

# Client Configuration
CLIENT_URL=http://localhost:3000

# Email Configuration (for future use)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway Configuration (for future integration)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=uploads/

# Game Configuration
DEFAULT_STARTING_CHIPS=100
DEFAULT_STARTING_BALANCE=1000
COMMISSION_RATE=0.03
MIN_WITHDRAWAL_AMOUNT=500
MIN_TOPUP_AMOUNT=100
EOL
    print_success ".env file created with default configuration"
else
    print_warning ".env file already exists, skipping creation"
fi

# Create uploads directory
mkdir -p uploads
print_success "Uploads directory created"

# Start MongoDB if it's installed locally
if command -v mongod &> /dev/null; then
    print_status "Starting MongoDB..."
    if pgrep mongod > /dev/null; then
        print_success "MongoDB is already running"
    else
        # Try to start MongoDB in the background
        mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db 2>/dev/null || {
            print_warning "Could not start MongoDB automatically. Please start it manually."
        }
    fi
fi

# Create package.json scripts for easy management
print_status "Setting up package.json scripts..."

# Create a simple admin user creation script
cat > create-admin.js << 'EOL'
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  status: String,
  wallet: {
    balance: { type: Number, default: 10000 },
    chips: { type: Number, default: 1000 }
  },
  city: String,
  country: String,
  referralCode: String
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teenpatti');
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      email: 'admin@teenpattiapp.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      city: 'Mumbai',
      country: 'India',
      referralCode: 'ADMIN001'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@teenpattiapp.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
EOL

print_success "Admin creation script generated"

# Print completion message
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Start MongoDB if not running: mongod"
echo "2. Create admin user: node create-admin.js"
echo "3. Start the application: npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Email: admin@teenpattiapp.com"
echo "   Password: admin123"
echo ""
echo "📚 Documentation: Check README.md for detailed instructions"
echo ""
print_success "Happy gaming! 🎰"