import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar, generateAIGirlAvatar } from '../../utils/avatarGenerator';
import { Search, Send, Users, ArrowRight, Coins } from 'lucide-react';

const TransferContainer = styled(motion.div)`
  background: ${props => props.theme.colors.gradients.card};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: ${props => props.theme.shadows.card};
`;

const TransferHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const HeaderIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.theme.colors.gradients.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.dark};
`;

const Title = styled.h2`
  font-family: ${props => props.theme.fonts.heading};
  color: ${props => props.theme.colors.primary};
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Tab = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.active ? props.theme.colors.gradients.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.dark : props.theme.colors.textSecondary};
  border: 1px solid ${props => props.active ? 'transparent' : props.theme.colors.primary};
  font-weight: ${props => props.theme.fontWeights.medium};
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};

  &:hover {
    background: ${props => props.active ? props.theme.colors.gradients.hover : props.theme.colors.gradients.primary};
    color: ${props => props.theme.colors.dark};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} ${props => props.theme.spacing.md} 50px;
  background: ${props => props.theme.colors.darkBlue};
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.md};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.glow};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textMuted};
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: ${props => props.theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textMuted};
  width: 20px;
  height: 20px;
`;

const UserList = styled.div`
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const UserItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.selected ? props.theme.colors.gradients.primary : props.theme.colors.darkBlue};
  color: ${props => props.selected ? props.theme.colors.dark : props.theme.colors.text};
  cursor: pointer;
  margin-bottom: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.selected ? 'transparent' : 'rgba(255, 215, 0, 0.2)'};
  transition: ${props => props.theme.transitions.normal};

  &:hover {
    background: ${props => props.selected ? props.theme.colors.gradients.hover : 'rgba(255, 215, 0, 0.1)'};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.full};
  object-fit: cover;
  border: 2px solid ${props => props.theme.colors.primary};
`;

const UserInfo = styled.div`
  flex: 1;
`;

const Username = styled.div`
  font-weight: ${props => props.theme.fontWeights.semibold};
  font-size: ${props => props.theme.fontSizes.md};
`;

const UserDetails = styled.div`
  font-size: ${props => props.theme.fontSizes.sm};
  opacity: 0.8;
`;

const OnlineStatus = styled.div`
  width: 8px;
  height: 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.online ? props.theme.colors.success : props.theme.colors.textMuted};
`;

const TransferForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const Label = styled.label`
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => props.theme.colors.textSecondary};
`;

const Input = styled.input`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.darkBlue};
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.text};
  font-size: ${props => props.theme.fontSizes.md};

  &:focus {
    border-color: ${props => props.theme.colors.primary};
    box-shadow: ${props => props.theme.shadows.glow};
  }
`;

const TextArea = styled.textarea`
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
  }
`;

const TransferSummary = styled.div`
  background: ${props => props.theme.colors.darkBlue};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  border: 1px solid rgba(255, 215, 0, 0.3);
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};

  &:last-child {
    margin-bottom: 0;
    padding-top: ${props => props.theme.spacing.sm};
    border-top: 1px solid rgba(255, 215, 0, 0.3);
    font-weight: ${props => props.theme.fontWeights.bold};
  }
`;

const SubmitButton = styled(motion.button)`
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.gradients.primary};
  color: ${props => props.theme.colors.dark};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: ${props => props.theme.fontWeights.bold};
  font-size: ${props => props.theme.fontSizes.lg};
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};

  &:hover {
    background: ${props => props.theme.colors.gradients.hover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TransferChips = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('send');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const response = await axios.get(`/users/search?query=${searchQuery}`);
        if (response.data.success) {
          setSearchResults(response.data.data.users);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    setSearchQuery(selectedUser.username);
    setSearchResults([]);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      toast.error('Please select a recipient');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(amount) > user.wallet.chips) {
      toast.error('Insufficient chips');
      return;
    }

    setLoading(true);
    try {
      const endpoint = activeTab === 'send' ? '/wallet/transfer' : '/wallet/request-chips';
      const response = await axios.post(endpoint, {
        recipientUsername: selectedUser.username,
        amount: parseFloat(amount),
        message: message || (activeTab === 'send' ? 'Chip transfer' : 'Chip request')
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setAmount('');
        setMessage('');
        setSelectedUser(null);
        setSearchQuery('');
        
        // Refresh user data if sending
        if (activeTab === 'send') {
          window.location.reload(); // Simple refresh for now
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to ${activeTab} chips`;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TransferContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <TransferHeader>
        <HeaderIcon>
          <Send size={24} />
        </HeaderIcon>
        <div>
          <Title>Transfer Chips</Title>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Send chips to other players or request from friends
          </p>
        </div>
      </TransferHeader>

      <TabContainer>
        <Tab 
          active={activeTab === 'send'} 
          onClick={() => setActiveTab('send')}
        >
          <Send size={16} style={{ marginRight: '8px' }} />
          Send Chips
        </Tab>
        <Tab 
          active={activeTab === 'request'} 
          onClick={() => setActiveTab('request')}
        >
          <Coins size={16} style={{ marginRight: '8px' }} />
          Request Chips
        </Tab>
      </TabContainer>

      <SearchContainer>
        <SearchIcon />
        <SearchInput
          type="text"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchContainer>

      {searching && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div className="spinning">🔍</div>
          <p>Searching users...</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <UserList>
          {searchResults.map((searchUser) => (
            <UserItem
              key={searchUser._id}
              selected={selectedUser?._id === searchUser._id}
              onClick={() => handleUserSelect(searchUser)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
              <OnlineStatus online={searchUser.isOnline} />
            </UserItem>
          ))}
        </UserList>
      )}

      <TransferForm onSubmit={handleTransfer}>
        <FormGroup>
          <Label>Amount (Chips)</Label>
          <Input
            type="number"
            min="1"
            max={user?.wallet?.chips || 0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount..."
            required
          />
        </FormGroup>

        <FormGroup>
          <Label>Message (Optional)</Label>
          <TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Add a message with your ${activeTab}...`}
            maxLength={200}
          />
        </FormGroup>

        {selectedUser && amount && (
          <TransferSummary>
            <SummaryRow>
              <span>Recipient:</span>
              <span>{selectedUser.username}</span>
            </SummaryRow>
            <SummaryRow>
              <span>Amount:</span>
              <span>{amount} chips</span>
            </SummaryRow>
            <SummaryRow>
              <span>Your Balance After:</span>
              <span>
                {activeTab === 'send' 
                  ? (user?.wallet?.chips || 0) - parseFloat(amount || 0)
                  : user?.wallet?.chips || 0
                } chips
              </span>
            </SummaryRow>
          </TransferSummary>
        )}

        <SubmitButton
          type="submit"
          disabled={!selectedUser || !amount || loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <div className="spinning">⏳</div>
              Processing...
            </>
          ) : (
            <>
              {activeTab === 'send' ? <Send size={20} /> : <Coins size={20} />}
              {activeTab === 'send' ? 'Send Chips' : 'Request Chips'}
            </>
          )}
        </SubmitButton>
      </TransferForm>
    </TransferContainer>
  );
};

export default TransferChips;