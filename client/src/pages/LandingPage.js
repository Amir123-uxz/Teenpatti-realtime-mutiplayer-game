import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const LandingContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.gradients.dark};
  position: relative;
  overflow: hidden;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, ${props => props.theme.colors.primary}22 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, ${props => props.theme.colors.secondary}22 0%, transparent 50%);
  z-index: 1;
`;

const HeroSection = styled.section`
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
`;

const HeroContent = styled.div`
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
`;

const MainTitle = styled(motion.h1)`
  font-family: ${props => props.theme.fonts.heading};
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: ${props => props.theme.fontWeights.black};
  background: ${props => props.theme.colors.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${props => props.theme.spacing.lg};
  text-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
`;

const Subtitle = styled(motion.p)`
  font-size: ${props => props.theme.fontSizes['2xl']};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing['2xl']};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const FeatureGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  margin: ${props => props.theme.spacing['3xl']} 0;
`;

const FeatureCard = styled(motion.div)`
  background: ${props => props.theme.colors.gradients.card};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: ${props => props.theme.shadows.card};
  transition: ${props => props.theme.transitions.normal};

  &:hover {
    transform: translateY(-10px);
    box-shadow: ${props => props.theme.shadows.glow};
    border-color: ${props => props.theme.colors.primary};
  }
`;

const FeatureIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const FeatureTitle = styled.h3`
  font-family: ${props => props.theme.fonts.heading};
  font-size: ${props => props.theme.fontSizes.xl};
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.6;
`;

const CTASection = styled(motion.div)`
  margin-top: ${props => props.theme.spacing['3xl']};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xl};

  @media (min-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: row;
    justify-content: center;
  }
`;

const CTAButton = styled(Link)`
  display: inline-block;
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing['2xl']};
  background: ${props => props.theme.colors.gradients.button};
  color: ${props => props.theme.colors.dark};
  font-family: ${props => props.theme.fonts.heading};
  font-weight: ${props => props.theme.fontWeights.bold};
  font-size: ${props => props.theme.fontSizes.lg};
  text-decoration: none;
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.button};
  transition: ${props => props.theme.transitions.normal};
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    background: ${props => props.theme.colors.gradients.hover};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.glow};
  }
`;

const SecondaryButton = styled(CTAButton)`
  background: transparent;
  color: ${props => props.theme.colors.primary};
  border: 2px solid ${props => props.theme.colors.primary};

  &:hover {
    background: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.dark};
  }
`;

const StatsSection = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing['3xl']};
`;

const StatCard = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
`;

const StatNumber = styled.div`
  font-family: ${props => props.theme.fonts.heading};
  font-size: ${props => props.theme.fontSizes['4xl']};
  font-weight: ${props => props.theme.fontWeights.black};
  background: ${props => props.theme.colors.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: ${props => props.theme.fontSizes.lg};
  margin-top: ${props => props.theme.spacing.sm};
`;

const LandingPage = () => {
  const features = [
    {
      icon: '🎰',
      title: 'Real-time Multiplayer',
      description: 'Play with up to 6 players simultaneously in real-time Teen Patti games'
    },
    {
      icon: '💰',
      title: 'Secure Wallet System',
      description: 'Manage your chips and balance with our secure wallet and payment system'
    },
    {
      icon: '🏆',
      title: 'Competitive Rooms',
      description: 'Choose from Beginner to VIP rooms based on your skill level'
    },
    {
      icon: '👑',
      title: 'AI-Powered Experience',
      description: 'Beautiful AI girl avatars and stunning casino-themed interface'
    },
    {
      icon: '🔍',
      title: 'Find Players',
      description: 'Search and connect with players from different cities'
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'Monitor your stats, winnings, and climb the leaderboards'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Players' },
    { number: '50K+', label: 'Games Played' },
    { number: '₹10M+', label: 'Total Winnings' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <LandingContainer>
      <BackgroundPattern />
      
      <HeroSection>
        <HeroContent>
          <MainTitle
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            TEEN PATTI
          </MainTitle>
          
          <Subtitle
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Experience the ultimate multiplayer Teen Patti with stunning visuals, 
            real-time gameplay, and secure wallet system
          </Subtitle>

          <FeatureGrid
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeatureGrid>

          <StatsSection
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            {stats.map((stat, index) => (
              <StatCard key={index}>
                <StatNumber>{stat.number}</StatNumber>
                <StatLabel>{stat.label}</StatLabel>
              </StatCard>
            ))}
          </StatsSection>

          <CTASection
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
          >
            <CTAButton to="/register">
              Start Playing Now
            </CTAButton>
            <SecondaryButton to="/login">
              Login to Continue
            </SecondaryButton>
          </CTASection>
        </HeroContent>
      </HeroSection>
    </LandingContainer>
  );
};

export default LandingPage;