import React from 'react';
import styled from 'styled-components';

const GameContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.gradients.dark};
`;

const GamePage = () => {
  return (
    <GameContainer>
      <h1 style={{ color: 'var(--primary)' }}>Game Coming Soon!</h1>
    </GameContainer>
  );
};

export default GamePage;