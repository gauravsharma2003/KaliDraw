/**
 * Canvas Coordinate Utilities
 * Functions to handle coordinate conversions between screen and canvas space
 */

/**
 * Convert screen coordinates to canvas coordinates
 * @param {Object} screenCoords - Screen coordinates {x, y}
 * @param {number} zoomLevel - Current zoom level
 * @param {Object} canvasOffset - Canvas offset {x, y}
 * @returns {Object} Canvas coordinates {x, y}
 */
export const screenToCanvasCoords = (screenCoords, zoomLevel, canvasOffset) => {
  if (!screenCoords || typeof screenCoords.x !== 'number' || typeof screenCoords.y !== 'number') {
    console.error('Invalid screenCoords:', screenCoords);
    return { x: 0, y: 0 };
  }

  if (typeof zoomLevel !== 'number' || zoomLevel <= 0) {
    console.error('Invalid zoomLevel:', zoomLevel);
    zoomLevel = 1;
  }

  if (!canvasOffset || typeof canvasOffset.x !== 'number' || typeof canvasOffset.y !== 'number') {
    console.error('Invalid canvasOffset:', canvasOffset);
    canvasOffset = { x: 0, y: 0 };
  }

  return {
    x: screenCoords.x / zoomLevel - canvasOffset.x,
    y: screenCoords.y / zoomLevel - canvasOffset.y
  };
};

/**
 * Convert canvas coordinates to screen coordinates
 * @param {Object} canvasCoords - Canvas coordinates {x, y}
 * @param {number} zoomLevel - Current zoom level
 * @param {Object} canvasOffset - Canvas offset {x, y}
 * @returns {Object} Screen coordinates {x, y}
 */
export const canvasToScreenCoords = (canvasCoords, zoomLevel, canvasOffset) => {
  if (!canvasCoords || typeof canvasCoords.x !== 'number' || typeof canvasCoords.y !== 'number') {
    console.error('Invalid canvasCoords:', canvasCoords);
    return { x: 0, y: 0 };
  }

  if (typeof zoomLevel !== 'number' || zoomLevel <= 0) {
    console.error('Invalid zoomLevel:', zoomLevel);
    zoomLevel = 1;
  }

  if (!canvasOffset || typeof canvasOffset.x !== 'number' || typeof canvasOffset.y !== 'number') {
    console.error('Invalid canvasOffset:', canvasOffset);
    canvasOffset = { x: 0, y: 0 };
  }

  return {
    x: (canvasCoords.x + canvasOffset.x) * zoomLevel,
    y: (canvasCoords.y + canvasOffset.y) * zoomLevel
  };
};

/**
 * Get mouse position relative to canvas
 * @param {Object} event - Mouse event
 * @param {Object} canvasRef - Reference to canvas element
 * @returns {Object} Mouse position {x, y}
 */
export const getRelativeMousePosition = (event, canvasRef) => {
  if (!event || !canvasRef || !canvasRef.current) {
    console.error('Invalid parameters for getRelativeMousePosition');
    return { x: 0, y: 0 };
  }

  const rect = canvasRef.current.getBoundingClientRect();
  
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
};

// Calculate distance between two points
export const getDistance = (point1, point2) => {
  if (!point1 || !point2) {
    console.warn('Invalid points for getDistance');
    return 0;
  }
  
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  
  return Math.sqrt(dx * dx + dy * dy);
};

// Check if a point is inside a rectangle (for selection)
export const isPointInRect = (point, rect) => {
  if (!point || !rect) {
    console.warn('Invalid parameters for isPointInRect');
    return false;
  }
  
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

// Calculate a bounding box for multiple shapes
export const calculateBoundingBox = (shapes) => {
  if (!shapes || !shapes.length) {
    console.warn('No shapes provided for calculateBoundingBox');
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  shapes.forEach(shape => {
    if (!shape) return;
    
    if (shape.type === 'rectangle') {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + shape.width);
      maxY = Math.max(maxY, shape.y + shape.height);
    } else if (shape.type === 'circle') {
      minX = Math.min(minX, shape.x - shape.radius);
      minY = Math.min(minY, shape.y - shape.radius);
      maxX = Math.max(maxX, shape.x + shape.radius);
      maxY = Math.max(maxY, shape.y + shape.radius);
    } else if (shape.type === 'text') {
      minX = Math.min(minX, shape.x);
      minY = Math.min(minY, shape.y);
      maxX = Math.max(maxX, shape.x + (shape.width || 0));
      maxY = Math.max(maxY, shape.y + (shape.height || 0));
    } else if (shape.type === 'pencil' && shape.points && shape.points.length > 0) {
      shape.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    }
  });
  
  if (minX === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Canvas coordinate conversion and cursor utilities
 */

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

// Get cursor position in canvas coordinates (alias for getCanvasCoordinates)
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