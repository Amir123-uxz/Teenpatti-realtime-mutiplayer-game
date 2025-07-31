import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar, generateAIGirlAvatar } from '../../utils/avatarGenerator';
import { 
  Coins, Plus, Send, Download, TrendingUp, 
  Users, ArrowUpRight, ArrowDownLeft, DollarSign 
} from 'lucide-react';

const TokenManagementContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: ${props => props.theme.colors.gradients.card};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: ${props => props.theme.shadows.card};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const IconContainer = styled.div`
  width: 50px;
  height: 50px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.theme.colors.gradients.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.dark};
`;

const CardTitle = styled.h3`
  font-family: ${props => props.theme.fonts.heading};
  color: ${props => props.theme.colors.primary};
  margin: 0;
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Input = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.darkBlue};
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.md};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.glow};
    outline: none;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.darkBlue};
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.md};
  resize: vertical;
  min-height: 80px;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.glow};
    outline: none;
  }
`;

const Button = styled(motion.button)`
  width: 100%;
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.gradients.primary};
  color: ${props => props.theme.colors.dark};
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: ${props => props.theme.fontWeights.bold};
  font-size: ${props => props.theme.fontSizes.md};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
  transition: ${props => props.theme.transitions.normal};

  &:hover {
    background: ${props => props.theme.colors.gradients.hover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StatCard = styled(motion.div)`
  background: ${props => props.theme.colors.gradients.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  border: 1px solid rgba(255, 215, 0, 0.3);
  text-align: center;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.color || props.theme.colors.gradients.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.dark};
`;

const StatValue = styled.div`
  font-family: ${props => props.theme.fonts.heading};
  font-size: ${props => props.theme.fontSizes['2xl']};
  font-weight: ${props => props.theme.fontWeights.bold};
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.sm};
`;

const UserSearchContainer = styled.div`
  position: relative;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SearchResults = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.darkBlue};
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: ${props => props.theme.borderRadius.lg};
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    background: rgba(255, 215, 0, 0.1);
  }
`;

const UserAvatar = styled.img`
  width: 30px;
  height: 30px;
  border-radius: ${props => props.theme.borderRadius.full};
  object-fit: cover;
  border: 2px solid ${props => props.theme.colors.primary};
`;

const UserInfo = styled.div`
  flex: 1;
`;

const Username = styled.div`
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => props.theme.colors.text};
`;

const UserDetails = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  color: ${props => props.theme.colors.textMuted};
`;

const RecentTransfers = styled.div`
  background: ${props => props.theme.colors.gradients.card};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  border: 1px solid rgba(255, 215, 0, 0.3);
`;

const TransferItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid rgba(255, 215, 0, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

const TransferIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.type === 'send' ? props.theme.colors.gradients.danger : props.theme.colors.gradients.success};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.dark};
`;

const TransferDetails = styled.div`
  flex: 1;
`;

const TransferAmount = styled.div`
  font-weight: ${props => props.theme.fontWeights.bold};
  color: ${props => props.theme.colors.primary};
  text-align: right;
`;

const TokenManagement = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Generate tokens form
  const [generateAmount, setGenerateAmount] = useState('');
  const [generateDescription, setGenerateDescription] = useState('');
  
  // Send tokens form
  const [sendAmount, setSendAmount] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Receive tokens form
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveReason, setReceiveReason] = useState('');
  const [receiveFromUser, setReceiveFromUser] = useState(null);

  // Load token stats
  useEffect(() => {
    loadTokenStats();
  }, []);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await axios.get(`/users/search?query=${searchQuery}`);
        if (response.data.success) {
          setSearchResults(response.data.data.users);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const loadTokenStats = async () => {
    try {
      const response = await axios.get('/admin/token-stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load token stats:', error);
    }
  };

  const handleGenerateTokens = async (e) => {
    e.preventDefault();
    
    if (!generateAmount || parseFloat(generateAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/admin/generate-tokens', {
        amount: parseFloat(generateAmount),
        description: generateDescription || 'Admin token generation'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setGenerateAmount('');
        setGenerateDescription('');
        loadTokenStats();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to generate tokens';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTokens = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a recipient');
      return;
    }

    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/admin/send-tokens', {
        recipientId: selectedUser._id,
        amount: parseFloat(sendAmount),
        message: sendMessage || 'Tokens from admin'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setSendAmount('');
        setSendMessage('');
        setSelectedUser(null);
        setSearchQuery('');
        setSearchResults([]);
        loadTokenStats();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send tokens';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveTokens = async (e) => {
    e.preventDefault();
    
    if (!receiveFromUser) {
      toast.error('Please select a user');
      return;
    }

    if (!receiveAmount || parseFloat(receiveAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/admin/receive-tokens', {
        senderId: receiveFromUser._id,
        amount: parseFloat(receiveAmount),
        reason: receiveReason || 'Admin token collection'
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setReceiveAmount('');
        setReceiveReason('');
        setReceiveFromUser(null);
        loadTokenStats();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to receive tokens';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user, type = 'send') => {
    if (type === 'send') {
      setSelectedUser(user);
      setSearchQuery(user.username);
    } else {
      setReceiveFromUser(user);
    }
    setSearchResults([]);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toLocaleString() || '0';
  };

  return (
    <div>
      {/* Token Statistics */}
      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StatIcon color="linear-gradient(45deg, #ffd700, #ff6b6b)">
            <Coins size={20} />
          </StatIcon>
          <StatValue>{formatNumber(stats?.totalGenerated)}</StatValue>
          <StatLabel>Total Generated</StatLabel>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <StatIcon color="linear-gradient(45deg, #ff6b6b, #ffd700)">
            <ArrowUpRight size={20} />
          </StatIcon>
          <StatValue>{formatNumber(stats?.totalSent)}</StatValue>
          <StatLabel>Total Sent</StatLabel>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatIcon color="linear-gradient(45deg, #00ff88, #00d2ff)">
            <ArrowDownLeft size={20} />
          </StatIcon>
          <StatValue>{formatNumber(stats?.totalReceived)}</StatValue>
          <StatLabel>Total Received</StatLabel>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatIcon color="linear-gradient(45deg, #a55eea, #3742fa)">
            <TrendingUp size={20} />
          </StatIcon>
          <StatValue>{formatNumber(stats?.netTokens)}</StatValue>
          <StatLabel>Net Balance</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Token Management Actions */}
      <TokenManagementContainer>
        {/* Generate Tokens */}
        <Card
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardHeader>
            <IconContainer>
              <Plus size={24} />
            </IconContainer>
            <div>
              <CardTitle>Generate Tokens</CardTitle>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Create millions of tokens instantly
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleGenerateTokens}>
            <FormGroup>
              <Label>Amount</Label>
              <Input
                type="number"
                min="1"
                max="999999999"
                value={generateAmount}
                onChange={(e) => setGenerateAmount(e.target.value)}
                placeholder="Enter amount (e.g., 1000000 for 1M)"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Description</Label>
              <TextArea
                value={generateDescription}
                onChange={(e) => setGenerateDescription(e.target.value)}
                placeholder="Reason for token generation..."
                maxLength={200}
              />
            </FormGroup>

            <Button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <div className="spinning">⏳</div>
                  Generating...
                </>
              ) : (
                <>
                  <Plus size={20} />
                  Generate Tokens
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Send Tokens */}
        <Card
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardHeader>
            <IconContainer>
              <Send size={24} />
            </IconContainer>
            <div>
              <CardTitle>Send Tokens</CardTitle>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Transfer tokens to any user
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleSendTokens}>
            <FormGroup>
              <Label>Recipient</Label>
              <UserSearchContainer>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or email..."
                />
                {searchResults.length > 0 && (
                  <SearchResults>
                    {searchResults.map((searchUser) => (
                      <UserItem
                        key={searchUser._id}
                        onClick={() => handleUserSelect(searchUser, 'send')}
                      >
                        <UserAvatar 
                          src={getUserAvatar(searchUser)} 
                          alt={searchUser.username}
                          onError={(e) => {
                            e.target.src = generateAIGirlAvatar(searchUser._id);
                          }}
                        />
                        <UserInfo>
                          <Username>{searchUser.username}</Username>
                          <UserDetails>{searchUser.city}, {searchUser.country}</UserDetails>
                        </UserInfo>
                      </UserItem>
                    ))}
                  </SearchResults>
                )}
              </UserSearchContainer>
            </FormGroup>

            <FormGroup>
              <Label>Amount</Label>
              <Input
                type="number"
                min="1"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="Enter amount..."
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Message</Label>
              <TextArea
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder="Message to recipient..."
                maxLength={200}
              />
            </FormGroup>

            <Button
              type="submit"
              disabled={!selectedUser || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <div className="spinning">⏳</div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send Tokens
                </>
              )}
            </Button>
          </form>
        </Card>
      </TokenManagementContainer>

      {/* Recent Transfers */}
      {stats?.recentTransfers && stats.recentTransfers.length > 0 && (
        <RecentTransfers>
          <CardHeader>
            <IconContainer>
              <TrendingUp size={24} />
            </IconContainer>
            <div>
              <CardTitle>Recent Token Transfers</CardTitle>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                Latest token management activities
              </p>
            </div>
          </CardHeader>

          {stats.recentTransfers.map((transfer, index) => (
            <TransferItem key={transfer._id}>
              <TransferIcon type={transfer.type.includes('send') ? 'send' : 'receive'}>
                {transfer.type.includes('send') ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
              </TransferIcon>
              <TransferDetails>
                <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>
                  {transfer.description}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {new Date(transfer.createdAt).toLocaleString()}
                </div>
              </TransferDetails>
              <TransferAmount>
                {transfer.type.includes('send') ? '-' : '+'}{formatNumber(transfer.amount)}
              </TransferAmount>
            </TransferItem>
          ))}
        </RecentTransfers>
      )}
    </div>
  );
};

export default TokenManagement;