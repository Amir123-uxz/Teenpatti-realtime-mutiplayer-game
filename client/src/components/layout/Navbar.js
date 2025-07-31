import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAvatar } from '../../utils/avatarGenerator';

const NavbarContainer = styled.nav`
  background: ${props => props.theme.colors.gradients.card};
  border-bottom: 1px solid rgba(255, 215, 0, 0.3);
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-family: ${props => props.theme.fonts.heading};
  font-size: ${props => props.theme.fontSizes['2xl']};
  font-weight: ${props => props.theme.fontWeights.bold};
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
`;

const NavLinks = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.lg};
  align-items: center;
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    background: rgba(255, 215, 0, 0.1);
    color: ${props => props.theme.colors.primary};
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.full};
  border: 2px solid ${props => props.theme.colors.primary};
`;

const LogoutButton = styled.button`
  background: ${props => props.theme.colors.gradients.danger};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    opacity: 0.8;
  }
`;

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <NavbarContainer>
      <Logo to="/dashboard">TEEN PATTI</Logo>
      
      <NavLinks>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/wallet">Wallet</NavLink>
        <NavLink to="/game">Game</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
        {isAdmin && <NavLink to="/admin">Admin</NavLink>}
      </NavLinks>

      <UserSection>
        <UserAvatar src={getUserAvatar(user)} alt="User Avatar" />
        <span style={{ color: 'var(--text)' }}>{user?.username}</span>
        <span style={{ color: 'var(--primary)' }}>{user?.wallet?.chips || 0} chips</span>
        <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      </UserSection>
    </NavbarContainer>
  );
};

export default Navbar;