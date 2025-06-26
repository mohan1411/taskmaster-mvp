import React from 'react';
import { Box } from '@mui/material';
import AIAssistant from '../components/agents/AIAssistant';
import '../styles/GlobalPages.css';

const AIAssistantPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <AIAssistant />
      </div>
    </div>
  );
};

export default AIAssistantPage;