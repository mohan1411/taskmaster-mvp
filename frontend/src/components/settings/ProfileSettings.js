import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  IconButton,
  Badge,
  Chip
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import api from '../../services/api';

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const fileInputRef = useRef(null);
  
  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }
    
    try {
      setAvatarUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/api/users/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update user context with new avatar URL
      await updateProfile({ avatar: response.data.avatarUrl });
      
      setSuccessMessage('Avatar uploaded successfully!');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };
  
  // Handle avatar deletion
  const handleAvatarDelete = async () => {
    try {
      setAvatarUploading(true);
      setError(null);
      
      await api.delete('/api/users/avatar');
      
      // Update user context to remove avatar
      await updateProfile({ avatar: null });
      
      setSuccessMessage('Avatar deleted successfully!');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete avatar');
    } finally {
      setAvatarUploading(false);
    }
  };
  
  // Handle email verification
  const handleEmailVerification = async () => {
    try {
      setEmailVerifying(true);
      setError(null);
      
      await api.post('/api/users/send-verification-email');
      
      setSuccessMessage('Verification email sent! Please check your inbox and spam folder.');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification email');
    } finally {
      setEmailVerifying(false);
    }
  };
  
  // Custom validation function instead of using Yup's when
  const validate = (values) => {
    const errors = {};
    
    if (!values.name) {
      errors.name = 'Name is required';
    }
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
      errors.email = 'Invalid email address';
    }
    
    if (changePassword) {
      if (!values.password) {
        errors.password = 'Password is required';
      } else if (values.password.length < 6) {
        errors.password = 'Password should be at least 6 characters';
      }
      
      if (!values.confirmPassword) {
        errors.confirmPassword = 'Confirm password is required';
      } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Passwords must match';
      }
    }
    
    return errors;
  };
  
  // Formik setup
  const formik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      confirmPassword: ''
    },
    validate,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        // Prepare update data
        const updateData = {
          name: values.name,
          email: values.email
        };
        
        // Only include password if changePassword is true
        if (changePassword && values.password) {
          updateData.password = values.password;
        }
        
        // Call update profile
        await updateProfile(updateData);
        
        setSuccessMessage('Profile updated successfully!');
        setSuccess(true);
        
        // Reset password fields
        formik.setFieldValue('password', '');
        formik.setFieldValue('confirmPassword', '');
        setChangePassword(false);
      } catch (err) {
        setError(err.message || 'Failed to update profile');
      } finally {
        setLoading(false);
      }
    },
  });
  
  // Update form when user data changes
  useEffect(() => {
    if (user) {
      formik.setFieldValue('name', user.name || '');
      formik.setFieldValue('email', user.email || '');
    }
  }, [user]);
  
  // Handle success notification close
  const handleSuccessClose = () => {
    setSuccess(false);
    setSuccessMessage('');
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Profile Settings
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={success}
        autoHideDuration={8000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessClose} severity="success">
          {successMessage || 'Operation completed successfully!'}
        </Alert>
      </Snackbar>
      
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Avatar section */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                sx={{ width: 100, height: 100 }}
                src={user?.avatar || ''}
                alt={user?.name || 'User'}
              >
                {user?.name?.[0] || 'U'}
              </Avatar>
              
              {/* Upload button */}
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: -8,
                  right: -8,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <PhotoCameraIcon />
                )}
              </IconButton>
              
              {/* Delete button (show only if user has avatar) */}
              {user?.avatar && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: 'error.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'error.dark',
                    },
                  }}
                  onClick={handleAvatarDelete}
                  disabled={avatarUploading}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            
            {/* Email verification status */}
            <Box sx={{ textAlign: 'center' }}>
              <Chip
                icon={user?.isEmailVerified ? <CheckCircleIcon /> : <WarningIcon />}
                label={user?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
                color={user?.isEmailVerified ? 'success' : 'warning'}
                size="small"
                sx={{ mb: 1 }}
              />
              
              {!user?.isEmailVerified && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EmailIcon />}
                  onClick={handleEmailVerification}
                  disabled={emailVerifying}
                  sx={{ mt: 1 }}
                >
                  {emailVerifying ? 'Sending...' : 'Verify Email'}
                </Button>
              )}
            </Box>
          </Grid>
          
          {/* Form fields */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Full Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={changePassword}
                      onChange={(e) => {
                        setChangePassword(e.target.checked);
                        if (!e.target.checked) {
                          formik.setFieldValue('password', '');
                          formik.setFieldValue('confirmPassword', '');
                        }
                      }}
                      name="changePassword"
                    />
                  }
                  label="Change Password"
                />
              </Grid>
              
              {changePassword && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="password"
                      name="password"
                      label="New Password"
                      type="password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.password && Boolean(formik.errors.password)}
                      helperText={formik.touched.password && formik.errors.password}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="confirmPassword"
                      name="confirmPassword"
                      label="Confirm New Password"
                      type="password"
                      value={formik.values.confirmPassword}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                      helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
          
          {/* Action buttons */}
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProfileSettings;
