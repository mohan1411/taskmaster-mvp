// Utility function to clear stale focus sessions
// Run this in the browser console if you have a stuck session

export const clearStaleSession = () => {
  // Clear focus session from localStorage
  localStorage.removeItem('fizztask-active-focus-session');
  
  // Force reload the page to reset all state
  window.location.reload();
};

// You can also run this directly in the browser console:
// localStorage.removeItem('fizztask-active-focus-session'); window.location.reload();