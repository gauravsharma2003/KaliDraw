import DirectTextInput from './DirectTextInput';
import * as drawingTools from './drawingTools';
import { clearCanvas } from './canvasUtils/';
import { 
  getShapeBoundingBox,
  getShapeResizeHandles 
} from './shapeUtils';

const DRAWING_COLOR = '#f54a00'; // default for active text

/**
 * Draws all existing shapes and any active text input or selection handles.
 */
export const drawAll = (
  ctx,
  canvasRef,
  shapes,
  selectedShape,
  zoomLevel,
  canvasOffset,
  isTypingText,
  textInput,
  textPosition,
  isEditingText,
  originalShapePosRef
) => {
  if (!canvasRef.current) {
    console.warn("drawAll: Canvas ref is null");
    return;
  }
  
  const canvas = canvasRef.current;
  
  // Clear the canvas before redrawing
  clearCanvas(canvas);
  
  // Always draw all shapes first
  if (shapes && shapes.length > 0) {
    console.log("Drawing all shapes, count:", shapes.length, "ids:", shapes.map(s => s.id || 'no-id').join(','));
    
    // Draw shapes with proper transformation
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(canvasOffset.x, canvasOffset.y);
    
    // Draw each shape
    shapes.forEach((shape, idx) => {
      if (!shape) {
        console.warn("Undefined shape at index", idx);
        return;
      }
      
      try {
        switch (shape.type) {
          case 'rectangle':
            drawingTools.drawRectangle(ctx, shape.x, shape.y, shape.width, shape.height, shape.color);
            break;
          case 'circle':
            drawingTools.drawCircle(ctx, shape.x, shape.y, shape.radius, shape.color);
            break;
          case 'pencil':
            if (shape.points?.length > 1) {
              drawingTools.drawPencil(ctx, shape.points, shape.color);
            }
            break;
          case 'text':
            drawingTools.drawText(ctx, shape);
            break;
          default:
            console.warn('Unknown shape type:', shape.type);
        }
      } catch (error) {
        console.error("Error drawing shape:", error, shape);
      }
    });
    
    // Draw active text input overlay
    if (isTypingText && textPosition) {
      const styleOpts = {
        fontSize: isEditingText && originalShapePosRef.current?.fontSize ? originalShapePosRef.current.fontSize : 16,
        fontWeight: isEditingText && originalShapePosRef.current?.fontWeight ? originalShapePosRef.current.fontWeight : 'normal',
        fontStyle: isEditingText && originalShapePosRef.current?.fontStyle ? originalShapePosRef.current.fontStyle : 'normal',
        textDecoration: isEditingText && originalShapePosRef.current?.textDecoration ? originalShapePosRef.current.textDecoration : 'none',
        align: isEditingText && originalShapePosRef.current?.align ? originalShapePosRef.current.align : 'left'
      };
      const color = isEditingText && originalShapePosRef.current?.color ? originalShapePosRef.current.color : DRAWING_COLOR;
      DirectTextInput.drawActiveText(ctx, textInput, textPosition, color, styleOpts);
    }
    
    // Draw selection bounding box and handles
    if (selectedShape) {
      const box = getShapeBoundingBox(selectedShape);
      ctx.strokeStyle = '#7e73ff';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      ctx.setLineDash([]);
      
      // Draw resize handles
      const handles = getShapeResizeHandles(selectedShape);
      handles.forEach(handle => {
        ctx.fillStyle = '#7e73ff';
        ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(handle.x - 4, handle.y - 4, 8, 8);
      });
    }
    
    ctx.restore();
  } else {
    console.log("No shapes to draw");
  }
};

function drawSelectionIndicator(ctx, shape, zoomLevel, canvasOffset) {
  const box = getShapeBoundingBox(shape);
  ctx.strokeStyle = '#7e73ff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(box.x, box.y, box.width, box.height);
  ctx.setLineDash([]);
  // corner handles
  const half = 8 / 2;
  [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x, y: box.y + box.height },
    { x: box.x + box.width, y: box.y + box.height }
  ].forEach(({ x, y }) => {
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#7e73ff';
    ctx.lineWidth = 1;
    ctx.fillRect(x - half, y - half, 8, 8);
    ctx.strokeRect(x - half, y - half, 8, 8);
  });
}

function drawTextInputPreview(ctx, textInput, textPosition, isEditingText, zoomLevel, canvasOffset) {
  const styleOpts = {
    fontSize: isEditingText && originalShapePos.current?.fontSize ? originalShapePos.current.fontSize : 16,
    fontWeight: isEditingText && originalShapePos.current?.fontWeight ? originalShapePos.current.fontWeight : 'normal',
    fontStyle: isEditingText && originalShapePos.current?.fontStyle ? originalShapePos.current.fontStyle : 'normal',
    textDecoration: isEditingText && originalShapePos.current?.textDecoration ? originalShapePos.current.textDecoration : 'none',
    align: isEditingText && originalShapePos.current?.align ? originalShapePos.current.align : 'left'
  };
  const color = isEditingText && originalShapePos.current?.color ? originalShapePos.current.color : DRAWING_COLOR;
  DirectTextInput.drawActiveText(ctx, textInput, textPosition, color, styleOpts);
} 