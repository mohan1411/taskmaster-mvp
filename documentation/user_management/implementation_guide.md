# User Profile Implementation Guide

## Introduction

This guide details the implementation of user profile functionality in the TaskMaster application. It covers the technical aspects of authentication, profile management, and password recovery features.

## Architecture Overview

The user profile functionality follows a layered architecture:

1. **Database Layer**: MongoDB with Mongoose ODM
2. **API Layer**: Express.js REST endpoints
3. **Service Layer**: Business logic handlers
4. **UI Layer**: React components with Material-UI

## Backend Implementation

### Database Models

The user profile is primarily managed through the `User` model:

```javascript
// Key fields in the User model
{
  name: String,
  email: String,
  password: String (hashed),
  googleId: String (optional),
  avatar: String (optional),
  role: String,
  isEmailVerified: Boolean,
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date
}
```

### API Endpoints

#### Authentication Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | Create new user account |
| POST | /api/auth/login | Authenticate user |
| POST | /api/auth/google | Google OAuth authentication |
| POST | /api/auth/refresh | Get new access token |
| POST | /api/auth/logout | Invalidate session |

#### Profile Management Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/auth/profile | Get user profile |
| PUT | /api/auth/profile | Update user profile |

#### Password Recovery Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/forgot-password | Request password reset |
| GET | /api/auth/verify-reset-token/:token | Verify reset token |
| POST | /api/auth/reset-password/:token | Set new password |

### Authentication Middleware

Protected routes use the authentication middleware:

```javascript
// Key functionality in authMiddleware.js
const protect = async (req, res, next) => {
  // Extract token from Authorization header
  // Verify JWT
  // Attach user to request object
  // Call next() if valid
};
```

## Frontend Implementation

### Auth Context

Authentication state is managed through React Context:

```javascript
// Key functionality in AuthContext.js
const AuthProvider = ({ children }) => {
  // State for current user, loading, and errors
  // Methods for login, register, logout, update profile
  // JWT handling and refresh token logic
};
```

### User Interface Components

1. **LoginPage**: Email/password form with validation
2. **RegisterPage**: Registration form with validation
3. **ProfileSettings**: Form for updating profile details
4. **ForgotPasswordPage**: Request password reset
5. **ResetPasswordPage**: Set new password with token

## Key Implementation Details

### Password Hashing

Passwords are hashed using bcrypt:

```javascript
// In userModel.js
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
```

### JWT Generation

```javascript
// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiryTime
  });
};
```

### Password Reset Flow

1. User requests reset, backend generates token:
   ```javascript
   const resetToken = crypto.randomBytes(20).toString('hex');
   user.resetPasswordToken = resetToken;
   user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
   ```

2. Email is sent with reset link
3. Reset page verifies token before allowing reset
4. New password is set and tokens cleared

### Form Validation

Forms are validated using Formik and Yup:

```javascript
const validationSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required')
});
```

## Configuration

### Environment Variables

The following environment variables are used:

```
# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email Configuration
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email_user
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@taskmaster.com
```

## Testing

### Manual Testing Procedures

1. **Registration**:
   - Register with valid details
   - Try registering with existing email
   - Try registering with invalid data

2. **Login**:
   - Login with valid credentials
   - Try logging in with invalid credentials
   - Try using remember me function

3. **Profile Management**:
   - Update profile information
   - Change password
   - Verify changes persist after logout/login

4. **Password Recovery**:
   - Request password reset
   - Verify email is received
   - Test reset link functionality
   - Set new password and verify login

## Common Issues and Solutions

### JWT Expiration

**Issue**: Users getting automatically logged out

**Solution**: Ensure refresh token logic is working correctly. Check token expiry times.

### Password Reset Emails

**Issue**: Reset emails not being received

**Solution**: Check email configuration. For development, use Ethereal Email to verify sends.

### Authentication Bypassing

**Issue**: Protected routes accessible without login

**Solution**: Ensure auth middleware is applied to all protected routes.

## Future Development Roadmap

1. **Email Verification**
   - Send verification email on registration
   - Implement verification endpoint
   - Update UI to reflect verification status

2. **Profile Picture Management**
   - Add file upload component
   - Implement storage solution (S3 or similar)
   - Add avatar cropping functionality

3. **OAuth Integrations**
   - Complete Google login flow
   - Consider adding additional providers (Microsoft, GitHub)

## Conclusion

The user profile implementation provides a secure and user-friendly authentication system. It follows best practices for password handling and session management while providing a clean UI experience.
