// Force text visibility by injecting high-priority styles
export const forceTextVisibility = () => {
  const styleId = 'force-text-visibility';
  
  // Remove existing style if present
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create new style element
  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    /* Force all text to be visible */
    *, *::before, *::after {
      color: inherit !important;
    }
    
    body {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Force all Material-UI Typography to have black text */
    .MuiTypography-root,
    .MuiTypography-h1,
    .MuiTypography-h2,
    .MuiTypography-h3,
    .MuiTypography-h4,
    .MuiTypography-h5,
    .MuiTypography-h6,
    .MuiTypography-body1,
    .MuiTypography-body2,
    .MuiTypography-subtitle1,
    .MuiTypography-subtitle2 {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    .MuiTypography-caption,
    .MuiTypography-overline {
      color: rgba(0, 0, 0, 0.6) !important;
    }
    
    /* Force all headings to be black */
    h1, h2, h3, h4, h5, h6 {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Force cards to have white background and black text */
    .MuiCard-root,
    .MuiPaper-root {
      background-color: #ffffff !important;
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    .MuiCardContent-root {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Force all text elements */
    p, span, div, label, li, td, th {
      color: inherit !important;
    }
    
    /* Page container specific */
    .page-container,
    .page-content {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Force stat cards to be visible */
    .stat-card,
    .stat-card * {
      color: rgba(0, 0, 0, 0.87) !important;
    }
    
    /* Icon backgrounds with better colors */
    .stat-icon-box {
      opacity: 1 !important;
    }
    
    .stat-icon-box.primary {
      background-color: #2196f3 !important;
      opacity: 0.1 !important;
    }
    
    .stat-icon-box.error {
      background-color: #f44336 !important;
      opacity: 0.1 !important;
    }
    
    .stat-icon-box.warning {
      background-color: #ff9800 !important;
      opacity: 0.1 !important;
    }
    
    .stat-icon-box.info {
      background-color: #2196f3 !important;
      opacity: 0.1 !important;
    }
    
    .stat-icon-box.success {
      background-color: #4caf50 !important;
      opacity: 0.1 !important;
    }
    
    /* Dark mode overrides */
    [data-theme="dark"] body {
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .MuiTypography-root,
    [data-theme="dark"] .MuiTypography-h1,
    [data-theme="dark"] .MuiTypography-h2,
    [data-theme="dark"] .MuiTypography-h3,
    [data-theme="dark"] .MuiTypography-h4,
    [data-theme="dark"] .MuiTypography-h5,
    [data-theme="dark"] .MuiTypography-h6,
    [data-theme="dark"] .MuiTypography-body1,
    [data-theme="dark"] .MuiTypography-body2,
    [data-theme="dark"] .MuiTypography-subtitle1,
    [data-theme="dark"] .MuiTypography-subtitle2,
    [data-theme="dark"] h1,
    [data-theme="dark"] h2,
    [data-theme="dark"] h3,
    [data-theme="dark"] h4,
    [data-theme="dark"] h5,
    [data-theme="dark"] h6 {
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .MuiTypography-caption,
    [data-theme="dark"] .MuiTypography-overline {
      color: rgba(255, 255, 255, 0.7) !important;
    }
    
    [data-theme="dark"] .MuiCard-root,
    [data-theme="dark"] .MuiPaper-root {
      background-color: #1e1e1e !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .page-container,
    [data-theme="dark"] .page-content,
    [data-theme="dark"] .stat-card,
    [data-theme="dark"] .stat-card * {
      color: #ffffff !important;
    }
  `;
  
  // Append to head with high priority
  document.head.appendChild(style);
};

// Auto-apply on load
if (typeof window !== 'undefined') {
  forceTextVisibility();
  
  // Re-apply on theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        forceTextVisibility();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}