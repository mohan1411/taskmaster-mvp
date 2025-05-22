import React, { useState, useEffect } from 'react';
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
  Checkbox
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  
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
        autoHideDuration={6000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessClose} severity="success">
          Profile updated successfully!
        </Alert>
      </Snackbar>
      
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Avatar section */}
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar
              sx={{ width: 100, height: 100, mb: 2 }}
              src={user?.avatar || ''}
              alt={user?.name || 'User'}
            >
              {user?.name?.[0] || 'U'}
            </Avatar>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
              {user?.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
            </Typography>
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
