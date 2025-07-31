import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import TokenManagement from '../components/admin/TokenManagement';

const AdminContainer = styled.div`
  min-height: 100vh;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.gradients.dark};
`;

const AdminHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing['2xl']};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.primary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const AdminPage = () => {
  return (
    <AdminContainer>
      <AdminHeader
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title>Admin Dashboard</Title>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage tokens, users, and platform operations
        </p>
      </AdminHeader>

      <TokenManagement />
    </AdminContainer>
  );
};

export default AdminPage;