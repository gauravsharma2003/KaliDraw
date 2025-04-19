import { getShapeBoundingBox } from './ShapeDetection';
import { getCircleCenter } from './ShapeGeometry';

/**
 * Resizes a shape based on handle position
 * @param {Object} shape - The shape to resize
 * @param {string} handle - The handle being dragged
 * @param {Object} point - The new point position
 * @param {Object} dragStart - The drag start position
 * @returns {Object} - The resized shape
 */
export function resizeShape(shape, handle, point, dragStart) {
  if (!shape || !handle) return shape;
  
  const resized = { ...shape };
  
  if (shape.type === 'rectangle' || shape.type === 'text') {
    // Use the current shape's top-left as the fixed edge base for each handle
    // Set minimum size based on text content or default minimum
    const MIN_SIZE = shape.type === 'text' ? Math.max(20, shape.text?.length * 2 || 20) : 10;
    
    // For text, store initial dimensions for font scaling
    const originalWidth = shape.width;
    const originalHeight = shape.height;
    
    switch (handle) {
      case 'topLeft': {
        const fixedRight = shape.x + shape.width;
        const fixedBottom = shape.y + shape.height;
        resized.x = Math.min(point.x, fixedRight - MIN_SIZE);
        resized.y = Math.min(point.y, fixedBottom - MIN_SIZE);
        resized.width = fixedRight - resized.x;
        resized.height = fixedBottom - resized.y;
        break;
      }
      case 'topCenter': {
        const fixedBottom = shape.y + shape.height;
        resized.y = Math.min(point.y, fixedBottom - MIN_SIZE);
        resized.height = fixedBottom - resized.y;
        break;
      }
      case 'topRight': {
        const fixedLeft = shape.x;
        const fixedBottom = shape.y + shape.height;
        resized.y = Math.min(point.y, fixedBottom - MIN_SIZE);
        resized.width = Math.max(point.x - fixedLeft, MIN_SIZE);
        resized.height = fixedBottom - resized.y;
        break;
      }
      case 'middleLeft': {
        const fixedRight = shape.x + shape.width;
        resized.x = Math.min(point.x, fixedRight - MIN_SIZE);
        resized.width = fixedRight - resized.x;
        break;
      }
      case 'middleRight': {
        const fixedLeft = shape.x;
        resized.width = Math.max(point.x - fixedLeft, MIN_SIZE);
        break;
      }
      case 'bottomLeft': {
        const fixedTop = shape.y;
        const fixedRight = shape.x + shape.width;
        resized.x = Math.min(point.x, fixedRight - MIN_SIZE);
        resized.width = fixedRight - resized.x;
        resized.height = Math.max(point.y - fixedTop, MIN_SIZE);
        break;
      }
      case 'bottomCenter': {
        const fixedTop = shape.y;
        resized.height = Math.max(point.y - fixedTop, MIN_SIZE);
        break;
      }
      case 'bottomRight': {
        const fixedTop = shape.y;
        const fixedLeft = shape.x;
        resized.width = Math.max(point.x - fixedLeft, MIN_SIZE);
        resized.height = Math.max(point.y - fixedTop, MIN_SIZE);
        break;
      }
    }
    
    // For text shapes, scale the font size proportionally to the size change
    if (shape.type === 'text') {
      // Calculate scale factors based on size change
      const widthScale = resized.width / originalWidth;
      const heightScale = resized.height / originalHeight;
      
      // Use a more responsive scaling approach
      // This gives more immediate visual feedback during resizing
      const dampingFactor = 0.5; // Reduced from 0.7 for more responsive scaling
      
      // Calculate scaled factor with less damping
      // This makes the font size change more responsive
      const rawScaleFactor = (widthScale + heightScale) / 2;
      
      // Apply less damping for more immediate response
      const dampedScaleFactor = 1.0 * (1 - dampingFactor) + rawScaleFactor * dampingFactor;
      
      // Set a base font size if not defined, or use current
      const baseFontSize = shape.fontSize || 16;
      
      // Apply the scaling with wider range
      // Allow font to grow larger with container
      const newFontSize = Math.max(8, Math.min(200, Math.round(baseFontSize * dampedScaleFactor)));
      
      // Always update font size during resize for immediate feedback
      resized.fontSize = newFontSize;
      
      // More accurate calculation of minimum dimensions needed for text
      // Create a temporary canvas for text measurement
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set font for accurate measurement
      ctx.font = `${shape.fontStyle || 'normal'} ${shape.fontWeight || 'normal'} ${resized.fontSize}px Arial`;
      
      // Measure the text properly
      const lines = shape.text?.split('\n') || [''];
      const lineHeight = resized.fontSize * 1.2;
      
      // Calculate max line width using actual text measurement
      let maxLineWidth = 0;
      for (const line of lines) {
        const metrics = ctx.measureText(line || ' ');
        maxLineWidth = Math.max(maxLineWidth, metrics.width);
      }
      
      // Add padding proportional to font size
      const paddingX = resized.fontSize * 1.2;
      const paddingY = resized.fontSize * 0.8;
      
      // Calculate minimum dimensions needed for text
      const minWidth = Math.max(maxLineWidth + paddingX * 2, 80);
      const minHeight = Math.max(lineHeight * lines.length + paddingY * 2, 40);
      
      // Ensure the container doesn't get smaller than needed for the text
      // but allow it to be larger if the user wants to resize it
      resized.width = Math.max(resized.width, minWidth);
      resized.height = Math.max(resized.height, minHeight);
      
      // Preserve alignment settings
      resized.align = shape.align || 'center';
      resized.verticalAlign = shape.verticalAlign || 'middle';
    }
  } else if (shape.type === 'circle') {
    // Handle circle resizing - maintain circularity
    if ('x' in shape && 'y' in shape && 'radius' in shape) {
      // Get the center of the circle
      const center = getCircleCenter(shape);
      
      // Calculate distance from center to the point being dragged
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const newRadius = Math.sqrt(dx * dx + dy * dy);
      
      // Ensure minimum radius
      const finalRadius = Math.max(newRadius, 1);
      
      // Update the circle properties
      resized.radius = finalRadius;
      
      // Adjust x,y to maintain center position (x,y is top-left corner)
      resized.x = center.x - finalRadius;
      resized.y = center.y - finalRadius;
    }
  }
  
  return resized;
}

/**
 * Determines which resize handle is being clicked
 * @param {Object} point - The point to check
 * @param {Object} shape - The shape to check against
 * @returns {string|null} - The name of the resize handle or null if none
 */
export function getResizeHandle(point, shape) {
  if (!shape) return null;
  
  const box = getShapeBoundingBox(shape);
  const HANDLE_SIZE = 12; // Slightly larger hit area than visual size
  
  // Check each resize handle
  const handles = [
    { name: 'topLeft', x: box.x - 5, y: box.y - 5 },
    { name: 'topCenter', x: box.x + box.width/2, y: box.y - 5 },
    { name: 'topRight', x: box.x + box.width + 5, y: box.y - 5 },
    { name: 'middleLeft', x: box.x - 5, y: box.y + box.height/2 },
    { name: 'middleRight', x: box.x + box.width + 5, y: box.y + box.height/2 },
    { name: 'bottomLeft', x: box.x - 5, y: box.y + box.height + 5 },
    { name: 'bottomCenter', x: box.x + box.width/2, y: box.y + box.height + 5 },
    { name: 'bottomRight', x: box.x + box.width + 5, y: box.y + box.height + 5 }
  ];
  
  for (const handle of handles) {
    if (
      Math.abs(point.x - handle.x) <= HANDLE_SIZE/2 &&
      Math.abs(point.y - handle.y) <= HANDLE_SIZE/2
    ) {
      return handle.name;
    }
  }
  
  return null;
}

/**
 * Gets the resize handles for a shape based on its type and bounding box
 * @param {Object} shape - The shape to get handles for
 * @returns {Array} - Array of handle objects with name, x, and y properties
 */
export function getShapeResizeHandles(shape) {
  if (!shape) return [];
  
  const box = getShapeBoundingBox(shape);
  
  // Standard 8 handles around the perimeter of the bounding box
  // No internal handles for any shape type
  return [
    // Corner handles
    { name: 'topLeft', x: box.x, y: box.y },
    { name: 'topRight', x: box.x + box.width, y: box.y },
    { name: 'bottomLeft', x: box.x, y: box.y + box.height },
    { name: 'bottomRight', x: box.x + box.width, y: box.y + box.height },
    
    // Middle handles on each side
    { name: 'topCenter', x: box.x + box.width/2, y: box.y },
    { name: 'middleRight', x: box.x + box.width, y: box.y + box.height/2 },
    { name: 'bottomCenter', x: box.x + box.width/2, y: box.y + box.height },
    { name: 'middleLeft', x: box.x, y: box.y + box.height/2 }
  ];
} 