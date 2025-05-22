# User Management Code Reference

This document provides key code snippets and references for the user management functionality implemented in TaskMaster.

## Backend Code

### User Model

**File Path**: `/backend/models/userModel.js`

Key components:
- User schema definition
- Password hashing middleware
- Password comparison method

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required unless googleId exists
      return !this.googleId;
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true  // Allows null/undefined values
  },
  avatar: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  refreshToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to check password validity
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

### User Controller

**File Path**: `/backend/controllers/userController.js`

Key functions:

1. **User Registration**:
```javascript
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });

    // Create default settings for the user
    await Settings.create({
      user: user._id
    });

    if (user) {
      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token in user document
      user.refreshToken = refreshToken;
      await user.save();

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        token,
        refreshToken
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

2. **User Login**:
```javascript
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token in user document
      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        token,
        refreshToken
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

3. **Password Reset Request**:
```javascript
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpiry;
    await user.save();

    // Create reset URL
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;

    // Create email message
    const message = `
      <h1>You requested a password reset</h1>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <p>This link is valid for 1 hour.</p>
    `;

    try {
      // Send email
      const transporter = createTransporter();
      
      await transporter.sendMail({
        to: user.email,
        from: process.env.EMAIL_FROM || 'noreply@taskmaster.com',
        subject: 'TaskMaster Password Reset',
        html: message
      });

      res.json({ message: 'Password reset email sent' });
    } catch (emailError) {
      console.error('Email error:', emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({ message: 'Could not send reset email' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

4. **Reset Password**:
```javascript
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Find user by reset token and check if it's expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // If we want to automatically log in the user after reset
    const jwtToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Password reset successful',
      token: jwtToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
```

### Authentication Middleware

**File Path**: `/backend/middleware/authMiddleware.js`

```javascript
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Get user from the token (exclude password)
      req.user = await User.findById(decoded.id).select('-password -refreshToken');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
```

## Frontend Code

### Auth Context

**File Path**: `/frontend/src/context/AuthContext.js`

Key functionality:

```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from local storage on initial load
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Set default Authorization header for API requests
          api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
        // Clear potentially corrupted storage
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login user
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/auth/login', {
        email,
        password
      });
      
      const userData = response.data;
      
      // Store user data in local storage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set default Authorization header for API requests
      api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      setUser(userData);
      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.put('/api/auth/profile', userData);
      
      const updatedUserData = {
        ...user,
        name: response.data.name,
        email: response.data.email,
        avatar: response.data.avatar,
        isEmailVerified: response.data.isEmailVerified
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      
      return updatedUserData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Profile update failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
```

### Profile Settings Component

**File Path**: `/frontend/src/components/settings/ProfileSettings.js`

```javascript
const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [changePassword, setChangePassword] = useState(false);
  
  // Custom validation function
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
  
  // Form handling with formik
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
        
        // Include password if changing
        if (changePassword && values.password) {
          updateData.password = values.password;
        }
        
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
```

### Forgot Password Component

**File Path**: `/frontend/src/pages/ForgotPasswordPage.js`

```javascript
const ForgotPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Enter a valid email')
        .required('Email is required')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);
        
        await api.post('/api/auth/forgot-password', {
          email: values.email
        });
        
        setSuccess(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  });
```

### Reset Password Component

**File Path**: `/frontend/src/pages/ResetPasswordPage.js`

```javascript
const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

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
    validationSchema: Yup.object({
      password: Yup.string()
        .min(6, 'Password should be of minimum 6 characters length')
        .required('Password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required')
    }),
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
```

## Routes Configuration

### Backend Routes

**File Path**: `/backend/routes/userRoutes.js`

```javascript
const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshToken);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.post('/logout', protect, logoutUser);
```

### Frontend Routes

**File Path**: `/frontend/src/App.js`

```javascript
<Routes>
  {/* Public routes */}
  <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
  <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
  <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
  <Route path="/reset-password/:token" element={!user ? <ResetPasswordPage /> : <Navigate to="/dashboard" />} />
  
  {/* Protected routes */}
  <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route index element={<Navigate to="/dashboard" replace />} />
    <Route path="dashboard" element={<DashboardPage />} />
    <Route path="tasks" element={<TasksPage />} />
    <Route path="emails" element={<EmailsPage />} />
    <Route path="followups" element={<FollowUpsPage />} />
    <Route path="settings" element={<SettingsPage />} />
  </Route>
</Routes>
```

## API Service

**File Path**: `/frontend/src/services/api.js`

```javascript
// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // If error is 401 Unauthorized and not from the token refresh endpoint
    // and we haven't already tried to refresh the token
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest.url.includes('/auth/refresh') && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        // Get stored user data
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
          throw new Error('No user data found');
        }
        
        const userData = JSON.parse(storedUser);
        
        // Call refresh token endpoint
        const response = await axios.post(
          `${originalRequest.baseURL}/api/auth/refresh`,
          { refreshToken: userData.refreshToken }
        );
        
        const { token } = response.data;
        
        // Update stored user data
        const updatedUser = {
          ...userData,
          token
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update Authorization header for this and future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh token fails, clear user data and force login
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        
        // Redirect to login page
        window.location.href = '/login?session=expired';
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

## Protected Route Component

**File Path**: `/frontend/src/components/common/ProtectedRoute.js`

```javascript
const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
```

## Environment Variables

### Backend Environment Variables

**File Path**: `/backend/.env`

```
# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@taskmaster.com

# Frontend URL (for reset links)
FRONTEND_URL=http://localhost:3000
```

## Testing User Authentication

### Test Login

```javascript
const loginTest = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    console.log('Login successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};
```

### Test Registration

```javascript
const registerTest = async (name, email, password) => {
  try {
    const response = await api.post('/api/auth/register', { 
      name, 
      email, 
      password 
    });
    console.log('Registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
};
```

### Test Password Reset

```javascript
const requestPasswordResetTest = async (email) => {
  try {
    const response = await api.post('/api/auth/forgot-password', { email });
    console.log('Password reset request successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Password reset request failed:', error.response?.data || error.message);
    throw error;
  }
};

const resetPasswordTest = async (token, password) => {
  try {
    const response = await api.post(`/api/auth/reset-password/${token}`, { password });
    console.log('Password reset successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Password reset failed:', error.response?.data || error.message);
    throw error;
  }
};
```
