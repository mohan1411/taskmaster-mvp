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
    /* EMERGENCY FIX - Force black text on white backgrounds */
    body {
      color: #000000 !important;
      background-color: #fafafa !important;
    }
    
    /* Force all text content to be black */
    p, span, div, h1, h2, h3, h4, h5, h6, label, li, td, th, a {
      color: #000000 !important;
    }
    
    /* Force all Material-UI components to have black text */
    [class*="MuiTypography"] {
      color: #000000 !important;
    }
    
    /* Force all Material-UI text fields and inputs */
    .MuiInputBase-root,
    .MuiInputBase-input,
    .MuiFormLabel-root {
      color: #000000 !important;
    }
    
    /* Force cards and papers to have proper contrast */
    .MuiCard-root,
    .MuiPaper-root {
      background-color: #ffffff !important;
      color: #000000 !important;
    }
    
    .MuiCard-root *,
    .MuiPaper-root * {
      color: #000000 !important;
    }
    
    /* Page container and content */
    .page-container,
    .page-content,
    .page-container *,
    .page-content * {
      color: #000000 !important;
    }
    
    /* Ensure stat cards are visible */
    .stat-card,
    .stat-card * {
      color: #000000 !important;
      background-color: #ffffff !important;
    }
    
    /* Fix any elements that might have white color explicitly set */
    [style*="color: white"],
    [style*="color:#fff"],
    [style*="color: #fff"],
    [style*="color:#ffffff"],
    [style*="color: #ffffff"],
    [style*="color: rgb(255"],
    [style*="color:rgb(255"] {
      color: #000000 !important;
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
    
    /* Buttons need to maintain their colors */
    .MuiButton-contained {
      color: white !important;
    }
    
    .MuiButton-text,
    .MuiButton-outlined {
      color: inherit !important;
    }
    
    /* Icons should use currentColor */
    .MuiSvgIcon-root {
      color: currentColor !important;
    }
    
    /* Dark mode - only apply if background is actually dark */
    [data-theme="dark"] body {
      background-color: #121212 !important;
      color: #ffffff !important;
    }
    
    [data-theme="dark"] p,
    [data-theme="dark"] span,
    [data-theme="dark"] div,
    [data-theme="dark"] h1,
    [data-theme="dark"] h2,
    [data-theme="dark"] h3,
    [data-theme="dark"] h4,
    [data-theme="dark"] h5,
    [data-theme="dark"] h6,
    [data-theme="dark"] label,
    [data-theme="dark"] li,
    [data-theme="dark"] td,
    [data-theme="dark"] th,
    [data-theme="dark"] a,
    [data-theme="dark"] [class*="MuiTypography"] {
      color: #ffffff !important;
    }
    
    [data-theme="dark"] .MuiCard-root,
    [data-theme="dark"] .MuiPaper-root {
      background-color: #1e1e1e !important;
    }
    
    [data-theme="dark"] .MuiCard-root *,
    [data-theme="dark"] .MuiPaper-root * {
      color: #ffffff !important;
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
        forceTextVisibility();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
  
  // Also observe body for class changes
  if (document.body) {
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }
}