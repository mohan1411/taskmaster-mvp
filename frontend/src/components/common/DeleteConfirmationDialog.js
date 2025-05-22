import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';

const DeleteConfirmationDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  content,
  isDeleting = false 
}) => {
  // Handle confirm with protection against multiple clicks
  const handleConfirm = () => {
    if (!isDeleting && onConfirm) {
      onConfirm();
    }
  };

  // Handle close with protection during deletion
  const handleClose = () => {
    if (!isDeleting && onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      disableEscapeKeyDown={isDeleting} // Prevent closing via ESC during deletion
    >
      <DialogTitle id="alert-dialog-title">
        {title || "Confirm Deletion"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {content || "Are you sure you want to delete this item? This action cannot be undone."}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleClose} 
          color="inherit" 
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="error" 
          autoFocus
          disabled={isDeleting}
        >
          {isDeleting ? <CircularProgress size={24} /> : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
