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
  if (!shape) return { x: 0, y: 0, width: 0, height: 0 };
  
  if (shape.type === 'rectangle') {
    // For rectangles with explicit width/height
    if ('x' in shape && 'y' in shape && 'width' in shape && 'height' in shape) {
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height
      };
    }
    
    // For rectangles with start/end points
    const minX = Math.min(shape.startX, shape.endX);
    const maxX = Math.max(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxY = Math.max(shape.startY, shape.endY);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } else if (shape.type === 'circle') {
    // For circles with explicit center and radius
    if ('x' in shape && 'y' in shape && 'radius' in shape) {
      // Return a box that exactly contains the circle
      return {
        x: shape.x - shape.radius,
        y: shape.y - shape.radius,
        width: shape.radius * 2,
        height: shape.radius * 2
      };
    }
    
    // For circles with start/end points
    const centerX = (shape.startX + shape.endX) / 2;
    const centerY = (shape.startY + shape.endY) / 2;
    const radius = Math.sqrt(
      Math.pow(shape.endX - shape.startX, 2) + 
      Math.pow(shape.endY - shape.startY, 2)
    ) / 2;
    
    return {
      x: centerX - radius,
      y: centerY - radius,
      width: radius * 2,
      height: radius * 2
    };
  } else if (shape.type === 'triangle') {
    const minX = Math.min(
      shape.startX, 
      shape.endX, 
      shape.startX - (shape.endX - shape.startX)
    );
    const maxX = Math.max(
      shape.startX, 
      shape.endX, 
      shape.startX - (shape.endX - shape.startX)
    );
    const minY = Math.min(shape.startY, shape.endY);
    const maxY = Math.max(shape.startY, shape.endY);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } else if (shape.type === 'pencil' && shape.points && shape.points.length > 0) {
    let minX = shape.points[0].x;
    let maxX = shape.points[0].x;
    let minY = shape.points[0].y;
    let maxY = shape.points[0].y;
    
    for (let i = 1; i < shape.points.length; i++) {
      const point = shape.points[i];
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } else if (shape.type === 'text') {
    // Get text measurements based on fontSize and text content
    const fontSize = shape.fontSize || 16;
    const lineHeight = fontSize * 1.2;
    
    // Calculate text width (approximation based on average char width)
    // More accurate measurement would use canvas's measureText
    const avgCharWidth = fontSize * 0.6;
    
    // Split by newlines if text contains them
    const lines = (shape.text || '').split('\n');
    const longestLine = lines.reduce((max, line) => 
      Math.max(max, line.length), 0);
    
    // Calculate dimensions
    // If the shape has specified width/height, use those instead
    const textWidth = shape.width || (longestLine * avgCharWidth);
    const textHeight = shape.height || (lines.length * lineHeight);
    
    return {
      x: shape.x - textWidth / 2,
      y: shape.y - textHeight / 2,
      width: textWidth,
      height: textHeight
    };
  }
  
  return { x: 0, y: 0, width: 0, height: 0 };
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
  
  if (shape.type === 'rectangle') {
    // Handle rectangle resizing
    // Based on which handle is being dragged
    if ('x' in shape && 'y' in shape && 'width' in shape && 'height' in shape) {
      switch (handle) {
        case 'topLeft':
          resized.width += resized.x - point.x;
          resized.height += resized.y - point.y;
          resized.x = point.x;
          resized.y = point.y;
          break;
        case 'topCenter':
          resized.height += resized.y - point.y;
          resized.y = point.y;
          break;
        case 'topRight':
          resized.width = point.x - resized.x;
          resized.height += resized.y - point.y;
          resized.y = point.y;
          break;
        case 'middleLeft':
          resized.width += resized.x - point.x;
          resized.x = point.x;
          break;
        case 'middleRight':
          resized.width = point.x - resized.x;
          break;
        case 'bottomLeft':
          resized.width += resized.x - point.x;
          resized.height = point.y - resized.y;
          resized.x = point.x;
          break;
        case 'bottomCenter':
          resized.height = point.y - resized.y;
          break;
        case 'bottomRight':
          resized.width = point.x - resized.x;
          resized.height = point.y - resized.y;
          break;
      }
      
      // Ensure width/height are not negative
      if (resized.width < 0) {
        resized.x += resized.width;
        resized.width = Math.abs(resized.width);
      }
      
      if (resized.height < 0) {
        resized.y += resized.height;
        resized.height = Math.abs(resized.height);
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
  } else if (shape.type === 'text') {
    // Handle text resizing
    if ('x' in shape && 'y' in shape) {
      // Get the current bounding box
      const box = getShapeBoundingBox(shape);
      const originalWidth = box.width;
      const originalHeight = box.height;
      
      // Update dimensions based on handle
      switch (handle) {
        case 'topLeft':
          resized.width = originalWidth + (box.x - point.x);
          resized.height = originalHeight + (box.y - point.y);
          resized.x -= (point.x - box.x);
          resized.y -= (point.y - box.y);
          break;
        case 'topCenter':
          resized.height = originalHeight + (box.y - point.y);
          resized.y -= (point.y - box.y);
          break;
        case 'topRight':
          resized.width = point.x - box.x;
          resized.height = originalHeight + (box.y - point.y);
          resized.y -= (point.y - box.y);
          break;
        case 'middleLeft':
          resized.width = originalWidth + (box.x - point.x);
          resized.x -= (point.x - box.x);
          break;
        case 'middleRight':
          resized.width = point.x - box.x;
          break;
        case 'bottomLeft':
          resized.width = originalWidth + (box.x - point.x);
          resized.height = point.y - box.y;
          resized.x -= (point.x - box.x);
          break;
        case 'bottomCenter':
          resized.height = point.y - box.y;
          break;
        case 'bottomRight':
          resized.width = point.x - box.x;
          resized.height = point.y - box.y;
          break;
      }
      
      // Ensure minimum size
      resized.width = Math.max(resized.width, 10);
      resized.height = Math.max(resized.height, 10);
      
      // Optionally scale font size based on height change
      const heightRatio = resized.height / originalHeight;
      if (resized.fontSize) {
        resized.fontSize = Math.max(8, Math.round(resized.fontSize * heightRatio));
      }
    }
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
  return {
    x: textShape.x - textShape.width / 2,
    y: textShape.y - textShape.height / 2,
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