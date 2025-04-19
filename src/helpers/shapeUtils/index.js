// Export all shape utility functions from a single entry point

// Shape detection utilities
import { isPointInShape, getShapeBoundingBox } from './ShapeDetection';

// Shape resize utilities
import { resizeShape, getResizeHandle, getShapeResizeHandles } from './ShapeResize';

// Shape geometry utilities
import { generateId, scaleCircle, getCircleCenter, calculateTextMetrics } from './ShapeGeometry';

// Text shape utilities
import {
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
} from './TextUtils';

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