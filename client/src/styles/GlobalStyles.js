import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: ${props => props.theme.fonts.primary};
    background: ${props => props.theme.colors.gradients.dark};
    color: ${props => props.theme.colors.text};
    line-height: 1.6;
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* Typography */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.theme.fonts.heading};
    font-weight: ${props => props.theme.fontWeights.bold};
    line-height: 1.2;
    margin-bottom: ${props => props.theme.spacing.md};
  }

  h1 {
    font-size: ${props => props.theme.fontSizes['4xl']};
    background: ${props => props.theme.colors.gradients.primary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  h2 {
    font-size: ${props => props.theme.fontSizes['3xl']};
  }

  h3 {
    font-size: ${props => props.theme.fontSizes['2xl']};
  }

  p {
    margin-bottom: ${props => props.theme.spacing.md};
  }

  /* Links */
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    transition: ${props => props.theme.transitions.fast};

    &:hover {
      color: ${props => props.theme.colors.secondary};
    }
  }

  /* Buttons */
  button {
    cursor: pointer;
    border: none;
    outline: none;
    font-family: inherit;
    transition: ${props => props.theme.transitions.normal};

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  /* Form Elements */
  input, textarea, select {
    font-family: inherit;
    outline: none;
    transition: ${props => props.theme.transitions.fast};
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.darkBlue};
    border-radius: ${props => props.theme.borderRadius.md};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.gradients.primary};
    border-radius: ${props => props.theme.borderRadius.md};

    &:hover {
      background: ${props => props.theme.colors.gradients.hover};
    }
  }

  /* Selection */
  ::selection {
    background: rgba(255, 215, 0, 0.3);
    color: ${props => props.theme.colors.text};
  }

  /* Loading States */
  .loading {
    animation: pulse 2s infinite;
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  .glowing {
    animation: glow 2s ease-in-out infinite alternate;
  }

  /* Animations */
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes glow {
    from {
      box-shadow: 0 0 5px ${props => props.theme.colors.primary};
    }
    to {
      box-shadow: 0 0 20px ${props => props.theme.colors.primary}, 
                  0 0 30px ${props => props.theme.colors.primary};
    }
  }

  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-100px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(100px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Utility Classes */
  .slide-in-top {
    animation: slideInFromTop 0.5s ease-out;
  }

  .slide-in-bottom {
    animation: slideInFromBottom 0.5s ease-out;
  }

  .slide-in-left {
    animation: slideInFromLeft 0.5s ease-out;
  }

  .slide-in-right {
    animation: slideInFromRight 0.5s ease-out;
  }

  .fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  .scale-in {
    animation: scaleIn 0.3s ease-out;
  }

  .no-select {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Responsive Design */
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    h1 {
      font-size: ${props => props.theme.fontSizes['3xl']};
    }

    h2 {
      font-size: ${props => props.theme.fontSizes['2xl']};
    }

    h3 {
      font-size: ${props => props.theme.fontSizes.xl};
    }
  }
`;

export default GlobalStyles;