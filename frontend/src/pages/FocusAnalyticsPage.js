import React from 'react';
import { Box, Typography } from '@mui/material';
import FocusAnalytics from '../components/focus/FocusAnalytics';
import '../styles/GlobalPages.css';

const FocusAnalyticsPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <FocusAnalytics />
      </div>
    </div>
  );
};

export default FocusAnalyticsPage;