/**
 * Canvas setup and initialization functions
 */

// Setup canvas with proper dimensions and DPI scaling
export const setupCanvas = (canvas) => {
  const updateCanvasSize = () => {
    const container = canvas.parentElement;
    if (!container) return;
    
    // Get the dimensions of the container
    const { width, height } = container.getBoundingClientRect();
    
    // Set canvas dimensions to match the container (considering device pixel ratio)
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    
    // Scale the context for high DPI displays
    const ctx = canvas.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    
    // Set CSS dimensions
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  };
  
  // Initial setup
  updateCanvasSize();
  
  // Listen for resize events to update canvas size
  window.addEventListener('resize', updateCanvasSize);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('resize', updateCanvasSize);
  };
};

// Clear the canvas
export const clearCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}; 