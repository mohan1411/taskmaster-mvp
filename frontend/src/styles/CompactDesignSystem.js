// Compact Design System for TaskMaster
// Clean and compact interface improvements

export const compactTheme = {
  // Typography scale - more compact
  typography: {
    h1: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.4 },
    h6: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.4 },
    subtitle1: { fontSize: '0.875rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.813rem', fontWeight: 500 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5 },
    body2: { fontSize: '0.813rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    button: { fontSize: '0.813rem', fontWeight: 500, textTransform: 'none' }
  },
  
  // Compact spacing
  spacing: {
    xs: 4,   // 4px
    sm: 8,   // 8px
    md: 12,  // 12px
    lg: 16,  // 16px
    xl: 20,  // 20px
    xxl: 24  // 24px
  },
  
  // Component sizes
  components: {
    // Stat cards
    statCard: {
      height: 72,
      padding: 12,
      iconSize: 28,
      iconBoxSize: 40,
      valueSize: '1.5rem',
      labelSize: '0.75rem'
    },
    
    // List items
    listItem: {
      paddingY: 8,
      paddingX: 12,
      minHeight: 40,
      iconSize: 18
    },
    
    // Buttons
    button: {
      small: {
        height: 28,
        padding: '4px 12px',
        fontSize: '0.75rem'
      },
      medium: {
        height: 32,
        padding: '6px 16px',
        fontSize: '0.813rem'
      }
    },
    
    // Chips
    chip: {
      small: {
        height: 20,
        fontSize: '0.688rem'
      },
      medium: {
        height: 24,
        fontSize: '0.75rem'
      }
    },
    
    // Cards
    card: {
      padding: 16,
      borderRadius: 8
    },
    
    // Tables
    table: {
      cellPaddingY: 8,
      cellPaddingX: 12,
      headerHeight: 40,
      rowHeight: 44
    }
  },
  
  // Colors - subtle and professional
  colors: {
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
      hover: 'rgba(0, 0, 0, 0.02)'
    },
    border: {
      light: 'rgba(0, 0, 0, 0.08)',
      main: 'rgba(0, 0, 0, 0.12)'
    }
  }
};

// Utility functions for consistent styling
export const getCompactStatCardStyles = (theme, color = 'primary') => ({
  height: compactTheme.components.statCard.height,
  p: compactTheme.components.statCard.padding / 8, // Convert to MUI spacing units
  cursor: 'pointer',
  transition: 'all 0.2s',
  border: '1px solid',
  borderColor: 'divider',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: 1,
    borderColor: `${color}.main`,
    bgcolor: 'action.hover'
  }
});

export const getCompactListItemStyles = () => ({
  py: compactTheme.components.listItem.paddingY / 8,
  px: compactTheme.components.listItem.paddingX / 8,
  minHeight: compactTheme.components.listItem.minHeight,
  '&:hover': {
    bgcolor: 'action.hover'
  }
});

export const getCompactButtonStyles = (size = 'medium') => ({
  height: compactTheme.components.button[size].height,
  padding: compactTheme.components.button[size].padding,
  fontSize: compactTheme.components.button[size].fontSize,
  textTransform: 'none',
  fontWeight: 500
});

export const getCompactChipStyles = (size = 'small') => ({
  height: compactTheme.components.chip[size].height,
  fontSize: compactTheme.components.chip[size].fontSize,
  '& .MuiChip-label': {
    px: 1
  }
});

// Section header styles
export const getSectionHeaderStyles = () => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: 1.5,
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: 'grey.50'
});

// Compact grid spacing
export const getCompactGridStyles = () => ({
  container: {
    spacing: 2 // 16px gap
  },
  item: {
    xs: 12,
    sm: 6,
    md: 4,
    lg: 3
  }
});

// Export default styles object for easy importing
export default {
  theme: compactTheme,
  getStatCard: getCompactStatCardStyles,
  getListItem: getCompactListItemStyles,
  getButton: getCompactButtonStyles,
  getChip: getCompactChipStyles,
  getSectionHeader: getSectionHeaderStyles,
  getGrid: getCompactGridStyles
};
