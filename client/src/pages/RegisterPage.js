import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { generateAvatarOptions, getUserAvatar } from '../utils/avatarGenerator';

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.gradients.dark};
  padding: ${props => props.theme.spacing.xl};
`;

const RegisterCard = styled(motion.div)`
  background: ${props => props.theme.colors.gradients.card};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing['2xl']};
  border: 1px solid rgba(255, 215, 0, 0.3);
  box-shadow: ${props => props.theme.shadows.card};
  width: 100%;
  max-width: 500px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.primary};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
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
    outline: none;
  }
`;

const AvatarSection = styled.div`
  margin: ${props => props.theme.spacing.lg} 0;
`;

const AvatarLabel = styled.label`
  display: block;
  font-weight: ${props => props.theme.fontWeights.medium};
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const AvatarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};
`;

const AvatarOption = styled(motion.img)`
  width: 80px;
  height: 80px;
  border-radius: ${props => props.theme.borderRadius.full};
  object-fit: cover;
  border: 3px solid ${props => props.selected ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};

  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: scale(1.1);
  }
`;

const Button = styled.button`
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.gradients.primary};
  color: ${props => props.theme.colors.dark};
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: ${props => props.theme.fontWeights.bold};
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};

  &:hover {
    background: ${props => props.theme.colors.gradients.hover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    city: '',
    country: 'India',
    referralCode: ''
  });
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [avatarOptions, setAvatarOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const avatars = generateAvatarOptions(6);
    setAvatarOptions(avatars);
    setSelectedAvatar(avatars[0]?.url || '');
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await register({
      ...formData,
      avatar: selectedAvatar
    });
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <RegisterContainer>
      <RegisterCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Join the Game</Title>
        <Form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          <Input
            type="text"
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleInputChange}
            required
          />
          <Input
            type="text"
            name="referralCode"
            placeholder="Referral Code (Optional)"
            value={formData.referralCode}
            onChange={handleInputChange}
          />

          <AvatarSection>
            <AvatarLabel>Choose Your Avatar</AvatarLabel>
            <AvatarGrid>
              {avatarOptions.map((avatar, index) => (
                <AvatarOption
                  key={avatar.id}
                  src={avatar.url}
                  alt={`Avatar ${index + 1}`}
                  selected={selectedAvatar === avatar.url}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                />
              ))}
            </AvatarGrid>
          </AvatarSection>

          <Button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </RegisterCard>
    </RegisterContainer>
  );
};

export default RegisterPage;