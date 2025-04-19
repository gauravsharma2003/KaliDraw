import React, { useState, useEffect, useRef } from 'react';
import ZoomControls from '../helpers/ZoomControls';
import { getCursorType, formatCursorPosition } from '../helpers/CursorHelper';
import { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, handleDoubleClick, handleKeyDown } from '../helpers/canvasEvents';
import { drawAll } from '../helpers/drawUtils';
import { setupCanvas, getCanvasCoordinates } from '../helpers/canvasUtils';
import { DRAWING_COLOR } from '../helpers/drawingTools';
import { handleClickDeselection, handleDocumentDeselection } from '../helpers/selectionUtils';

// Import from shapeUtils folder
import {
  isPointInShape,
  getShapeBoundingBox,
  getResizeHandle,
  getShapeResizeHandles
} from '../helpers/shapeUtils';

// Import from the textutils folder
import {
  drawActiveText,
  drawTextSelectionPreview,
  isClickOutsideTextArea,
  startTextInputAtPosition,
  handleTextInput as handleTextInputGlobal,
  updateTextDimensions,
  confirmTextInput as confirmTextInputGlobal,
  handleEditTextClick as handleEditTextClickGlobal
} from '../helpers/textutils';

function Canvas({ activeTool, setActiveTool }) {
  const canvasRef = useRef(null);
  const originalShapePos = useRef(null);
  const originalCanvasOffset = useRef(null);
  const resizeStartPoint = useRef(null);
  const userDeselected = useRef(false);
  const isHandlingMouseRelease = useRef(false);
  const prevShapesCountRef = useRef(0);

  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const [isTypingText, setIsTypingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);
  const [textPosition, setTextPosition] = useState(null);

  const [undoHistory, setUndoHistory] = useState([]);

  // Drawing and drag state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingShape, setIsMovingShape] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Define text handling functions at the top before they're used
  const handleTextInput = (e) => {
    handleTextInputGlobal(
      e,
      isTypingText,
      isEditingText,
      originalShapePos,
      textInput,
      setTextInput,
      setIsTypingText,
      setIsEditingText,
      setShapes
    );
    
    // If we're typing, update the text dimensions to fit the content
    if (isTypingText && textPosition && canvasRef.current) {
      updateTextDimensions(
        canvasRef,
        textInput,
        textPosition,
        setTextPosition
      );
    }
  };

  const confirmTextInput = (switchToSelectMode = false) => {
    confirmTextInputGlobal(
      canvasRef, 
      textInput, 
      textPosition, 
      shapes, 
      setShapes, 
      setSelectedShape, 
      setUndoHistory,
      setIsTypingText,
      setIsEditingText,
      setActiveTool
    );
    
    // Only switch to select mode if explicitly requested
    if (switchToSelectMode) {
      setActiveTool('select');
    }
  };

  const handleEditTextClick = () => {
    handleEditTextClickGlobal(
      selectedShape, 
      setTextPosition, 
      setTextInput, 
      setIsTypingText, 
      setIsEditingText, 
      originalShapePos, 
      setShapes
    );
  };

  const setSelectedShapeWithTracking = (shape) => {
    if (shape === null) {
      userDeselected.current = true;
      console.log("User explicitly deselected a shape");
    } else if (shape) {
      console.log(`User explicitly selected shape: ${shape.id}`);
      userDeselected.current = true;
    }
    setSelectedShape(shape);
  };

  const ctx = {
    canvasRef,
    activeTool,
    setActiveTool,
    shapes,
    setShapes,
    selectedShape,
    setSelectedShape: setSelectedShapeWithTracking,
    resizeHandle,
    setResizeHandle,
    zoomLevel,
    setZoomLevel,
    canvasOffset,
    setCanvasOffset,
    cursorPosition,
    setCursorPosition,
    isTypingText,
    setIsTypingText,
    textInput,
    setTextInput,
    isEditingText,
    setIsEditingText,
    textPosition,
    setTextPosition,
    undoHistory,
    setUndoHistory,
    isDrawing,
    setIsDrawing,
    startPoint,
    setStartPoint,
    currentPoints,
    setCurrentPoints,
    isDragging,
    setIsDragging,
    isMovingShape,
    setIsMovingShape,
    dragStart,
    setDragStart,
    originalRefs: { originalShapePos, originalCanvasOffset, resizeStartPoint },
    startTextInputAtPosition,
    handleTextInput,
    confirmTextInput,
    handleEditTextClick
  };

  const handleKeyDownWrapper = (e) => {
    // If Enter is pressed while typing text (and not with Shift key),
    // confirm the text and ensure it gets selected
    if (e.key === 'Enter' && !e.shiftKey && isTypingText) {
      e.preventDefault();
      // Confirm text and explicitly switch to select mode
      confirmTextInput(true);
      return;
    }
    
    // First try to handle text input
    const textHandled = handleTextInput(e);
    
    // If not handled by text input, pass to general key handler
    if (!textHandled) {
      handleKeyDown(e, ctx);
    }
  };

  // Setup canvas size and DPI
  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = setupCanvas(canvasRef.current);
    return cleanup;
  }, []);

  useEffect(() => {
    const context2d = canvasRef.current?.getContext('2d');
    if (context2d) {
      console.log("REDRAW TRIGGERED: shapes:", shapes.length, "selectedShape:", selectedShape?.id);
      drawAll(context2d, canvasRef, shapes, selectedShape, zoomLevel, canvasOffset, isTypingText, textInput, textPosition, isEditingText, originalShapePos);
    }
  }, [shapes, selectedShape, resizeHandle, zoomLevel, canvasOffset, isTypingText, textInput, textPosition, isEditingText]);

  useEffect(() => {
    console.log("Shapes changed:", shapes.length, shapes);
  }, [shapes]);

  useEffect(() => {
    // No need to reset shapes or other state when tool changes
    // We just need to update cursor and possibly clear any temporary interaction state
    if (isDrawing) {
      setIsDrawing(false);
    }
    
    // If we're editing text and switch tools, confirm the text first
    if (isTypingText && activeTool !== 'text') {
      confirmTextInput(true); // Set switchToSelectMode=true when changing tools
    }
    
    // If we switch to text tool, make sure text input is reset
    if (activeTool === 'text' && !isTypingText) {
      setTextInput('');
    }
    
    // Log tool change without affecting shapes array
    console.log("Tool changed to:", activeTool);
    
    // Only auto-select if not explicitly deselected and not handling mouse release
    if (activeTool === 'select' && shapes.length > 0 && !userDeselected.current && !isHandlingMouseRelease.current) {
      setSelectedShape(shapes[shapes.length - 1]);
    }
  }, [activeTool, isDrawing, setIsDrawing, isTypingText, shapes, setSelectedShape, setTextInput]);

  // Handle shape selection when shapes array changes
  useEffect(() => {
    if (shapes.length > 0 && !userDeselected.current && !isHandlingMouseRelease.current) {
      console.log("Auto-selecting shape after shapes array changed");
      setSelectedShape(shapes[shapes.length - 1]);
      
      // Don't switch to select mode if in text mode and actively typing
      if (!isTypingText || activeTool !== 'text') {
        setActiveTool('select');
      }
    } else if (userDeselected.current) {
      console.log("Not auto-selecting - user has made explicit selection/deselection");
    }
  }, [shapes, setActiveTool, activeTool, isTypingText]);

  // Add effect to reset the deselected flag when new shapes are added
  useEffect(() => {
    // Check if we added a new shape
    if (shapes.length > prevShapesCountRef.current) {
      console.log("New shape added - resetting deselection flag");
      userDeselected.current = false;
    }
    
    // Update our shape count tracker
    prevShapesCountRef.current = shapes.length;
  }, [shapes]);

  // Add mousedown handler that also checks for clicks outside text input
  const handleMouseDownWithTextCheck = (e) => {
    // Check if clicking outside text input area using the dedicated function
    if (isTypingText && textPosition && canvasRef.current) {
      if (isClickOutsideTextArea(e, canvasRef.current, textPosition, zoomLevel, canvasOffset, isTypingText)) {
        console.log("Click outside text area detected - confirming text and switching to select mode");
        
        // Store current text input to find the new shape after it's created
        const currentText = textInput;
        
        // Immediately switch to select mode before confirming text
        setActiveTool('select');
        
        // Confirm text and explicitly switch to select mode
        confirmTextInput(true);
        
        // Immediately process the click to handle selection/deselection
        const pointInCanvas = getCanvasCoordinates(canvasRef.current, e, zoomLevel, canvasOffset);
        
        // Find the most recently added text shape with our content
        const textShape = shapes.find(shape => 
          shape.type === 'text' && 
          shape.text === currentText
        );
        
        if (textShape) {
          // Select the text shape we just created
          setSelectedShape(textShape);
        } else {
          // Check if click is on any shape
          const clickedShape = shapes.find(shape => isPointInShape(pointInCanvas, shape));
          
          if (clickedShape) {
            // Select the clicked shape
            setSelectedShape(clickedShape);
          } else {
            // Deselect if clicked on empty space
            setSelectedShape(null);
          }
        }
        
        // Stop event propagation
        e.stopPropagation();
        e.preventDefault();
        return true;
      }
      
      // If we're inside the text area and typing, just continue editing
      if (activeTool === 'text') {
        e.stopPropagation();
        return false;
      }
    } 
    // If text tool is selected and not typing yet, start a new text at the clicked position
    else if (activeTool === 'text' && !isTypingText) {
      // Get cursor position
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoomLevel - canvasOffset.x;
      const y = (e.clientY - rect.top) / zoomLevel - canvasOffset.y;
      
      // Clear any previous text input
      setTextInput('');
      
      // Start new text input at cursor position
      startTextInputAtPosition(
        { x, y },
        setTextPosition,
        setIsTypingText,
        setTextInput
      );
      
      e.stopPropagation();
      return true;
    }
    // If we're using a tool other than select, clicking outside should switch to select
    else if (activeTool !== 'select' && activeTool !== 'text' && !isTypingText) {
      const pointInCanvas = getCanvasCoordinates(canvasRef.current, e, zoomLevel, canvasOffset);
      const clickedAnyShape = shapes.some(shape => isPointInShape(pointInCanvas, shape));
      
      // If we clicked on empty space, switch to select mode
      if (!clickedAnyShape && !isDrawing && !isDragging) {
        console.log("Clicked on empty space - switching to select mode");
        setActiveTool('select');
      }
    }
    
    // Otherwise, proceed with normal click handling
    handleClickDeselect(e);
    return true;
  };

  // Add a preview drawing function that properly handles text input
  const drawPreview = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Get current mouse position
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = cssX / zoomLevel - canvasOffset.x;
    const y = cssY / zoomLevel - canvasOffset.y;
    
    // Clear canvas and redraw existing shapes
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get context for drawing
    const context2d = canvas.getContext('2d');
    
    // Don't draw active text in the main drawAll call
    // We'll draw it separately to avoid double rendering
    const shouldDrawActiveText = !(activeTool === 'text' && isTypingText);
    drawAll(
      context2d, 
      canvasRef, 
      shapes, 
      selectedShape, 
      zoomLevel, 
      canvasOffset, 
      shouldDrawActiveText ? isTypingText : false, 
      shouldDrawActiveText ? textInput : '', 
      shouldDrawActiveText ? textPosition : null, 
      shouldDrawActiveText ? isEditingText : false, 
      originalShapePos
    );
    
    // If we're typing text, draw it after everything else to avoid double rendering
    if (activeTool === 'text' && isTypingText && textPosition) {
      // Use the dedicated function from textutils
      drawActiveText(
        ctx,
        textInput,
        textPosition,
        originalShapePos,
        isEditingText,
        zoomLevel,
        canvasOffset
      );
    }
    
    // Only draw shape preview if we're not typing text
    if (!isTypingText && startPoint) {
      // Draw preview shape with bold orange styling
      ctx.save();
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(canvasOffset.x, canvasOffset.y);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ff6600';
      
      switch(activeTool) {
        case 'rectangle':
          // Draw rectangle preview
          const rectX = Math.min(startPoint.x, x);
          const rectY = Math.min(startPoint.y, y);
          const width = Math.abs(x - startPoint.x);
          const height = Math.abs(y - startPoint.y);
          ctx.strokeRect(rectX, rectY, width, height);
          break;
          
        case 'circle':
          // Draw circle preview
          const dx = x - startPoint.x;
          const dy = y - startPoint.y;
          const radius = Math.sqrt(dx * dx + dy * dy);
          ctx.beginPath();
          ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
          
        case 'pencil':
          // Draw pencil preview
          if (currentPoints.length > 0) {
            ctx.beginPath();
            ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
            
            for (let i = 1; i < currentPoints.length; i++) {
              ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
            }
            
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          break;
          
        case 'text':
          // Use the dedicated text selection preview function
          drawTextSelectionPreview(
            ctx,
            startPoint,
            { x, y },
            zoomLevel,
            canvasOffset
          );
          break;
      }
      
      ctx.restore();
    }
  };

  // Add custom mouse move handler that handles text resizing and preview
  const handleMouseMoveWithPreview = (e) => {
    // First call the standard handler
    handleMouseMove(e, ctx);
    
    // Then draw the preview
    drawPreview(e);
  };

  // Create a new mousedown handler using our selection utility
  const handleClickDeselect = (e) => {
    console.log("Mouse down", new Date().toISOString());

    // If not in select mode, just use standard handling
    if (activeTool !== 'select') {
      handleMouseDown(e, ctx);
      return;
    }

    // Use the selection utility to handle deselection/selection
    const result = handleClickDeselection(e, ctx);
    
    if (result.deselected) {
      // We clicked outside any shape - create a context without selectedShape for panning
      const deselectedCtx = {
        ...ctx,
        selectedShape: null
      };
      
      // Ensure deselection is tracked
      userDeselected.current = true;
      
      // Call handleMouseDown with the modified context
      handleMouseDown(e, deselectedCtx);
    } 
    else if (result.selectedNew) {
      // We selected a new shape - set up for dragging
      console.log("Selected new shape:", result.newShape.id);
      
      // This is a deliberate user selection - prevent auto-selection override
      userDeselected.current = true;
      
      const updatedCtx = {
        ...ctx,
        selectedShape: result.newShape
      };
      
      // Store original position for potential dragging
      originalRefs.originalShapePos.current = { ...result.newShape };
      setIsMovingShape(true);
      setIsDragging(true);
      
      // Calculate drag start position
      const rect = canvasRef.current.getBoundingClientRect();
      const dragX = (e.clientX - rect.left) / zoomLevel - canvasOffset.x;
      const dragY = (e.clientY - rect.top) / zoomLevel - canvasOffset.y;
      setDragStart({ x: dragX, y: dragY });
      
      // Call handleMouseDown with the updated context
      handleMouseDown(e, updatedCtx);
    }
    else {
      // No change in selection - proceed with standard handling
      handleMouseDown(e, ctx);
    }
  };

  const handleMouseUpWithAutoSelect = (e) => {
    // Mark that we're handling a mouse release to prevent auto-selection
    isHandlingMouseRelease.current = true;
    
    // Process the mouse up event
    handleMouseUp(e, ctx);
    
    // Handle text mode specially - don't switch to select on mouse up
    if (activeTool === 'text') {
      isHandlingMouseRelease.current = false;
      return;
    }
    
    // For other tools, immediately switch to select tool
    setActiveTool('select');
    
    // Only select the last shape if:
    // 1. There are shapes
    // 2. We haven't explicitly deselected (clicked empty space)
    // 3. We haven't explicitly selected a different shape
    if (shapes.length > 0 && !userDeselected.current) {
      console.log("Auto-selecting last shape after mouse up");
      setSelectedShape(shapes[shapes.length - 1]);
    } else {
      console.log("Respecting user selection/deselection after mouse up");
    }
    
    // Reset the handling flag
    isHandlingMouseRelease.current = false;
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-white dark:bg-zinc-900"
      tabIndex={0}
      style={{ cursor: getCursorType(activeTool, selectedShape, resizeHandle, isTypingText) }}
      onKeyDown={handleKeyDownWrapper}
      onDoubleClick={(e) => handleDoubleClick(e, ctx)}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={handleMouseDownWithTextCheck}
        onMouseMove={handleMouseMoveWithPreview}
        onMouseUp={(e) => handleMouseUpWithAutoSelect(e)}
        onWheel={(e) => handleWheel(e, ctx)}
      />

      <ZoomControls zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />

      <div className="absolute bottom-4 left-4 text-xs bg-black/10 text-white px-2 py-1 rounded">
        {formatCursorPosition(cursorPosition)} | Zoom: {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
}

export default Canvas;
