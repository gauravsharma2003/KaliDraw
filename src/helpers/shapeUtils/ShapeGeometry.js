/**
 * Generate a unique ID for a shape
 * @returns {string} - A unique ID
 */
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9);
};

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