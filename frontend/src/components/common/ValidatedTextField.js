import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { CheckCircle, Error, Visibility, VisibilityOff } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';

const ValidatedTextField = ({
  value,
  onChange,
  onValidation,
  validation,
  showValidationIcon = true,
  type = 'text',
  helperText,
  error,
  success,
  debounceMs = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [isValid, setIsValid] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  // Debounced validation
  useEffect(() => {
    if (!validation || !touched) return;

    const timer = setTimeout(() => {
      const result = validation(localValue);
      if (typeof result === 'object') {
        setIsValid(result.isValid);
        setValidationMessage(result.message || '');
        onValidation?.(result.isValid, result.message);
      } else {
        setIsValid(result);
        setValidationMessage('');
        onValidation?.(result, '');
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, validation, debounceMs, onValidation, touched]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setTouched(true);
    onChange?.(e);
  };

  const handleBlur = (e) => {
    setTouched(true);
    props.onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine the current state
  const isPassword = type === 'password';
  const currentType = isPassword && showPassword ? 'text' : type;
  const hasError = error || (touched && isValid === false);
  const hasSuccess = success || (touched && isValid === true);

  // Build the end adornment
  let endAdornment = null;

  if (isPassword) {
    const passwordIcon = (
      <IconButton
        aria-label="toggle password visibility"
        onClick={togglePasswordVisibility}
        edge="end"
        size="small"
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    );

    if (showValidationIcon && touched && isValid !== null) {
      endAdornment = (
        <InputAdornment position="end">
          {isValid ? (
            <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
          ) : (
            <Error sx={{ color: 'error.main', mr: 1 }} />
          )}
          {passwordIcon}
        </InputAdornment>
      );
    } else {
      endAdornment = <InputAdornment position="end">{passwordIcon}</InputAdornment>;
    }
  } else if (showValidationIcon && touched && isValid !== null) {
    endAdornment = (
      <InputAdornment position="end">
        {isValid ? (
          <CheckCircle sx={{ color: 'success.main' }} />
        ) : (
          <Error sx={{ color: 'error.main' }} />
        )}
      </InputAdornment>
    );
  }

  // Determine helper text
  const displayHelperText = hasError 
    ? (validationMessage || helperText || 'Invalid input')
    : (helperText || validationMessage);

  return (
    <TextField
      {...props}
      type={currentType}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      error={hasError}
      helperText={displayHelperText}
      InputProps={{
        ...props.InputProps,
        endAdornment,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          transition: 'all 0.2s ease-in-out',
          ...(hasSuccess && {
            '& fieldset': {
              borderColor: 'success.main',
            },
          }),
          ...(hasError && {
            animation: 'shake 0.5s ease-in-out',
          }),
        },
        '@keyframes shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        ...props.sx,
      }}
    />
  );
};

// Common validation functions
export const validationRules = {
  required: (value) => ({
    isValid: value && value.trim().length > 0,
    message: 'This field is required'
  }),
  
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(value),
      message: 'Please enter a valid email address'
    };
  },
  
  minLength: (min) => (value) => ({
    isValid: value && value.length >= min,
    message: `Must be at least ${min} characters long`
  }),
  
  password: (value) => {
    const hasLength = value && value.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    
    if (!hasLength) {
      return { isValid: false, message: 'Password must be at least 8 characters' };
    }
    if (!hasLetter) {
      return { isValid: false, message: 'Password must contain at least one letter' };
    }
    if (!hasNumber) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    return { isValid: true, message: 'Strong password' };
  },
  
  confirmPassword: (originalPassword) => (value) => ({
    isValid: value === originalPassword,
    message: 'Passwords do not match'
  }),

  combine: (...validators) => (value) => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true, message: '' };
  }
};

export default ValidatedTextField;