/**
 * Canvas rendering and drawing utilities
 */
import * as drawingTools from '../drawingTools';

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