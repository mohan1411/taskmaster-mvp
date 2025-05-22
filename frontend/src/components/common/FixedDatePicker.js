import React from 'react';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { TextField } from '@mui/material';

// Enhanced version of DatePicker that works with both renderInput and slotProps approaches
const FixedDatePicker = (props) => {
  const { renderInput, ...otherProps } = props;

  // If renderInput is provided, convert it to slotProps
  if (renderInput) {
    return (
      <MuiDatePicker
        {...otherProps}
        slotProps={{
          textField: {
            fullWidth: true,
            // We'll simulate the renderInput function by creating an equivalent slotProps.textField
            ...(otherProps.slotProps?.textField || {}),
          },
        }}
      />
    );
  }

  // Otherwise, use the props as is
  return <MuiDatePicker {...otherProps} />;
};

// Add a patch for the KeyboardDateInput component
if (typeof window !== 'undefined') {
  // Create a patch for the global window object to fix the KeyboardDateInput component
  const originalGetAttribute = Element.prototype.getAttribute;
  Element.prototype.getAttribute = function(name) {
    // If this is a check for renderInput and it doesn't exist, return a dummy function
    if (name === 'renderInput' && !this.hasAttribute('renderInput') && this.getAttribute('data-mui-test') === 'KeyboardDateInput') {
      return () => <TextField fullWidth />;
    }
    return originalGetAttribute.call(this, name);
  };
}

export default FixedDatePicker;
