import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { getUserAvatar } from '../utils/avatarGenerator';
import TransferChips from '../components/wallet/TransferChips';

const DashboardContainer = styled.div`
  min-height: 100vh;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.gradients.dark};
`;

const WelcomeSection = styled(motion.div)`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing['2xl']};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const UserAvatar = styled.img`
  width: 100px;
  height: 100px;
  border-radius: ${props => props.theme.borderRadius.full};
  border: 3px solid ${props => props.theme.colors.primary};
  margin: ${props => props.theme.spacing.lg} 0;
`;

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <DashboardContainer>
      <WelcomeSection
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Welcome, {user?.username}!</Title>
        <UserAvatar src={getUserAvatar(user)} alt="User Avatar" />
        <p>Balance: {user?.wallet?.balance || 0} | Chips: {user?.wallet?.chips || 0}</p>
      </WelcomeSection>

      <TransferChips />
    </DashboardContainer>
  );
};

export default DashboardPage;