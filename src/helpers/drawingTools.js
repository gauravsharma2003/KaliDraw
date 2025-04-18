// Drawing constants
export const DRAWING_COLOR = '#f54a00';
export const LINE_WIDTH = 2;

// Drawing functions
export const drawRectangle = (ctx, x, y, width, height, color = DRAWING_COLOR) => {
  // For debugging
  console.log('Drawing rectangle with:', { x, y, width, height, color });
  
  // Skip invalid rectangles
  if (typeof x !== 'number' || typeof y !== 'number' || 
      typeof width !== 'number' || typeof height !== 'number') {
    console.warn('Invalid rectangle properties:', { x, y, width, height });
    return;
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  
  // Ensure the rectangle is visible by making sure it has a minimum size
  const drawWidth = Math.max(width, 1);
  const drawHeight = Math.max(height, 1);
  
  // Draw the rectangle
  ctx.strokeRect(x, y, drawWidth, drawHeight);
  
  ctx.restore();
};

export const drawCircle = (ctx, x, y, radius, color = DRAWING_COLOR) => {
  // For debugging
  console.log('Drawing circle with:', { x, y, radius, color });
  
  // Skip invalid circles
  if (typeof x !== 'number' || typeof y !== 'number' || 
      typeof radius !== 'number') {
    console.warn('Invalid circle properties:', { x, y, radius });
    return;
  }
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  
  // Ensure minimum radius for visibility
  const drawRadius = Math.max(radius, 1);
  
  ctx.beginPath();
  // Draw the arc with the correct center coordinates
  // Note: x,y is the top-left corner of the circle's bounding box
  // Center is at (x + radius, y + radius)
  ctx.arc(
    x + drawRadius,
    y + drawRadius,
    drawRadius,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  
  ctx.restore();
};

export const drawPencil = (ctx, points, color = DRAWING_COLOR) => {
  if (!points || points.length < 2) return;
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.restore();
};

export const drawText = (ctx, shape) => {
  if (!shape || !shape.text) return;
  
  // Save context state
  ctx.save();
  
  // Set font style based on properties
  const fontSize = shape.fontSize || 16;
  const fontFamily = shape.fontFamily || 'Arial';
  const fontStyle = shape.fontStyle || 'normal';
  const fontWeight = shape.fontWeight || 'normal';
  const textDecoration = shape.textDecoration || 'none';
  
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = shape.color || '#f54a00';
  
  // Get the bounding box for the text
  const box = {
    x: shape.x,
    y: shape.y,
    width: shape.width || 150,
    height: shape.height || 40
  };
  
  // Split text by newlines
  const lines = shape.text.split('\n');
  const lineHeight = fontSize * 1.2;
  
  // Calculate vertical alignment starting position
  let yPos;
  const textHeight = lines.length * lineHeight;
  
  switch (shape.verticalAlign || 'middle') {
    case 'top':
      yPos = box.y + (shape.textPadding?.top || 10);
      break;
    case 'bottom':
      yPos = box.y + box.height - textHeight + (shape.textPadding?.top || 10);
      break;
    case 'middle':
    default:
      yPos = box.y + (box.height - textHeight) / 2 + (shape.textPadding?.top || 10);
      break;
  }
  
  // Draw each line of text with proper alignment
  lines.forEach((line, index) => {
    let xPos;
    const lineY = yPos + (index * lineHeight);
    
    // Calculate horizontal alignment
    switch (shape.align || 'left') {
      case 'center':
        xPos = box.x + box.width / 2;
        ctx.textAlign = 'center';
        break;
      case 'right':
        xPos = box.x + box.width - (shape.textPadding?.right || 10);
        ctx.textAlign = 'right';
        break;
      case 'left':
      default:
        xPos = box.x + (shape.textPadding?.left || 10);
        ctx.textAlign = 'left';
        break;
    }
    
    // Draw the text
    ctx.fillText(line, xPos, lineY);
    
    // Add underline if needed
    if (textDecoration === 'underline') {
      const metrics = ctx.measureText(line);
      const lineWidth = metrics.width;
      
      // Calculate underline position based on alignment
      let underlineX;
      switch (shape.align || 'left') {
        case 'center':
          underlineX = xPos - lineWidth / 2;
          break;
        case 'right':
          underlineX = xPos - lineWidth;
          break;
        case 'left':
        default:
          underlineX = xPos;
          break;
      }
      
      ctx.strokeStyle = shape.color || '#f54a00';
      ctx.lineWidth = fontSize / 15; // Scale underline thickness with font size
      ctx.beginPath();
      ctx.moveTo(underlineX, lineY + fontSize / 10);
      ctx.lineTo(underlineX + lineWidth, lineY + fontSize / 10);
      ctx.stroke();
    }
  });
  
  // Restore context state
  ctx.restore();
};

// Shape creation functions
export const createRectangle = (start, end) => {
  // Ensure we have valid coordinates
  if (!start || !end) {
    console.warn('Invalid coordinates for rectangle:', { start, end });
    return {
      type: 'rectangle',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      color: DRAWING_COLOR
    };
  }
  
  // Calculate rectangle properties
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  
  // Ensure minimum dimensions for visibility
  const rectWidth = Math.max(width, 1);
  const rectHeight = Math.max(height, 1);
  
  console.log('Creating rectangle:', { x, y, width: rectWidth, height: rectHeight });
  
  return {
    type: 'rectangle',
    x,
    y,
    width: rectWidth,
    height: rectHeight,
    color: DRAWING_COLOR
  };
};

export const createCircle = (start, end) => {
  // Ensure we have valid coordinates
  if (!start || !end) {
    console.warn('Invalid coordinates for circle:', { start, end });
    return {
      type: 'circle',
      x: 0,
      y: 0,
      radius: 10,
      color: DRAWING_COLOR
    };
  }

  // Calculate radius based on distance between start and end points
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const radius = Math.sqrt(dx * dx + dy * dy);
  
  // Ensure minimum radius for visibility
  const drawRadius = Math.max(radius, 1);
  
  // The x,y coordinates are the top-left corner of the circle's bounding box
  // We need to adjust from the start point (which is treated as the center) to the top-left
  const x = start.x - drawRadius;
  const y = start.y - drawRadius;
  
  console.log('Creating circle:', { x, y, radius: drawRadius });
  
  return {
    type: 'circle',
    x: x,
    y: y,
    radius: drawRadius,
    color: DRAWING_COLOR
  };
};

export const createPencil = (points) => ({
  type: 'pencil',
  points: [...points], // Create a copy to avoid reference issues
  color: DRAWING_COLOR
});

export const createText = (text, x, y, width, height, fontSize = 16, color = DRAWING_COLOR) => {
  // Generate ID for the text shape
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  
  return {
    type: 'text',
    text: text || '',
    x,
    y,
    width,
    height,
    fontSize,
    color,
    align: 'left',
    verticalAlign: 'top',
    textPadding: {
      top: 5,
      left: 10
    },
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    id
  };
};

// Drawing handler functions
export const handleRectangleDrawing = (ctx, start, end, zoomLevel, canvasOffset) => {
  // Make sure we're working with valid coordinates
  if (!start || !end) return null;
  
  console.log('Rectangle drawing:', { start, end, zoomLevel, canvasOffset });
  
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  const shape = createRectangle(start, end);
  drawRectangle(ctx, shape.x, shape.y, shape.width, shape.height, shape.color);
  
  ctx.restore();
  return shape;
};

export const handleCircleDrawing = (ctx, start, end, zoomLevel, canvasOffset) => {
  // Make sure we're working with valid coordinates
  if (!start || !end) return null;
  
  console.log('Circle drawing:', { start, end, zoomLevel, canvasOffset });
  
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  // Create the circle shape based on start (center) and end points
  const shape = createCircle(start, end);
  
  // Draw the circle using the updated drawCircle function
  drawCircle(ctx, shape.x, shape.y, shape.radius, shape.color);
  
  ctx.restore();
  return shape;
};

export const handlePencilDrawing = (ctx, points, zoomLevel, canvasOffset) => {
  if (!points || points.length < 2) return { type: 'pencil', points: [], color: DRAWING_COLOR };
  
  console.log('Pencil drawing:', { points: [points[0], points[points.length-1]], zoomLevel, canvasOffset });
  
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  const shape = createPencil(points);
  drawPencil(ctx, shape.points, shape.color);
  
  ctx.restore();
  return shape;
};

// Update text drawing handler
export const handleTextDrawing = (ctx, text, position, fontSize, options, zoomLevel, canvasOffset) => {
  if (!position) return null;
  
  console.log('Text drawing:', { position, zoomLevel, canvasOffset });
  
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  const shape = createText(text, position.x, position.y, position.width, position.height, fontSize, options.color);
  drawText(ctx, shape);
  
  ctx.restore();
  return shape;
}; 