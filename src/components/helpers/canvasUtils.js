export const getCanvasCoordinates = (canvas, event, zoomLevel, canvasOffset) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / zoomLevel - canvasOffset.x;
  const y = (event.clientY - rect.top) / zoomLevel - canvasOffset.y;
  return { x, y };
};

export const clearCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export const redrawShapes = (ctx, shapes, zoomLevel, canvasOffset) => {
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  shapes.forEach(shape => {
    switch (shape.type) {
      case 'rectangle':
        ctx.strokeStyle = '#f54a00';
        ctx.lineWidth = 2;
        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        break;
      case 'circle':
        ctx.strokeStyle = '#f54a00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(shape.x + shape.radius, shape.y + shape.radius, shape.radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'pencil':
        ctx.strokeStyle = '#f54a00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        shape.points.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        break;
      case 'text':
        ctx.font = '16px Inter';
        ctx.fillStyle = '#f54a00';
        ctx.fillText(shape.text, shape.x, shape.y);
        break;
    }
  });
  
  ctx.restore();
};

export const setupCanvas = (canvas) => {
  const resizeCanvas = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  return () => window.removeEventListener('resize', resizeCanvas);
}; 