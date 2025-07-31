import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${props => props.fullScreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props.theme.colors.gradients.dark};
    z-index: ${props.theme.zIndex.modal};
  `}
  ${props => !props.fullScreen && `
    padding: ${props.theme.spacing.xl};
  `}
`;

const Spinner = styled.div`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border: 3px solid transparent;
  border-top: 3px solid ${props => props.theme.colors.primary};
  border-right: 3px solid ${props => props.theme.colors.secondary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const LoadingText = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-family: ${props => props.theme.fonts.heading};
  font-size: ${props => props.theme.fontSizes.lg};
  animation: ${pulse} 2s ease-in-out infinite;
  text-align: center;
`;

const LoadingSpinner = ({ 
  fullScreen = false, 
  size = '40px', 
  text = 'Loading...', 
  className 
}) => {
  return (
    <SpinnerContainer fullScreen={fullScreen} className={className}>
      <Spinner size={size} />
      {text && <LoadingText>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;