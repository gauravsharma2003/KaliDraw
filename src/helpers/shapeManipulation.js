/**
 * Checks if a point is inside a shape
 * @param {Object} point - The point to check
 * @param {Object} shape - The shape to check against
 * @returns {boolean} - Whether the point is inside the shape
 */
export function isPointInShape(point, shape) {
  if (!shape) return false;
  
  if (shape.type === 'rectangle') {
    // For rectangles with explicit width/height
    if ('x' in shape && 'y' in shape && 'width' in shape && 'height' in shape) {
      return (
        point.x >= shape.x &&
        point.x <= shape.x + shape.width &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.height
      );
    }
    
    // For rectangles with start/end points
    const minX = Math.min(shape.startX, shape.endX);
    const maxX = Math.max(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxY = Math.max(shape.startY, shape.endY);

    return (
      point.x >= minX &&
      point.x <= maxX &&
      point.y >= minY &&
      point.y <= maxY
    );
  } else if (shape.type === 'circle') {
    // For circles with explicit center and radius
    if ('x' in shape && 'y' in shape && 'radius' in shape) {
      // Get the center of the circle
      const center = getCircleCenter(shape);
      
      // Calculate distance from center to point
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Point is inside if distance to center is less than radius
      return distance <= shape.radius;
    }
    
    // For circles with start/end points
    const centerX = (shape.startX + shape.endX) / 2;
    const centerY = (shape.startY + shape.endY) / 2;
    const radius = Math.sqrt(
      Math.pow(shape.endX - shape.startX, 2) + 
      Math.pow(shape.endY - shape.startY, 2)
    ) / 2;

    const distance = Math.sqrt(
      Math.pow(point.x - centerX, 2) +
      Math.pow(point.y - centerY, 2)
    );

    return distance <= radius;
  } else if (shape.type === 'triangle') {
    // Check if point is inside triangle using barycentric coordinates
    const p1 = { x: shape.startX, y: shape.startY };
    const p2 = { x: shape.endX, y: shape.endY };
    const p3 = { x: shape.startX - (shape.endX - shape.startX), y: shape.endY };

    const area = 0.5 * Math.abs(
      p1.x * (p2.y - p3.y) +
      p2.x * (p3.y - p1.y) +
      p3.x * (p1.y - p2.y)
    );

    const s = 1 / (2 * area) * (
      p1.y * p3.x - p1.x * p3.y +
      (p3.y - p1.y) * point.x +
      (p1.x - p3.x) * point.y
    );

    const t = 1 / (2 * area) * (
      p1.x * p2.y - p1.y * p2.x +
      (p1.y - p2.y) * point.x +
      (p2.x - p1.x) * point.y
    );

    const u = 1 - s - t;

    return s >= 0 && t >= 0 && u >= 0;
  } else if (shape.type === 'pencil' && shape.points) {
    // For pencil, check if point is close to any of the line segments
    const tolerance = 5; // Distance tolerance
    
    for (let i = 0; i < shape.points.length - 1; i++) {
      const p1 = shape.points[i];
      const p2 = shape.points[i + 1];
      
      // Calculate distance from point to line segment
      const lengthSquared = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
      if (lengthSquared === 0) continue; // Same point
      
      // Calculate projection
      const t = Math.max(0, Math.min(1, (
        (point.x - p1.x) * (p2.x - p1.x) + 
        (point.y - p1.y) * (p2.y - p1.y)
      ) / lengthSquared));
      
      const projection = {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };
      
      const distance = Math.sqrt(
        Math.pow(point.x - projection.x, 2) + 
        Math.pow(point.y - projection.y, 2)
      );
      
      if (distance <= tolerance) {
        return true;
      }
    }
    
    return false;
  } else if (shape.type === 'text') {
    // Get the text bounding box and check if point is inside
    const box = getShapeBoundingBox(shape);
    
    return (
      point.x >= box.x &&
      point.x <= box.x + box.width &&
      point.y >= box.y &&
      point.y <= box.y + box.height
    );
  }
  
  return false;
}

/**
 * Gets the bounding box of a shape
 * @param {Object} shape - The shape to get bounding box of
 * @returns {Object} - The bounding box with x, y, width, height
 */
export function getShapeBoundingBox(shape) {
  if (!shape) return null;
  if (shape.type === 'rectangle' || shape.type === 'text') {
    // For text shapes, use top-left coordinates directly from the shape
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  }
  if (shape.type === 'circle') {
    // For circles created using createCircle
    return { x: shape.x, y: shape.y, width: shape.radius * 2, height: shape.radius * 2 };
  }
  // Fallback for other shapes
  return { x: shape.x || 0, y: shape.y || 0, width: shape.width || 0, height: shape.height || 0 };
}

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
    const MIN_SIZE = 10;
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
    // For text, optionally scale font size based on height change
    if (shape.type === 'text') {
      const originalHeight = shape.height;
      const heightRatio = resized.height / originalHeight;
      if (resized.fontSize) {
        resized.fontSize = Math.max(8, Math.round(resized.fontSize * heightRatio));
      }
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
  } else if (shape.type === 'pencil' && shape.points) {
    // For pencil, check if point is close to any of the line segments
    const tolerance = 5; // Distance tolerance
    
    for (let i = 0; i < shape.points.length - 1; i++) {
      const p1 = shape.points[i];
      const p2 = shape.points[i + 1];
      
      // Calculate distance from point to line segment
      const lengthSquared = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
      if (lengthSquared === 0) continue; // Same point
      
      // Calculate projection
      const t = Math.max(0, Math.min(1, (
        (point.x - p1.x) * (p2.x - p1.x) + 
        (point.y - p1.y) * (p2.y - p1.y)
      ) / lengthSquared));
      
      const projection = {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };
      
      const distance = Math.sqrt(
        Math.pow(point.x - projection.x, 2) + 
        Math.pow(point.y - projection.y, 2)
      );
      
      if (distance <= tolerance) {
        return true;
      }
    }
    
    return false;
  } else if (shape.type === 'text') {
    // Get the text bounding box and check if point is inside
    const box = getShapeBoundingBox(shape);
    
    return (
      point.x >= box.x &&
      point.x <= box.x + box.width &&
      point.y >= box.y &&
      point.y <= box.y + box.height
    );
  }
  
  return resized;
}

/**
 * Generate a unique ID for a shape
 * @returns {string} - A unique ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * Creates a text shape with the given properties
 * @param {string} text - The text content
 * @param {number} x - The x position
 * @param {number} y - The y position
 * @param {number} fontSize - The font size
 * @param {Object} options - Additional options for the text shape
 * @returns {Object} - The created text shape
 */
export const createText = (text, x, y, fontSize = 16, options = {}) => {
  const {
    color = '#f54a00',
    align = 'center',
    verticalAlign = 'middle',
    width = 150,
    height = 40,
    id = generateId()
  } = options;
  
  return {
    type: 'text',
    text,
    x,
    y,
    fontSize,
    color,
    align,
    verticalAlign,
    width,
    height,
    id
  };
};

/**
 * Scale a text shape by the given factor
 * @param {Object} textShape - The text shape to scale
 * @param {number} scaleFactor - The scaling factor
 * @returns {Object} - The scaled text shape
 */
export const scaleText = (textShape, scaleFactor) => {
  return {
    ...textShape,
    fontSize: textShape.fontSize * scaleFactor,
    width: textShape.width * scaleFactor,
    height: textShape.height * scaleFactor
  };
};

/**
 * Get the bounding box of a text shape
 * @param {Object} textShape - The text shape to get bounding box of
 * @returns {Object} - The bounding box with x, y, width, height
 */
export const getTextBoundingBox = (textShape) => {
  // Return the bounding box with top-left coordinates as stored in the text shape
  return {
    x: textShape.x,
    y: textShape.y,
    width: textShape.width,
    height: textShape.height
  };
};

/**
 * Calculate text metrics using canvas measurement
 * @param {string} text - The text to measure
 * @param {number} fontSize - The font size of the text
 * @param {string} fontFamily - The font family of the text
 * @returns {Object} - The calculated text metrics
 */
export const calculateTextMetrics = (text, fontSize, fontFamily = 'Arial') => {
  // Create a temporary canvas for measuring text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set font properties
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  // Split text by newlines
  const lines = text.split('\n');
  
  // Measure width of each line
  let maxWidth = 0;
  lines.forEach(line => {
    const metrics = ctx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
  });
  
  // Calculate total height based on line count and font size
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  
  return {
    width: maxWidth,
    height: totalHeight,
    lineHeight
  };
};

/**
 * Update text properties (fontSize, alignment, etc.)
 * @param {Object} textShape - The text shape to update
 * @param {Object} properties - The properties to update
 * @returns {Object} - The updated text shape
 */
export const updateTextProperties = (textShape, properties) => {
  return {
    ...textShape,
    ...properties
  };
};

/**
 * Change text alignment
 * @param {Object} textShape - The text shape to update
 * @param {string} align - The new alignment
 * @returns {Object} - The updated text shape
 */
export const setTextAlignment = (textShape, align) => {
  return {
    ...textShape,
    align
  };
};

/**
 * Change vertical alignment
 * @param {Object} textShape - The text shape to update
 * @param {string} verticalAlign - The new vertical alignment
 * @returns {Object} - The updated text shape
 */
export const setTextVerticalAlignment = (textShape, verticalAlign) => {
  return {
    ...textShape,
    verticalAlign
  };
};

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

/**
 * Scales a circle based on a factor
 * @param {Object} circle - The circle to scale
 * @param {number} scaleFactor - The factor to scale by
 * @returns {Object} - The scaled circle
 */
export const scaleCircle = (circle, scaleFactor) => {
  if (!circle || circle.type !== 'circle') return circle;
  
  // Create a new circle with scaled radius
  return {
    ...circle,
    radius: circle.radius * scaleFactor
  };
};

/**
 * Gets the center of a circle
 * @param {Object} circle - The circle
 * @returns {Object} - The center point {x, y}
 */
export const getCircleCenter = (circle) => {
  if (!circle || circle.type !== 'circle') return { x: 0, y: 0 };
  
  if ('x' in circle && 'y' in circle && 'radius' in circle) {
    return {
      x: circle.x + circle.radius,
      y: circle.y + circle.radius
    };
  }
  
  // For circles with start/end points
  return {
    x: (circle.startX + circle.endX) / 2,
    y: (circle.startY + circle.endY) / 2
  };
};

/**
 * Toggle bold formatting for text
 * @param {Object} textShape - The text shape to update
 * @returns {Object} - The updated text shape
 */
export const toggleBold = (textShape) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    fontWeight: textShape.fontWeight === 'bold' ? 'normal' : 'bold'
  };
};

/**
 * Toggle italic formatting for text
 * @param {Object} textShape - The text shape to update
 * @returns {Object} - The updated text shape
 */
export const toggleItalic = (textShape) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    fontStyle: textShape.fontStyle === 'italic' ? 'normal' : 'italic'
  };
};

/**
 * Toggle underline formatting for text
 * @param {Object} textShape - The text shape to update
 * @returns {Object} - The updated text shape
 */
export const toggleUnderline = (textShape) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    textDecoration: textShape.textDecoration === 'underline' ? 'none' : 'underline'
  };
};

/**
 * Change text color
 * @param {Object} textShape - The text shape to update
 * @param {string} color - The new color
 * @returns {Object} - The updated text shape
 */
export const setTextColor = (textShape, color) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    color
  };
};

/**
 * Update multiple text styles at once
 * @param {Object} textShape - The text shape to update
 * @param {Object} styles - Object containing style properties to update
 * @returns {Object} - The updated text shape
 */
export const updateTextStyle = (textShape, styles) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    ...styles
  };
}; 