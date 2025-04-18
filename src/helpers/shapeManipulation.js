/**
 * This file is a backwards compatibility wrapper for the refactored shapeUtils folder.
 * It re-exports all the functions from the shapeUtils module for existing code that hasn't been updated.
 */

import {
  // Shape detection
  isPointInShape,
  getShapeBoundingBox,
  
  // Shape resize
  resizeShape,
  getResizeHandle,
  getShapeResizeHandles,
  
  // Shape geometry
  generateId,
  scaleCircle,
  getCircleCenter,
  calculateTextMetrics,
  
  // Text utilities
  createText,
  scaleText,
  getTextBoundingBox,
  updateTextProperties,
  setTextAlignment,
  setTextVerticalAlignment,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setTextColor,
  updateTextStyle
} from './shapeUtils';

// Re-export all functions
export {
  // Shape detection
  isPointInShape,
  getShapeBoundingBox,
  
  // Shape resize
  resizeShape,
  getResizeHandle,
  getShapeResizeHandles,
  
  // Shape geometry
  generateId,
  scaleCircle,
  getCircleCenter,
  calculateTextMetrics,
  
  // Text utilities
  createText,
  scaleText,
  getTextBoundingBox,
  updateTextProperties,
  setTextAlignment,
  setTextVerticalAlignment,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setTextColor,
  updateTextStyle
}; 