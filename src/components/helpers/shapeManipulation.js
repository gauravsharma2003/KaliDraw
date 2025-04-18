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
  const HANDLE_SIZE = 12; // Increased handle size for easier grabbing
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
        topLeft: { x: shape.x, y: shape.y },
        topRight: { x: shape.x + shape.radius * 2, y: shape.y },
        bottomLeft: { x: shape.x, y: shape.y + shape.radius * 2 },
        bottomRight: { x: shape.x + shape.radius * 2, y: shape.y + shape.radius * 2 }
      };
      break;
    case 'text':
      // For text, create handles at all four corners of the bounding box
      handlePositions = {
        topLeft: { x: shape.x - 50, y: shape.y - 20 },
        topRight: { x: shape.x + 50, y: shape.y - 20 },
        bottomLeft: { x: shape.x - 50, y: shape.y + 20 },
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
        topLeft: { x: minX, y: minY },
        topRight: { x: maxX, y: minY },
        bottomLeft: { x: minX, y: maxY },
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
      // For circle, calculate radius based on handle position
      switch (handle) {
        case 'topLeft':
          return {
            ...shape,
            radius: Math.max(10, Math.sqrt(
              Math.pow(shape.x + shape.radius - point.x, 2) +
              Math.pow(shape.y + shape.radius - point.y, 2)
            ))
          };
        case 'topRight':
          return {
            ...shape,
            radius: Math.max(10, Math.sqrt(
              Math.pow(shape.x + shape.radius - point.x, 2) +
              Math.pow(shape.y + shape.radius - point.y, 2)
            ))
          };
        case 'bottomLeft':
          return {
            ...shape,
            radius: Math.max(10, Math.sqrt(
              Math.pow(shape.x + shape.radius - point.x, 2) +
              Math.pow(shape.y + shape.radius - point.y, 2)
            ))
          };
        case 'bottomRight':
          return {
            ...shape,
            radius: Math.max(10, Math.sqrt(
              Math.pow(shape.x + shape.radius - point.x, 2) +
              Math.pow(shape.y + shape.radius - point.y, 2)
            ))
          };
        default:
          return shape;
      }
    case 'text':
      // For text, we'll implement a simple scaling factor
      // that adjusts the text box size
      const textWidth = 100; // Default width of text box (from -50 to +50)
      const textHeight = 40; // Default height of text box (from -20 to +20)
      
      // Calculate new text position and scale
      switch (handle) {
        case 'topLeft':
        case 'topRight':
        case 'bottomLeft':
        case 'bottomRight':
          return {
            ...shape,
            // Just update position for now (text scaling would require more complex changes)
            x: Math.min(point.x + 50, point.x - 50),
            y: Math.min(point.y + 20, point.y - 20)
          };
        default:
          return shape;
      }
    case 'pencil':
      // For pencil lines, we can't easily resize them as they're paths
      // We could implement a scaling factor for the whole path
      // But for now, we'll just leave it as is
      return shape;
    default:
      return shape;
  }
}; 