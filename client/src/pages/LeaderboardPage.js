import React from 'react';
import styled from 'styled-components';

const LeaderboardContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.gradients.dark};
`;

const LeaderboardPage = () => {
  return (
    <LeaderboardContainer>
      <h1 style={{ color: 'var(--primary)' }}>Leaderboard Coming Soon!</h1>
    </LeaderboardContainer>
  );
};

export default LeaderboardPage;