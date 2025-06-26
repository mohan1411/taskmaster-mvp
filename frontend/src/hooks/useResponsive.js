import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

export function useResponsive() {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // > 900px
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg')); // > 1200px
  
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md')); // < 900px
  const isSmallMobile = useMediaQuery('(max-width:375px)'); // Small phones
  
  // Orientation
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isPortrait = useMediaQuery('(orientation: portrait)');
  
  // Touch device detection
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isMobileOrTablet,
    isSmallMobile,
    isLandscape,
    isPortrait,
    isTouchDevice,
    // Utility functions
    breakpoint: {
      down: (breakpoint) => theme.breakpoints.down(breakpoint),
      up: (breakpoint) => theme.breakpoints.up(breakpoint),
      between: (start, end) => theme.breakpoints.between(start, end),
    }
  };
}

export default useResponsive;