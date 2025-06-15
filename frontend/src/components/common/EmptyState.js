import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { 
  InboxOutlined, 
  TaskOutlined, 
  EmailOutlined, 
  FolderOutlined,
  NotificationsOutlined,
  SearchOutlined
} from '@mui/icons-material';

const iconMap = {
  inbox: InboxOutlined,
  task: TaskOutlined,
  email: EmailOutlined,
  folder: FolderOutlined,
  notification: NotificationsOutlined,
  search: SearchOutlined
};

const EmptyState = ({ 
  icon = 'inbox',
  title = 'No items found',
  message = 'There are no items to display at this time.',
  action,
  actionLabel = 'Get Started',
  onAction,
  sx = {}
}) => {
  const IconComponent = iconMap[icon] || InboxOutlined;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
        px: 3,
        minHeight: '400px',
        ...sx
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          backgroundColor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3
        }}
      >
        <IconComponent 
          sx={{ 
            fontSize: 60, 
            color: 'text.secondary',
            opacity: 0.5
          }} 
        />
      </Box>
      
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
        {title}
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ mb: 4, maxWidth: 400 }}
      >
        {message}
      </Typography>
      
      {(action || onAction) && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction || action}
          size="large"
          sx={{ minWidth: 150 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export const TaskEmptyState = ({ onCreateTask }) => (
  <EmptyState
    icon="task"
    title="No tasks yet"
    message="Start organizing your work by creating your first task. Stay productive and on track!"
    actionLabel="Create Task"
    onAction={onCreateTask}
  />
);

export const EmailEmptyState = ({ onSyncEmails }) => (
  <EmptyState
    icon="email"
    title="No emails synced"
    message="Connect your Gmail account to automatically extract tasks from your emails."
    actionLabel="Sync Emails"
    onAction={onSyncEmails}
  />
);

export const DocumentEmptyState = ({ onUploadDocument }) => (
  <EmptyState
    icon="folder"
    title="No documents uploaded"
    message="Upload documents to extract tasks and important information automatically."
    actionLabel="Upload Document"
    onAction={onUploadDocument}
  />
);

export const FollowUpEmptyState = ({ onViewEmails }) => (
  <EmptyState
    icon="notification"
    title="No follow-ups needed"
    message="Great job! You're all caught up. No emails require follow-up at this time."
    actionLabel="View Emails"
    onAction={onViewEmails}
  />
);

export const SearchEmptyState = ({ searchTerm }) => (
  <EmptyState
    icon="search"
    title="No results found"
    message={`We couldn't find anything matching "${searchTerm}". Try adjusting your search criteria.`}
    action={null}
  />
);

export default EmptyState;