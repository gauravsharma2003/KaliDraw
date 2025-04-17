// Drawing constants
export const DRAWING_COLOR = '#f54a00';
export const LINE_WIDTH = 2;

// Drawing functions
export const drawRectangle = (ctx, shape) => {
  ctx.save();
  ctx.strokeStyle = DRAWING_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
  ctx.restore();
};

export const drawCircle = (ctx, shape) => {
  ctx.save();
  ctx.strokeStyle = DRAWING_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.beginPath();
  ctx.arc(
    shape.x + shape.radius,
    shape.y + shape.radius,
    shape.radius,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.restore();
};

export const drawPencil = (ctx, shape) => {
  ctx.save();
  ctx.strokeStyle = DRAWING_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(shape.points[0].x, shape.points[0].y);
  for (let i = 1; i < shape.points.length; i++) {
    ctx.lineTo(shape.points[i].x, shape.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
};

// Shape creation functions
export const createRectangle = (start, end) => ({
  type: 'rectangle',
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y)
});

export const createCircle = (start, end) => {
  const radius = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  );
  return {
    type: 'circle',
    x: start.x,
    y: start.y,
    radius: radius
  };
};

export const createPencil = (points) => ({
  type: 'pencil',
  points: points
});

// Drawing handler functions
export const handleRectangleDrawing = (ctx, start, end, zoomLevel, canvasOffset) => {
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  const shape = createRectangle(start, end);
  drawRectangle(ctx, shape);
  
  ctx.restore();
  return shape;
};

export const handleCircleDrawing = (ctx, start, end, zoomLevel, canvasOffset) => {
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  const shape = createCircle(start, end);
  drawCircle(ctx, shape);
  
  ctx.restore();
  return shape;
};

export const handlePencilDrawing = (ctx, points, zoomLevel, canvasOffset) => {
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  const shape = createPencil(points);
  drawPencil(ctx, shape);
  
  ctx.restore();
  return shape;
}; 