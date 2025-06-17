import React from 'react';
import { Box, Typography } from '@mui/material';
import FocusAnalyticsV2 from '../components/focus/FocusAnalyticsV2';
import '../styles/GlobalPages.css';

const FocusAnalyticsPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <FocusAnalyticsV2 />
      </div>
    </div>
  );
};

export default FocusAnalyticsPage;