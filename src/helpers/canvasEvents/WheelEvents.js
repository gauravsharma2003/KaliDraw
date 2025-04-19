import { getCanvasCoordinates } from '../canvasUtils/';

/**
 * Handle wheel event for zooming centered on cursor
 */
export function handleWheel(e, ctx) {
  e.preventDefault();
  const { canvasRef, zoomLevel, setZoomLevel, canvasOffset, setCanvasOffset } = ctx;
  if (!canvasRef.current) return;
  const rect = canvasRef.current.getBoundingClientRect();
  const cursorX = (e.clientX - rect.left) / zoomLevel;
  const cursorY = (e.clientY - rect.top) / zoomLevel;

  const zoomDirection = e.deltaY < 0 ? 1 : -1;
  const zoomFactor = 0.05;
  const newZoom = Math.min(Math.max(zoomLevel + zoomDirection * zoomFactor, 0.1), 5);

  if (newZoom !== zoomLevel) {
    const newOffsetX = canvasOffset.x - (cursorX * (newZoom - zoomLevel));
    const newOffsetY = canvasOffset.y - (cursorY * (newZoom - zoomLevel));
    setZoomLevel(newZoom);
    setCanvasOffset({ x: newOffsetX, y: newOffsetY });
  }
} 