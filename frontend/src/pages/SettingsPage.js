import React, { useState } from 'react';
import { Box, Typography, Container, Tabs, Tab } from '@mui/material';
import ProfileSettings from '../components/settings/ProfileSettings';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="settings tabs">
            <Tab label="Profile" />
            <Tab label="Email Integration" />
            <Tab label="Notifications" />
            <Tab label="Task Extraction" />
            <Tab label="Interface" />
          </Tabs>
        </Box>
        
        {/* Profile Settings Tab */}
        {activeTab === 0 && (
          <ProfileSettings />
        )}
        
        {/* Email Integration Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Email Integration
            </Typography>
            <Typography variant="body1">
              Google account connection and Gmail API settings will be implemented here.
            </Typography>
          </Box>
        )}
        
        {/* Notifications Tab */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <Typography variant="body1">
              Email and browser notification preferences will be implemented here.
            </Typography>
          </Box>
        )}
        
        {/* Task Extraction Tab */}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Task Extraction
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              In the current MVP version, task extraction is performed manually on individual emails.
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>Current features:</strong>
            </Typography>
            <ul>
              <li>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Manual extraction of tasks from email content
                </Typography>
              </li>
              <li>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Manual creation of follow-ups based on email content
                </Typography>
              </li>
            </ul>
            <Typography variant="body1" sx={{ mb: 2, mt: 2 }}>
              <strong>Coming soon:</strong>
            </Typography>
            <ul>
              <li>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Automatic task extraction during email sync
                </Typography>
              </li>
              <li>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Smart filtering for batch processing emails
                </Typography>
              </li>
              <li>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Customized extraction settings and AI preferences
                </Typography>
              </li>
            </ul>
          </Box>
        )}
        
        {/* Interface Tab */}
        {activeTab === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Interface Preferences
            </Typography>
            <Typography variant="body1">
              Theme selection and display preferences will be implemented here.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default SettingsPage;
