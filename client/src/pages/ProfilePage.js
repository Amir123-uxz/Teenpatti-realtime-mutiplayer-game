import React from 'react';
import styled from 'styled-components';

const ProfileContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.gradients.dark};
`;

const ProfilePage = () => {
  return (
    <ProfileContainer>
      <h1 style={{ color: 'var(--primary)' }}>Profile Coming Soon!</h1>
    </ProfileContainer>
  );
};

export default ProfilePage;