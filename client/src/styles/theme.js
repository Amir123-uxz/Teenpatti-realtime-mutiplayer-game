const theme = {
  colors: {
    // Primary Casino Colors
    primary: '#ffd700', // Gold
    secondary: '#ff6b6b', // Red
    accent: '#00ff88', // Green
    
    // Background Colors
    dark: '#0c0c0c',
    darkBlue: '#1a1a2e',
    navy: '#16213e',
    cardBg: '#2d2d44',
    
    // Text Colors
    text: '#ffffff',
    textSecondary: '#b8b8b8',
    textMuted: '#6c6c6c',
    
    // Status Colors
    success: '#00ff88',
    error: '#ff4757',
    warning: '#ffa502',
    info: '#3742fa',
    
    // Game Colors
    chipGold: '#ffd700',
    chipRed: '#ff4757',
    chipBlue: '#3742fa',
    chipGreen: '#00ff88',
    chipPurple: '#a55eea',
    
    // Card Colors
    cardRed: '#ff4757',
    cardBlack: '#2f3542',
    
    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #ffd700 0%, #ff6b6b 100%)',
      secondary: 'linear-gradient(135deg, #ff6b6b 0%, #ffd700 100%)',
      success: 'linear-gradient(135deg, #00ff88 0%, #00d2ff 100%)',
      danger: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)',
      dark: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      card: 'linear-gradient(135deg, #2d2d44 0%, #1a1a2e 100%)',
      button: 'linear-gradient(45deg, #ffd700 0%, #ff6b6b 100%)',
      hover: 'linear-gradient(45deg, #ff6b6b 0%, #ffd700 100%)',
    }
  },
  
  fonts: {
    primary: "'Roboto', sans-serif",
    heading: "'Orbitron', monospace",
    mono: "'Courier New', monospace"
  },
  
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '4rem'
  },
  
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
    '5xl': '8rem'
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px'
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    glow: '0 0 20px rgba(255, 215, 0, 0.5)',
    glowRed: '0 0 20px rgba(255, 107, 107, 0.5)',
    glowGreen: '0 0 20px rgba(0, 255, 136, 0.5)',
    card: '0 8px 32px rgba(0, 0, 0, 0.3)',
    button: '0 4px 15px rgba(255, 215, 0, 0.3)'
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },
  
  transitions: {
    fast: '0.15s ease-in-out',
    normal: '0.3s ease-in-out',
    slow: '0.5s ease-in-out'
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070
  }
};

export default theme;