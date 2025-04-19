// Canvas event handling utilities
import { getCanvasCoordinates, clearCanvas, redrawShapes } from './canvasUtils/';
import { 
  isPointInShape, 
  resizeShape, 
  getShapeBoundingBox, 
  getShapeResizeHandles 
} from './shapeUtils';
import DirectTextInput from './DirectTextInput';
import { handleRectangleDrawing, handleCircleDrawing, handlePencilDrawing, drawPencil } from './drawingTools';
// import { setTextAlignment, setTextVerticalAlignment } from './textManipulationUtils';  // if needed

/**
 * Handle mouse down events on the canvas
 * @param {MouseEvent} e
 * @param {Object} ctx - Context object containing refs, state, and setters
 */
export function handleMouseDown(e, ctx) {
  const {
    canvasRef,
    activeTool,
    zoomLevel,
    canvasOffset,
    shapes,
    selectedShape,
    isTypingText,
    textPosition
  } = ctx;
  const {
    setCursorPosition,
    setIsDrawing,
    setStartPoint,
    setCurrentPoints,
    setSelectedShape,
    setIsDragging,
    setIsMovingShape,
    setDragStart,
    setResizeHandle,
    confirmTextInput
  } = ctx;
  const {
    originalRefs,
    setActiveTool
  } = ctx;
  if (!canvasRef.current) return;

  // Compute logical canvas point
  const point = getCanvasCoordinates(canvasRef.current, e, zoomLevel, canvasOffset);
  setCursorPosition(point);

  // Handle text input mode
  if (isTypingText) {
    // Check if click is inside the active text box
    const isInsideTextBox = textPosition && (
      point.x >= textPosition.x && 
      point.x <= textPosition.x + (textPosition.width || 100) && 
      point.y >= textPosition.y && 
      point.y <= textPosition.y + (textPosition.height || 40)
    );
    
    if (!isInsideTextBox) {
      // Clicked outside text box, confirm or cancel text input
      console.log("Clicked outside text box, confirming text input");
      confirmTextInput(true); // Pass true to switch to select mode
      
      // Stop event propagation to prevent creating a new shape
      e.stopPropagation();
      e.preventDefault();
    }
    return;
  }

  // Selection and manipulation
  if (activeTool === 'select') {
    // Record original positions
    originalRefs.originalCanvasOffset.current = { ...canvasOffset };
    originalRefs.resizeStartPoint.current = point;

    // Check for resize handle first
    if (selectedShape) {
      const handles = getShapeResizeHandles(selectedShape);
      for (const handle of handles) {
        if (
          Math.abs(point.x - handle.x) <= 6 &&
          Math.abs(point.y - handle.y) <= 6
        ) {
          setResizeHandle(handle.name);
          setIsDragging(true);
          setIsMovingShape(false);
          // Save shape for resizing
          originalRefs.originalShapePos.current = { ...selectedShape };
          return;
        }
      }
    }

    // Check for moving shape
    const clickedShape = shapes.find(sh => isPointInShape(point, sh));
    if (clickedShape) {
      // Only select the shape if we're actually clicking ON a shape
      // This allows our deselection logic in Canvas.jsx to work
      console.log("canvasEvents: Found clicked shape:", clickedShape.id);
      if (selectedShape && selectedShape.id === clickedShape.id) {
        console.log("canvasEvents: Already selected this shape");
      } else {
        console.log("canvasEvents: Selecting new shape");
        setSelectedShape(clickedShape);
      }
      originalRefs.originalShapePos.current = { ...clickedShape };
      setIsMovingShape(true);
      setIsDragging(true);
      setDragStart(point);
      return;
    }

    // Pan canvas
    // Remove this auto-deselection to let our custom logic handle it
    // setSelectedShape(null);
    console.log("canvasEvents: No shape clicked, letting Canvas.jsx handle deselection");
    setIsMovingShape(false);
    setIsDragging(true);
    setDragStart(point);
    return;
  }

  // If we're in text mode but want to start a new text box
  if (activeTool === 'text' && !isTypingText) {
    // Make sure we have a clean text input state
    ctx.setTextInput('');
    ctx.startTextInputAtPosition(point, ctx.setTextPosition, ctx.setIsTypingText, ctx.setTextInput);
    setIsDrawing(false);
    return;
  }
  
  // Only clear selection if not in text mode or not typing
  if (activeTool !== 'text' || !isTypingText) {
    // Switch away from selection: clear any selection
    setSelectedShape(null);
    setIsMovingShape(false);

    // Start drawing other shapes
    setIsDrawing(true);
    setStartPoint(point);
    if (activeTool === 'pencil') {
      setCurrentPoints([point]);
    }
  }
}

/**
 * Handle mouse move on the canvas, including preview, move, resize, and pan.
 */
export function handleMouseMove(e, ctx) {
  const {
    canvasRef,
    activeTool,
    zoomLevel,
    canvasOffset,
    shapes,
    selectedShape,
    resizeHandle,
    isDrawing,
    isDragging,
    isMovingShape,
    startPoint,
    currentPoints,
    originalRefs,
    dragStart
  } = ctx;
  const {
    setCursorPosition,
    setShapes,
    setSelectedShape,
    setCanvasOffset,
    setCurrentPoints,
    setUndoHistory
  } = ctx;
  
  if (!canvasRef.current) return;
  const canvas = canvasRef.current;
  const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);
  setCursorPosition(point);

  const ctx2d = canvas.getContext('2d');
  
  // Handle selection mode operations (resize, move, pan)
  if (activeTool === 'select' && isDragging) {
    // Handle resize
    if (selectedShape && resizeHandle && originalRefs.resizeStartPoint.current) {
      if (!originalRefs.originalShapePos.current.resizing) {
        setUndoHistory(prev => [...prev, [...shapes]]);
        originalRefs.originalShapePos.current.resizing = true;
      }
      const updated = resizeShape(
        selectedShape,
        resizeHandle,
        point,
        originalRefs.resizeStartPoint.current
      );
      setShapes(prev => prev.map(s => (s.id === selectedShape.id ? updated : s)));
      setSelectedShape(updated);
      return;
    }
    
    // Handle move shape
    if (isMovingShape && selectedShape) {
      const original = originalRefs.originalShapePos.current;
      if (!original) return;
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      let updated;
      if (selectedShape.type === 'pencil') {
        updated = {
          ...selectedShape,
          points: original.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
        };
      } else {
        updated = { ...selectedShape, x: original.x + dx, y: original.y + dy };
      }
      setShapes(prev => prev.map(s => (s.id === selectedShape.id ? updated : s)));
      setSelectedShape(updated);
      return;
    }
    
    // Handle pan canvas
    if (!isMovingShape) {
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      const newOffsetX = originalRefs.originalCanvasOffset.current.x + dx;
      const newOffsetY = originalRefs.originalCanvasOffset.current.y + dy;
      setCanvasOffset({ x: newOffsetX, y: newOffsetY });
      return;
    }
  }
  
  // ============================================
  // DRAWING PREVIEW - Handle live shape drawing
  // ============================================
  
  if (isDrawing && startPoint) {
    console.log("Drawing preview:", activeTool, "from", startPoint, "to", point);
    
    // Clear canvas and redraw existing shapes
    clearCanvas(canvas);
    redrawShapes(ctx2d, shapes, zoomLevel, canvasOffset);
    
    // Set up transformations for drawing preview
    ctx2d.save();
    ctx2d.scale(zoomLevel, zoomLevel);
    ctx2d.translate(canvasOffset.x, canvasOffset.y);
    
    // Draw the preview based on the active tool
    switch (activeTool) {
      case 'rectangle':
        // Draw rectangle preview with bold styling
        const x = Math.min(startPoint.x, point.x);
        const y = Math.min(startPoint.y, point.y);
        const width = Math.abs(point.x - startPoint.x);
        const height = Math.abs(point.y - startPoint.y);
        
        // Use a bold, visible style
        ctx2d.lineWidth = 3;
        ctx2d.strokeStyle = '#ff3300';
        
        // Draw the rectangle
        ctx2d.strokeRect(x, y, width, height);
        break;
        
      case 'circle':
        // Draw circle preview
        const dx = point.x - startPoint.x;
        const dy = point.y - startPoint.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        
        // Use a bold, visible style
        ctx2d.lineWidth = 3;
        ctx2d.strokeStyle = '#ff3300';
        ctx2d.beginPath();
        ctx2d.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
        ctx2d.stroke();
        break;
        
      case 'pencil':
        // Draw pencil preview
        const pts = [...currentPoints, point];
        setCurrentPoints(pts);
        
        // Use a bold, visible style
        ctx2d.lineWidth = 3;
        ctx2d.strokeStyle = '#ff3300';
        ctx2d.beginPath();
        ctx2d.moveTo(pts[0].x, pts[0].y);
        
        for (let i = 1; i < pts.length; i++) {
          ctx2d.lineTo(pts[i].x, pts[i].y);
        }
        
        ctx2d.stroke();
        break;
        
      case 'text':
        // Draw text selection rectangle preview
        const textX = Math.min(startPoint.x, point.x);
        const textY = Math.min(startPoint.y, point.y);
        const textWidth = Math.max(Math.abs(point.x - startPoint.x), 10);
        const textHeight = Math.max(Math.abs(point.y - startPoint.y), 10);
        
        // Use a dashed style for text selection
        ctx2d.lineWidth = 2;
        ctx2d.strokeStyle = '#333333';
        ctx2d.setLineDash([5, 3]);
        ctx2d.strokeRect(textX, textY, textWidth, textHeight);
        ctx2d.setLineDash([]);
        break;
    }
    
    // Restore the context
    ctx2d.restore();
  }
}

/**
 * Handle mouse up on the canvas, finalizing draws or resetting selection.
 */
export function handleMouseUp(e, ctx) {
  const {
    canvasRef,
    activeTool,
    zoomLevel,
    canvasOffset,
    shapes,
    startPoint,
    currentPoints
  } = ctx;
  const {
    setIsDrawing,
    setIsDragging,
    setResizeHandle,
    setIsMovingShape,
    setCurrentPoints,
    setShapes,
    setSelectedShape,
    setUndoHistory,
    setActiveTool,
    setStartPoint
  } = ctx;
  if (!canvasRef.current) return;

  setIsDrawing(false);
  setIsDragging(false);
  setResizeHandle(null);
  setIsMovingShape(false);

  const point = getCanvasCoordinates(canvasRef.current, e, zoomLevel, canvasOffset);
  const ctx2d = canvasRef.current.getContext('2d');
  let newShape = null;

  if (activeTool === 'pencil') {
    if (currentPoints.length < 1) {
      setCurrentPoints([]);
      return;
    }
    newShape = handlePencilDrawing(ctx2d, [...currentPoints, point], zoomLevel, canvasOffset);
    setCurrentPoints([]);
  } else if (activeTool === 'rectangle') {
    newShape = handleRectangleDrawing(ctx2d, startPoint, point, zoomLevel, canvasOffset);
  } else if (activeTool === 'circle') {
    newShape = handleCircleDrawing(ctx2d, startPoint, point, zoomLevel, canvasOffset);
  } else if (activeTool === 'text') {
    const x = Math.min(startPoint.x, point.x);
    const y = Math.min(startPoint.y, point.y);
    const width = Math.max(Math.abs(point.x - startPoint.x), 100);
    const height = Math.max(Math.abs(point.y - startPoint.y), 40);
    ctx.setTextPosition({ x, y, width, height });
    ctx.setIsTypingText(true);
    setStartPoint(null);
    return;
  }

  if (newShape) {
    // Assign a unique ID if not already present
    if (!newShape.id) {
      newShape.id = Date.now() + Math.random().toString(36).substr(2, 9);
    }
    console.log("Adding new shape:", newShape.type, newShape.id);
    
    // Store undo history
    setUndoHistory(prev => [...prev, [...shapes]]);
    
    // Add the new shape to existing shapes
    setShapes(prev => {
      const newShapes = [...prev, newShape];
      console.log("New shapes array length:", newShapes.length);
      return newShapes;
    });
    
    // Immediately select the new shape and switch to select mode
    setSelectedShape(newShape);
    setActiveTool('select');
  } else {
    console.log("No new shape created");
  }

  setStartPoint(null);
}

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

/**
 * Handle double click for text editing.
 */
export const handleDoubleClick = (e, ctx) => {
  const {
    canvasRef,
    zoomLevel,
    canvasOffset,
    selectedShape,
    shapes,
    setShapes,
    setSelectedShape,
    setActiveTool,
    textPosition,
    handleEditTextClick,
  } = ctx;

  if (!canvasRef.current) return;

  const rect = canvasRef.current.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoomLevel - canvasOffset.x;
  const y = (e.clientY - rect.top) / zoomLevel - canvasOffset.y;

  // If a text shape is selected, enable text editing
  if (selectedShape && selectedShape.type === 'text') {
    console.log('Double-clicked on text shape for editing');
    handleEditTextClick();
    return;
  }

  // Find if we clicked on a text shape
  const clickedShape = shapes.find(shape => {
    if (shape.type === 'text') {
      return (
        x >= shape.x &&
        x <= shape.x + shape.width &&
        y >= shape.y &&
        y <= shape.y + shape.height
      );
    }
    return false;
  });

  if (clickedShape) {
    console.log('Found text shape to edit on double-click');
    setSelectedShape(clickedShape);
    setActiveTool('text');
    // Allow time for selectedShape to update
    setTimeout(() => {
      handleEditTextClick();
    }, 0);
  }
};

/**
 * Handle keydown events for deletion, undo, and cycling tools.
 */
export function handleKeyDown(e, ctx) {
  const {
    selectedShape,
    setShapes,
    setSelectedShape,
    setUndoHistory,
    undoHistory,
    shapes,
    isTypingText,
    handleTextInput,
    confirmTextInput,
    setActiveTool
  } = ctx;

  // If in text input mode, let the text handler manage it
  if (isTypingText) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      confirmTextInput(true); // Pass true to switch to select mode
      return true;
    }
    
    // Let the dedicated text input handler manage it
    return;
  }

  // Delete selected shape with Delete or Backspace
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShape) {
    e.preventDefault();
    setUndoHistory(prev => [...prev, shapes]);
    setShapes(prev => prev.filter(shape => shape.id !== selectedShape.id));
    setSelectedShape(null);
  }

  // Handle undo with Ctrl+Z
  if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (undoHistory && undoHistory.length > 0) {
      const previousState = undoHistory[undoHistory.length - 1];
      const newHistory = undoHistory.slice(0, -1);
      setUndoHistory(newHistory);
      setShapes(previousState);
      setSelectedShape(null);
    }
  }

  // Space bar cycles tools - NOTE: This does not modify the shapes array at all
  if (e.key === ' ' && !isTypingText) {
    e.preventDefault();
    const tools = ['select', 'rectangle', 'circle', 'pencil', 'text'];
    const idx = tools.indexOf(activeTool);
    const next = tools[(idx + 1) % tools.length];
    setActiveTool(next);
    // We don't modify shapes here, just change the tool
  }
} 