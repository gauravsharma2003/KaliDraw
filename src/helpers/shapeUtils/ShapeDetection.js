import { getCircleCenter } from './ShapeGeometry';

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