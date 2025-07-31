import React from 'react';
import styled from 'styled-components';
import TransferChips from '../components/wallet/TransferChips';

const WalletContainer = styled.div`
  min-height: 100vh;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.gradients.dark};
`;

const WalletPage = () => {
  return (
    <WalletContainer>
      <h1 style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '2rem' }}>
        Wallet & Transfers
      </h1>
      <TransferChips />
    </WalletContainer>
  );
};

export default WalletPage;