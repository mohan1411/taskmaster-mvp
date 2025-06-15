import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Link
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const validationSchema = Yup.object({
  password: Yup.string()
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required')
});

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.get(`/api/auth/verify-reset-token/${token}`);
        setEmail(response.data.email);
        setVerifying(false);
      } catch (err) {
        setError('Invalid or expired token. Please request a new password reset.');
        setVerifying(false);
      }
    };
    
    verifyToken();
  }, [token]);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        
        await api.post(`/api/auth/reset-password/${token}`, {
          password: values.password
        });
        
        setSuccess(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });

  if (verifying) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8, mb: 8, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom style={{ color: 'rgba(0, 0, 0, 0.87)' }}>
            Reset Password
          </Typography>
          
          {error && (
            <Box>
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
              <Button
                component={RouterLink}
                to="/forgot-password"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Request New Reset Link
              </Button>
            </Box>
          )}
          
          {success ? (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Your password has been reset successfully!
              </Alert>
              <Typography variant="body1" paragraph>
                You can now login with your new password.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Go to Login
              </Button>
            </Box>
          ) : !error && (
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
              <Typography variant="body1" paragraph>
                Create a new password for <strong>{email}</strong>
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Reset Password'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;
