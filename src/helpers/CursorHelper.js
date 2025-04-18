/**
 * Cursor helper utilities for the drawing application
 */

/**
 * Get the appropriate cursor type based on the active tool and selection state
 * @param {string} activeTool - The currently active tool
 * @param {Object} selectedShape - The currently selected shape (or null if none)
 * @param {string} resizeHandle - The active resize handle (or null if none)
 * @param {boolean} isTypingText - Whether the canvas is currently typing text
 * @returns {string} - The CSS cursor value
 */
export const getCursorType = (activeTool, selectedShape, resizeHandle, isTypingText) => {
  // If currently typing text, always show text cursor
  if (isTypingText) {
    return 'text';
  }
  
  // If a resize handle is active, show the appropriate resize cursor
  if (resizeHandle) {
    switch (resizeHandle) {
      case 'topLeft':
      case 'bottomRight':
        return 'nwse-resize';
      case 'topRight':
      case 'bottomLeft':
        return 'nesw-resize';
      case 'topCenter':
      case 'bottomCenter':
        return 'ns-resize';
      case 'middleLeft':
      case 'middleRight':
        return 'ew-resize';
      default:
        return 'move';
    }
  }

  // For different active tools
  switch (activeTool) {
    case 'select':
      return selectedShape ? 'move' : 'default';
    case 'pencil':
      return 'crosshair';
    case 'rectangle':
    case 'circle':
      return 'crosshair';
    case 'text':
      return 'text';
    default:
      return 'default';
  }
};

/**
 * Calculate cursor position in canvas coordinates
 * @param {HTMLElement} canvas - The canvas element
 * @param {Event} event - The mouse or touch event
 * @param {number} zoomLevel - Current zoom level
 * @param {Object} canvasOffset - Current canvas offset
 * @returns {Object} - The cursor position in canvas coordinates
 */
export const getCursorPosition = (canvas, event, zoomLevel, canvasOffset) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: ((event.clientX - rect.left) * scaleX) / zoomLevel - canvasOffset.x,
    y: ((event.clientY - rect.top) * scaleY) / zoomLevel - canvasOffset.y
  };
};

/**
 * Format cursor position for display
 * @param {Object} position - The cursor position
 * @returns {string} - Formatted position string
 */
export const formatCursorPosition = (position) => {
  if (!position) return 'x: 0, y: 0';
  
  const x = Math.round(position.x);
  const y = Math.round(position.y);
  
  return `x: ${x}, y: ${y}`;
}; 