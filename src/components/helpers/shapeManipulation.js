export const isPointInShape = (point, shape) => {
  switch (shape.type) {
    case 'rectangle':
      return (
        point.x >= shape.x &&
        point.x <= shape.x + shape.width &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.height
      );
    case 'circle':
      const dx = point.x - (shape.x + shape.radius);
      const dy = point.y - (shape.y + shape.radius);
      return Math.sqrt(dx * dx + dy * dy) <= shape.radius;
    case 'triangle':
      // Simple bounding box check for triangle
      return (
        point.x >= shape.x &&
        point.x <= shape.x + shape.width &&
        point.y >= shape.y &&
        point.y <= shape.y + shape.height
      );
    case 'text':
      // Simple bounding box check for text
      return (
        point.x >= shape.x - 50 &&
        point.x <= shape.x + 50 &&
        point.y >= shape.y - 20 &&
        point.y <= shape.y + 20
      );
    case 'pencil':
      // Check if point is close to any point in the pencil line
      return shape.points.some(linePoint => {
        const dx = point.x - linePoint.x;
        const dy = point.y - linePoint.y;
        return Math.sqrt(dx * dx + dy * dy) <= 10; // 10px tolerance
      });
    default:
      return false;
  }
};

export const getResizeHandle = (point, shape) => {
  const HANDLE_SIZE = 10; // Increased handle size for easier grabbing
  let handlePositions;
  
  switch (shape.type) {
    case 'rectangle':
      handlePositions = {
        topLeft: { x: shape.x, y: shape.y },
        topRight: { x: shape.x + shape.width, y: shape.y },
        bottomLeft: { x: shape.x, y: shape.y + shape.height },
        bottomRight: { x: shape.x + shape.width, y: shape.y + shape.height }
      };
      break;
    case 'circle':
      handlePositions = {
        bottomRight: { x: shape.x + shape.radius * 2, y: shape.y + shape.radius * 2 }
      };
      break;
    case 'text':
      handlePositions = {
        bottomRight: { x: shape.x + 50, y: shape.y + 20 }
      };
      break;
    case 'pencil':
      // Find bounding box for pencil
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      shape.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
      
      handlePositions = {
        bottomRight: { x: maxX, y: maxY }
      };
      break;
    default:
      return null;
  }

  for (const [handle, pos] of Object.entries(handlePositions)) {
    if (
      point.x >= pos.x - HANDLE_SIZE &&
      point.x <= pos.x + HANDLE_SIZE &&
      point.y >= pos.y - HANDLE_SIZE &&
      point.y <= pos.y + HANDLE_SIZE
    ) {
      return handle;
    }
  }
  
  return null;
};

export const resizeShape = (shape, handle, point) => {
  console.log('Resizing shape', { shape, handle, point });
  
  switch (shape.type) {
    case 'rectangle':
      switch (handle) {
        case 'topLeft':
          return {
            ...shape,
            x: Math.min(point.x, shape.x + shape.width - 10),
            y: Math.min(point.y, shape.y + shape.height - 10),
            width: Math.max(10, shape.width - (point.x - shape.x)),
            height: Math.max(10, shape.height - (point.y - shape.y))
          };
        case 'topRight':
          return {
            ...shape,
            y: Math.min(point.y, shape.y + shape.height - 10),
            width: Math.max(10, point.x - shape.x),
            height: Math.max(10, shape.height - (point.y - shape.y))
          };
        case 'bottomLeft':
          return {
            ...shape,
            x: Math.min(point.x, shape.x + shape.width - 10),
            width: Math.max(10, shape.width - (point.x - shape.x)),
            height: Math.max(10, point.y - shape.y)
          };
        case 'bottomRight':
          return {
            ...shape,
            width: Math.max(10, point.x - shape.x),
            height: Math.max(10, point.y - shape.y)
          };
        default:
          return shape;
      }
    case 'circle':
      if (handle === 'bottomRight') {
        const dx = point.x - shape.x;
        const dy = point.y - shape.y;
        const newRadius = Math.max(5, Math.min(dx, dy) / 2);
        return {
          ...shape,
          radius: newRadius
        };
      }
      break;
    case 'text':
      if (handle === 'bottomRight') {
        // For text, we don't resize the actual text, just update its position
        return shape;
      }
      break;
    case 'pencil':
      if (handle === 'bottomRight') {
        // For pencil, we can't resize easily since it's a path
        // Just return the original shape
        return shape;
      }
      break;
  }
  return shape;
}; 