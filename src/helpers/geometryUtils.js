// Geometry utility functions for calculating shape bounds

/**
 * Calculates the bounding box for a given shape.
 * Supports rectangle, text, circle, and pencil shapes.
 * @param {Object} shape - The shape object
 * @returns {{x: number, y: number, width: number, height: number}} bounding box
 */
export function getShapeBoundingBox(shape) {
  if (!shape) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  switch (shape.type) {
    case 'rectangle':
    case 'text':
      // Top-left with explicit width/height
      return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };

    case 'circle':
      // Assume shape.x,y is center or top-left? If createCircle uses top-left+radius, adjust accordingly
      // Here we assume x,y is top-left of bounding box
      return { x: shape.x, y: shape.y, width: shape.radius * 2, height: shape.radius * 2 };

    case 'pencil':
      // Compute min/max over all points
      if (shape.points && shape.points.length > 0) {
        let minX = shape.points[0].x;
        let minY = shape.points[0].y;
        let maxX = shape.points[0].x;
        let maxY = shape.points[0].y;
        shape.points.forEach(pt => {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
          maxY = Math.max(maxY, pt.y);
        });
        return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
      }
      break;

    default:
      break;
  }

  // Fallback to explicit properties
  return {
    x: shape.x || 0,
    y: shape.y || 0,
    width: shape.width || 0,
    height: shape.height || 0
  };
} 