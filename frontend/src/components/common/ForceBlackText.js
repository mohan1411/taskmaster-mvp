import { useEffect } from 'react';

// Component that forces all text to be black in its children
const ForceBlackText = ({ children }) => {
  useEffect(() => {
    // Force all text elements to be black
    const forceBlack = () => {
      const elements = document.querySelectorAll('*');
      elements.forEach(el => {
        const computed = window.getComputedStyle(el);
        const color = computed.color;
        
        // If the color is white or very light, force it to black
        if (color === 'rgb(255, 255, 255)' || 
            color === 'white' || 
            color === '#ffffff' || 
            color === '#fff' ||
            color.includes('255, 255, 255')) {
          el.style.setProperty('color', '#000000', 'important');
        }
      });
    };
    
    // Run immediately
    forceBlack();
    
    // Run again after delays to catch dynamically added content
    const timeouts = [100, 300, 500, 1000].map(delay => 
      setTimeout(forceBlack, delay)
    );
    
    return () => timeouts.forEach(clearTimeout);
  }, [children]);
  
  return (
    <div style={{ color: '#000000 !important' }}>
      {children}
    </div>
  );
};

export default ForceBlackText;