import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import ProfileSettings from '../components/settings/ProfileSettings';
import EmailIntegrationSettings from '../components/settings/EmailIntegrationSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import TaskExtractionSettings from '../components/settings/TaskExtractionSettings';
import InterfaceSettings from '../components/settings/InterfaceSettings';
import '../styles/GlobalPages.css';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Profile', component: <ProfileSettings /> },
    { label: 'Email Integration', component: <EmailIntegrationSettings /> },
    { label: 'Notifications', component: <NotificationSettings /> },
    { label: 'Task Extraction', component: <TaskExtractionSettings /> },
    { label: 'Interface', component: <InterfaceSettings /> }
  ];

  return (
    <div className="page-container">
      <div className="page-content">
        <Typography variant="h4" component="h1" gutterBottom style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
          Settings
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} />
            ))}
          </Tabs>
        </Box>
        
        {/* Render the active tab component */}
        {tabs[activeTab] && tabs[activeTab].component}
      </div>
    </div>
  );
};

export default SettingsPage;
