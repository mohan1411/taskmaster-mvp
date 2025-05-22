import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TaskForm from './TaskForm';

const TaskModal = ({ 
  open, 
  onClose, 
  task, 
  onSubmit, 
  isSubmitting, 
  error 
}) => {
  const handleSubmit = (taskData) => {
    onSubmit(taskData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="task-dialog-title"
    >
      <DialogTitle id="task-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {task ? 'Edit Task' : 'Create New Task'}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <TaskForm
          task={task}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TaskModal;
