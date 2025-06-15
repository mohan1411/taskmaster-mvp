          sx={{
            bgcolor: 'error.main',
            color: 'error.contrastText',
            '&:hover': { bgcolor: 'error.dark' }
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

// Pull to Refresh Component
export const PullToRefresh = ({ onRefresh, children }) => {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setPulling(true);
    }
  };
  
  const handleTouchMove = (e) => {
    if (pulling) {
      const touch = e.touches[0];
      const distance = touch.clientY;
      setPullDistance(Math.min(distance, 100));
    }
  };
  
  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  };
  
  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{ position: 'relative' }}
    >
      <Box
        className="pull-to-refresh"
        sx={{
          position: 'absolute',
          top: pullDistance - 60,
          left: '50%',
          transform: 'translateX(-50%)',
          transition: !pulling ? 'top 0.3s ease' : 'none',
          opacity: pullDistance / 100
        }}
      >
        {refreshing ? (
          <CircularProgress size={24} />
        ) : (
          <ArrowDownwardIcon />
        )}
      </Box>
      {children}
    </Box>
  );
};

export default MobileNavigation;
