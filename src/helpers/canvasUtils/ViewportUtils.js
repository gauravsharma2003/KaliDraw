/**
 * Viewport Utilities
 * Functions for managing the canvas viewport, panning, and zooming
 */

/**
 * Calculate visible viewport bounds based on canvas dimensions, zoom, and offset
 * @param {Object} canvasDimensions - Canvas width and height {width, height}
 * @param {number} zoomLevel - Current zoom level
 * @param {Object} offset - Current viewport offset {x, y}
 * @returns {Object} Viewport bounds {left, top, right, bottom}
 */
export const calculateViewportBounds = (canvasDimensions, zoomLevel, offset) => {
  if (!canvasDimensions || typeof canvasDimensions.width !== 'number' || typeof canvasDimensions.height !== 'number') {
    console.error('Invalid canvasDimensions:', canvasDimensions);
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  if (typeof zoomLevel !== 'number' || zoomLevel <= 0) {
    console.error('Invalid zoomLevel:', zoomLevel);
    zoomLevel = 1;
  }

  if (!offset || typeof offset.x !== 'number' || typeof offset.y !== 'number') {
    console.error('Invalid offset:', offset);
    offset = { x: 0, y: 0 };
  }

  // Calculate bounds
  const left = offset.x;
  const top = offset.y;
  const right = left + (canvasDimensions.width / zoomLevel);
  const bottom = top + (canvasDimensions.height / zoomLevel);

  return { left, top, right, bottom };
};

/**
 * Check if a shape is visible in the current viewport
 * @param {Object} shape - Shape with position and dimensions
 * @param {Object} viewportBounds - Current viewport bounds {left, top, right, bottom}
 * @param {number} padding - Additional padding to consider outside viewport (for partially visible shapes)
 * @returns {boolean} True if shape is visible in viewport
 */
export const isShapeInViewport = (shape, viewportBounds, padding = 50) => {
  if (!shape || !shape.position) {
    console.error('Invalid shape:', shape);
    return false;
  }

  if (!viewportBounds) {
    console.error('Invalid viewportBounds:', viewportBounds);
    return true; // Default to showing shapes if viewport calculation failed
  }

  const { x, y } = shape.position;
  
  // For rectangle-based shapes
  if (shape.width !== undefined && shape.height !== undefined) {
    const shapeRight = x + shape.width;
    const shapeBottom = y + shape.height;
    
    return !(
      shapeRight < viewportBounds.left - padding ||
      x > viewportBounds.right + padding ||
      shapeBottom < viewportBounds.top - padding ||
      y > viewportBounds.bottom + padding
    );
  }
  
  // For circle/ellipse-based shapes
  if (shape.radius !== undefined) {
    const radius = shape.radius;
    
    return !(
      x + radius < viewportBounds.left - padding ||
      x - radius > viewportBounds.right + padding ||
      y + radius < viewportBounds.top - padding ||
      y - radius > viewportBounds.bottom + padding
    );
  }
  
  return true; // Default to showing if shape type is unknown
};

/**
 * Calculate zoom constraints based on canvas dimensions and content bounds
 * @param {Object} canvasDimensions - Canvas width and height {width, height}
 * @param {Object} contentBounds - Content bounds {left, top, right, bottom}
 * @param {number} minZoom - Minimum allowed zoom level
 * @param {number} maxZoom - Maximum allowed zoom level
 * @returns {Object} Zoom constraints {min, max}
 */
export const calculateZoomConstraints = (canvasDimensions, contentBounds, minZoom = 0.1, maxZoom = 5) => {
  if (!canvasDimensions || !contentBounds) {
    return { min: minZoom, max: maxZoom };
  }
  
  // Calculate content width and height
  const contentWidth = contentBounds.right - contentBounds.left;
  const contentHeight = contentBounds.bottom - contentBounds.top;
  
  // Calculate minimum zoom to fit all content
  let minZoomToFit = Math.min(
    canvasDimensions.width / contentWidth,
    canvasDimensions.height / contentHeight
  ) * 0.9; // 90% to add some padding
  
  // Clamp to provided min/max values
  minZoomToFit = Math.max(minZoomToFit, minZoom);
  minZoomToFit = Math.min(minZoomToFit, maxZoom);
  
  return { min: minZoomToFit, max: maxZoom };
}; 