// Force text visibility by injecting high-priority styles
export const forceTextVisibility = () => {
  const styleId = 'force-text-visibility';
  
  // Remove existing style if present
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Check current theme
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Create new style element
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* EMERGENCY FIX - Theme-aware visibility */
    
    /* Base styles */
    body {
      background-color: ${isDarkMode ? '#121212' : '#fafafa'} !important;
      color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
    }
    
    .page-container {
      background-color: ${isDarkMode ? '#121212' : '#fafafa'} !important;
      color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
    }
    
    /* All text elements */
    p, span, div, h1, h2, h3, h4, h5, h6, label, li, td, th, a,
    .MuiTypography-root,
    [class*="MuiTypography"] {
      color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
    }
    
    /* Cards and Papers */
    .MuiCard-root,
    .MuiPaper-root {
      background-color: ${isDarkMode ? '#1e1e1e' : '#ffffff'} !important;
      color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
    }
    
    .MuiCard-root *,
    .MuiPaper-root * {
      color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
    }
    
    /* Stat cards */
    .stat-card {
      background-color: ${isDarkMode ? '#1e1e1e' : '#ffffff'} !important;
    }
    
    .stat-card * {
      color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
    }
    
    /* Buttons - preserve their styling */
    .MuiButton-containedPrimary,
    .MuiButton-containedSecondary {
      color: #ffffff !important;
    }
    
    /* Input fields */
    .MuiInputBase-root,
    .MuiInputBase-input,
    .MuiFormLabel-root {
      color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
    }
    
    /* Override any conflicting styles */
    [style*="color: white"],
    [style*="color:#fff"],
    [style*="color: #fff"],
    [style*="color:#ffffff"],
    [style*="color: #ffffff"] {
      color: ${isDarkMode ? '#ffffff' : '#000000'} !important;
    }
  `;
  
  // Append to head with high priority
  document.head.appendChild(style);
};

// Auto-apply on load
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceTextVisibility);
  } else {
    forceTextVisibility();
  }
  
  // Force re-apply after a short delay to override any late-loading styles
  setTimeout(forceTextVisibility, 100);
  setTimeout(forceTextVisibility, 500);
  setTimeout(forceTextVisibility, 1000);
  
  // Re-apply on theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        console.log('Theme changed, reapplying text visibility fix');
        forceTextVisibility();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}