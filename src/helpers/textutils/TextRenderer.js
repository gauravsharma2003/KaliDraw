import DirectTextInput from '../DirectTextInput';
import { DRAWING_COLOR } from '../drawingTools';

/**
 * Draws the active text input with proper styling on the canvas.
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {string} textInput - Current text being typed
 * @param {Object} textPosition - Position and dimensions of text box
 * @param {Object} originalShapePos - Reference to original shape when editing
 * @param {boolean} isEditingText - Whether we're editing existing text or creating new
 * @param {number} zoomLevel - Current zoom level of the canvas
 * @param {Object} canvasOffset - Current offset of the canvas view
 */
export function drawActiveText(
  ctx,
  textInput,
  textPosition,
  originalShapePos,
  isEditingText,
  zoomLevel,
  canvasOffset
) {
  if (!textPosition) return;
  
  // Setup rendering context with proper transforms
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  // Get styling options from original shape if editing, or use defaults
  const styleOpts = {
    fontSize: isEditingText && originalShapePos.current?.fontSize ? originalShapePos.current.fontSize : 16,
    fontWeight: isEditingText && originalShapePos.current?.fontWeight ? originalShapePos.current.fontWeight : 'normal',
    fontStyle: isEditingText && originalShapePos.current?.fontStyle ? originalShapePos.current.fontStyle : 'normal',
    textDecoration: isEditingText && originalShapePos.current?.textDecoration ? originalShapePos.current.textDecoration : 'none',
    align: isEditingText && originalShapePos.current?.align ? originalShapePos.current.align : 'left'
  };
  
  // Get color from original shape if editing, or use default
  const color = isEditingText && originalShapePos.current?.color ? originalShapePos.current.color : DRAWING_COLOR;
  
  // Use DirectTextInput with consistent stable dimensions
  // Make sure the box doesn't constantly change size during typing
  const stableTextPosition = {
    x: textPosition.x,
    y: textPosition.y,
    // Ensure the box has a reasonable minimum size to avoid flicker
    width: Math.max(textPosition.width, 80),
    height: Math.max(textPosition.height, 40)
  };
  
  // Use DirectTextInput to render the active text with stable dimensions
  DirectTextInput.drawActiveText(ctx, textInput, stableTextPosition, color, styleOpts);
  
  // Restore rendering context
  ctx.restore();
}

/**
 * Draw a preview of text selection box while dragging
 * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
 * @param {Object} startPoint - Starting point of drag
 * @param {Object} currentPoint - Current point of drag
 * @param {number} zoomLevel - Current zoom level of canvas
 * @param {Object} canvasOffset - Current offset of canvas view
 */
export function drawTextSelectionPreview(
  ctx,
  startPoint,
  currentPoint,
  zoomLevel,
  canvasOffset
) {
  if (!startPoint || !currentPoint) return;
  
  // Setup rendering context
  ctx.save();
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(canvasOffset.x, canvasOffset.y);
  
  // Use dashed lines for selection box
  ctx.setLineDash([5, 3]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ff6600';
  
  // Calculate text box dimensions
  const textX = Math.min(startPoint.x, currentPoint.x);
  const textY = Math.min(startPoint.y, currentPoint.y);
  const textWidth = Math.max(Math.abs(currentPoint.x - startPoint.x), 10);
  const textHeight = Math.max(Math.abs(currentPoint.y - startPoint.y), 10);
  
  // Draw selection box
  ctx.strokeRect(textX, textY, textWidth, textHeight);
  
  // Reset dash pattern
  ctx.setLineDash([]);
  ctx.restore();
} 