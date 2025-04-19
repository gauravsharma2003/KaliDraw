/**
 * Canvas utility functions for coordinate conversion and drawing
 */
import * as drawingTools from './drawingTools';

// Convert screen coordinates to logical canvas coordinates
export const getCanvasCoordinates = (canvas, event, zoomLevel, canvasOffset) => {
  const rect = canvas.getBoundingClientRect();
  const cssX = event.clientX - rect.left;
  const cssY = event.clientY - rect.top;
  // Apply inverse zoom and offset transforms
  const x = cssX / zoomLevel - canvasOffset.x;
  const y = cssY / zoomLevel - canvasOffset.y;
  return { x, y };
};

// Setup canvas with proper dimensions
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

// Draw all shapes with proper transformation
export const redrawShapes = (ctx, shapes, zoomLevel, canvasOffset) => {
  if (!shapes || !Array.isArray(shapes) || !ctx) {
    console.warn('Invalid parameters for redrawShapes:', { shapes, ctx });
    return;
  }
  
  // Debug info - commented out to reduce log flooding
  // console.log('Redrawing shapes array:', shapes.length);
  
  // Save context state
  ctx.save();
  
  // Apply transform for correct positioning
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  // Use the imported drawing functions
  const {
    drawRectangle,
    drawCircle, 
    drawPencil,
    drawText,
    DRAWING_COLOR,
    LINE_WIDTH
  } = drawingTools;
  
  // Draw each shape with error handling
  shapes.forEach((shape, index) => {
    if (!shape) {
      console.warn('Undefined shape at index', index);
      return;
    }
    
    try {
      switch (shape.type) {
        case 'rectangle':
          if (typeof shape.x !== 'number' || typeof shape.y !== 'number' || 
              typeof shape.width !== 'number' || typeof shape.height !== 'number') {
            console.warn('Invalid rectangle properties:', shape);
            return;
          }
          // Use the imported drawing function with proper color
          drawRectangle(ctx, shape.x, shape.y, shape.width, shape.height, shape.color || DRAWING_COLOR);
          break;
          
        case 'circle':
          if (typeof shape.x !== 'number' || typeof shape.y !== 'number' || 
              typeof shape.radius !== 'number') {
            console.warn('Invalid circle properties:', shape);
            return;
          }
          // Use the imported drawing function with proper color
          drawCircle(ctx, shape.x, shape.y, shape.radius, shape.color || DRAWING_COLOR);
          break;
          
        case 'pencil':
          if (!Array.isArray(shape.points) || shape.points.length < 2) {
            console.warn('Invalid pencil points:', shape.points);
            return;
          }
          // Use the imported drawing function with proper color
          drawPencil(ctx, shape.points, shape.color || DRAWING_COLOR);
          break;
          
        case 'text':
          if (typeof shape.text !== 'string' || typeof shape.x !== 'number' || 
              typeof shape.y !== 'number') {
            console.warn('Invalid text properties:', shape);
            return;
          }
          // Use imported function for text as it's more complex
          drawText(ctx, shape);
          break;
          
        default:
          console.warn('Unknown shape type:', shape.type);
      }
    } catch (error) {
      console.error('Error drawing shape:', error, shape);
    }
  });
  
  // Restore context state
  ctx.restore();
};

// Get cursor position in canvas coordinates
export const getCursorPosition = (canvas, event, zoomLevel, canvasOffset) => {
  return getCanvasCoordinates(canvas, event, zoomLevel, canvasOffset);
};

// Format cursor position for display
export const formatCursorPosition = (position) => {
  if (!position) return 'x: 0, y: 0';
  
  const x = Math.round(position.x);
  const y = Math.round(position.y);
  
  return `x: ${x}, y: ${y}`;
}; 