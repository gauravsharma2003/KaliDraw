/**
 * Canvas Transform Utilities
 * Functions related to canvas transformations such as zooming, panning, etc.
 */

/**
 * Calculate zoom transformation for canvas
 * @param {number} zoomLevel - Current zoom level
 * @param {Object} canvasOffset - Canvas offset {x, y}
 * @returns {string} CSS transform string
 */
export const calculateZoomTransform = (zoomLevel, canvasOffset) => {
  if (typeof zoomLevel !== 'number' || zoomLevel <= 0) {
    console.error('Invalid zoom level:', zoomLevel);
    return 'scale(1) translate(0px, 0px)';
  }

  if (!canvasOffset || typeof canvasOffset.x !== 'number' || typeof canvasOffset.y !== 'number') {
    console.error('Invalid canvasOffset:', canvasOffset);
    return `scale(${zoomLevel}) translate(0px, 0px)`;
  }

  return `scale(${zoomLevel}) translate(${canvasOffset.x}px, ${canvasOffset.y}px)`;
};

/**
 * Adjust zoom level based on wheel event
 * @param {number} currentZoom - Current zoom level
 * @param {Object} wheelEvent - Wheel event object
 * @param {number} zoomFactor - Factor by which to zoom (e.g., 0.1 for 10%)
 * @param {number} minZoom - Minimum allowed zoom level
 * @param {number} maxZoom - Maximum allowed zoom level
 * @returns {number} New zoom level
 */
export const calculateNewZoomLevel = (currentZoom, wheelEvent, zoomFactor = 0.1, minZoom = 0.1, maxZoom = 5) => {
  if (typeof currentZoom !== 'number' || currentZoom <= 0) {
    console.error('Invalid currentZoom:', currentZoom);
    return 1;
  }

  if (!wheelEvent) {
    console.error('Invalid wheelEvent');
    return currentZoom;
  }

  // Determine zoom direction based on wheel delta
  const zoomDirection = wheelEvent.deltaY < 0 ? 1 : -1;
  
  // Calculate new zoom level
  let newZoom = currentZoom + (zoomDirection * zoomFactor * currentZoom);
  
  // Clamp to min/max zoom
  newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
  
  return newZoom;
};

/**
 * Calculate new canvas offset during zooming to maintain focus point
 * @param {Object} prevOffset - Previous canvas offset {x, y}
 * @param {number} prevZoom - Previous zoom level
 * @param {number} newZoom - New zoom level
 * @param {Object} mousePos - Mouse position {x, y} relative to canvas
 * @returns {Object} New canvas offset {x, y}
 */
export const calculateZoomOffset = (prevOffset, prevZoom, newZoom, mousePos) => {
  if (!prevOffset || typeof prevOffset.x !== 'number' || typeof prevOffset.y !== 'number') {
    console.error('Invalid prevOffset:', prevOffset);
    return { x: 0, y: 0 };
  }

  if (typeof prevZoom !== 'number' || prevZoom <= 0 || typeof newZoom !== 'number' || newZoom <= 0) {
    console.error('Invalid zoom values:', { prevZoom, newZoom });
    return { ...prevOffset };
  }

  if (!mousePos || typeof mousePos.x !== 'number' || typeof mousePos.y !== 'number') {
    console.error('Invalid mousePos:', mousePos);
    return { ...prevOffset };
  }

  // Calculate the mouse position in the canvas space before zooming
  const mouseXInCanvasSpace = mousePos.x / prevZoom - prevOffset.x;
  const mouseYInCanvasSpace = mousePos.y / prevZoom - prevOffset.y;
  
  // Calculate new offset to keep the mouse position at the same point after zooming
  const newOffsetX = mousePos.x / newZoom - mouseXInCanvasSpace;
  const newOffsetY = mousePos.y / newZoom - mouseYInCanvasSpace;
  
  return { x: newOffsetX, y: newOffsetY };
};

// Apply current zoom and offset transformations to the canvas context
export const applyCanvasTransform = (ctx, zoomLevel, canvasOffset) => {
  if (!ctx) {
    console.warn('Invalid context for applyCanvasTransform');
    return;
  }
  
  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
};

// Reset the canvas transformation to identity matrix
export const resetCanvasTransform = (ctx) => {
  if (!ctx) {
    console.warn('Invalid context for resetCanvasTransform');
    return;
  }
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// Calculate new canvas offset for panning
export const calculatePanOffset = (startPanPosition, currentPosition, zoomLevel, prevOffset) => {
  if (!startPanPosition || !currentPosition || !prevOffset) {
    console.warn('Invalid parameters for calculatePanOffset');
    return prevOffset;
  }
  
  const deltaX = (currentPosition.x - startPanPosition.x) / zoomLevel;
  const deltaY = (currentPosition.y - startPanPosition.y) / zoomLevel;
  
  return {
    x: prevOffset.x + deltaX,
    y: prevOffset.y + deltaY
  };
}; 