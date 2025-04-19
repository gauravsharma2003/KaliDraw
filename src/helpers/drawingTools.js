// Drawing constants
export const DRAWING_COLOR = '#f54a00';
export const LINE_WIDTH = 2;

import { createText as createTextUtil } from './shapeUtils';

// Drawing functions
export const drawRectangle = (ctx, x, y, width, height, color = DRAWING_COLOR) => {
  // Skip invalid rectangles
  if (typeof x !== 'number' || typeof y !== 'number' || 
      typeof width !== 'number' || typeof height !== 'number') {
    console.warn('Invalid rectangle properties:', { x, y, width, height });
    return;
  }

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  
  // Draw the rectangle
  ctx.strokeRect(x, y, width, height);
  
  ctx.restore();
};

export const drawCircle = (ctx, x, y, radius, color = DRAWING_COLOR) => {
  // Skip invalid circles
  if (typeof x !== 'number' || typeof y !== 'number' || 
      typeof radius !== 'number') {
    console.warn('Invalid circle properties:', { x, y, radius });
    return;
  }
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  
  ctx.beginPath();
  // Calculate center assuming x,y is top-left of bounding box
  ctx.arc(
    x + radius,
    y + radius,
    radius,
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
  
  // Use defaults if alignment properties aren't set
  const align = shape.align || 'center';
  const verticalAlign = shape.verticalAlign || 'middle';
  
  // Draw text container for debugging if needed
  // ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
  // ctx.strokeRect(box.x, box.y, box.width, box.height);
  
  // Split text by newlines
  const lines = shape.text.split('\n');
  
  // Check if the text will fit within the box at the current font size
  // If not, scale down the font size to fit
  const checkWidth = () => {
    let maxLineWidth = 0;
    for (const line of lines) {
      const metrics = ctx.measureText(line);
      maxLineWidth = Math.max(maxLineWidth, metrics.width);
    }
    
    // Include padding when checking if text fits
    const paddingX = 20; // Left and right padding combined
    return maxLineWidth + paddingX <= box.width;
  };
  
  // Adjust font size if text doesn't fit width
  let adjustedFontSize = fontSize;
  ctx.font = `${fontStyle} ${fontWeight} ${adjustedFontSize}px ${fontFamily}`;
  
  // Reduce font size until text fits within box width
  while (!checkWidth() && adjustedFontSize > 8) {
    adjustedFontSize--;
    ctx.font = `${fontStyle} ${fontWeight} ${adjustedFontSize}px ${fontFamily}`;
  }
  
  // Recalculate line height based on possibly adjusted font size
  const lineHeight = adjustedFontSize * 1.2;
  
  // Calculate if total text height fits in the box
  const totalTextHeight = lines.length * lineHeight;
  
  // Further reduce font size if height doesn't fit
  while (totalTextHeight > box.height && adjustedFontSize > 8) {
    adjustedFontSize--;
    ctx.font = `${fontStyle} ${fontWeight} ${adjustedFontSize}px ${fontFamily}`;
    const newLineHeight = adjustedFontSize * 1.2;
    const newTotalHeight = lines.length * newLineHeight;
    
    if (newTotalHeight <= box.height) {
      break;
    }
  }
  
  // Final line height based on adjusted font size
  const finalLineHeight = adjustedFontSize * 1.2;
  const finalTextHeight = lines.length * finalLineHeight;
  
  // Calculate vertical alignment starting position
  let yPos;
  const paddingTop = 5;
  const paddingBottom = 5;
  
  switch (verticalAlign) {
    case 'top':
      yPos = box.y + paddingTop;
      break;
    case 'bottom':
      yPos = box.y + box.height - finalTextHeight - paddingBottom;
      break;
    case 'middle':
    default:
      yPos = box.y + (box.height - finalTextHeight) / 2;
      break;
  }
  
  // Draw each line of text with proper alignment
  lines.forEach((line, index) => {
    let xPos;
    const lineY = yPos + (index * finalLineHeight);
    const paddingLeft = 10;
    const paddingRight = 10;
    
    // Calculate horizontal alignment
    switch (align) {
      case 'center':
        xPos = box.x + box.width / 2;
        ctx.textAlign = 'center';
        break;
      case 'right':
        xPos = box.x + box.width - paddingRight;
        ctx.textAlign = 'right';
        break;
      case 'left':
      default:
        xPos = box.x + paddingLeft;
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
      switch (align) {
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
      ctx.lineWidth = adjustedFontSize / 15; // Scale underline thickness with font size
      ctx.beginPath();
      ctx.moveTo(underlineX, lineY + adjustedFontSize * 0.8);
      ctx.lineTo(underlineX + lineWidth, lineY + adjustedFontSize * 0.8);
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
  
  // Commented out to reduce flooding during preview
  // console.log('Creating rectangle:', { x, y, width: rectWidth, height: rectHeight });
  
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
  // Use the utility function from shapeUtils
  return createTextUtil(text, x, y, fontSize, {
    color, 
    width, 
    height,
    align: 'center',
    verticalAlign: 'middle'
  });
};

// Drawing handler functions
export const handleRectangleDrawing = (ctx, start, end, zoomLevel, canvasOffset) => {
  // Make sure we're working with valid coordinates
  if (!start || !end) return null;
  
  // Commented out to reduce flooding during preview
  // console.log('Rectangle drawing:', { start, end, zoomLevel, canvasOffset });
  
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