import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

const LoadingState = ({ 
  message = 'Loading...', 
  fullHeight = false, 
  size = 40,
  showMessage = true,
  delay = 200 
}) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Fade in={show}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: fullHeight ? '100vh' : '200px',
          width: '100%',
          gap: 2,
          py: 4
        }}
      >
        <CircularProgress size={size} />
        {showMessage && (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default LoadingState;