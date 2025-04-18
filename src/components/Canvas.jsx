import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as drawingTools from '../helpers/drawingTools';
import {
  drawRectangle,
  drawCircle,
  drawPencil,
  createRectangle,
  createCircle,
  createPencil,
  createText,
  handleRectangleDrawing,
  handleCircleDrawing,
  handlePencilDrawing,
  handleTextDrawing
} from '../helpers/drawingTools';
import { getCanvasCoordinates, clearCanvas, redrawShapes, setupCanvas } from '../helpers/canvasUtils';
import { isPointInShape, getResizeHandle, resizeShape, getShapeBoundingBox, getShapeResizeHandles, getCircleCenter, setTextAlignment, setTextVerticalAlignment, updateTextProperties, toggleBold, toggleItalic, toggleUnderline, setTextColor, updateTextStyle } from '../helpers/shapeManipulation';
import { getCursorType, getCursorPosition, formatCursorPosition } from '../helpers/CursorHelper';
import ZoomControls from '../helpers/ZoomControls';
import DirectTextInput from '../helpers/DirectTextInput';
import { 
  Plus, 
  Minus, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Edit,
  Bold,
  Italic,
  Underline,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

const DRAWING_COLOR = '#f54a00';
const SELECTION_COLOR = '#0095ff';

// Helper function to draw resize handles
const drawHandle = (ctx, x, y) => {
  const HANDLE_SIZE = 8;
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#7e73ff';
  ctx.lineWidth = 1;
  
  // Fill and stroke to create white square with blue border
  ctx.fillRect(x - HANDLE_SIZE/2, y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(x - HANDLE_SIZE/2, y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
};

function Canvas({ activeTool, setActiveTool }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [undoHistory, setUndoHistory] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [textPosition, setTextPosition] = useState(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingShape, setIsMovingShape] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  
  // Store original positions to prevent jitter
  const originalShapePos = useRef(null);
  const originalCanvasOffset = useRef(null);
  const resizeStartPoint = useRef(null);

  // Direct text editing state
  const [isTypingText, setIsTypingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);

  // Add touch gesture states
  const [touchPoints, setTouchPoints] = useState([]);
  const lastTouchDistance = useRef(null);
  const lastTouchCenter = useRef(null);
  const isTouchGesture = useRef(false);

  // New state for text toolbar
  const [showTextToolbar, setShowTextToolbar] = useState(false);
  const [textToolbarPosition, setTextToolbarPosition] = useState({ x: 0, y: 0 });

  // Add animation frame update for cursor blinking when typing
  useEffect(() => {
    if (!isTypingText) return;
    
    // Set up animation frame for cursor blinking
    let animationFrameId;
    
    const updateCursor = () => {
      // Force a re-render to update the blinking cursor
      setShapes(prev => [...prev]);
      animationFrameId = requestAnimationFrame(updateCursor);
    };
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(updateCursor);
    
    // Clean up
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isTypingText]);

  // Define mouse handlers first so we can use them in touch handlers
  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    // Get accurate canvas coordinates accounting for zoom and offset
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);
    setCursorPosition(point);
    
    // If we're currently typing and click somewhere else, confirm the text
    if (isTypingText) {
      confirmTextInput();
      
      // Don't continue with the current click if we just confirmed text
      // This prevents unintended actions immediately after confirming text
      return;
    }

    // Rest of the function for clicking shapes, etc.
    console.log('Mouse down', { activeTool, point, canvasOffset, zoomLevel });

    if (activeTool === 'select') {
      // Store original positions to prevent jitter
      if (selectedShape) {
        originalShapePos.current = { ...selectedShape };
      }
      originalCanvasOffset.current = { ...canvasOffset };
      resizeStartPoint.current = point;
      
      // Always check for resize handles first if a shape is selected
      if (selectedShape) {
        const box = getShapeBoundingBox(selectedShape);
        const HANDLE_SIZE = 12; // Slightly larger hit area than visual size

        // Check if clicking on any handle
        const handles = [
          // Corner handles
          { name: 'topLeft', x: box.x, y: box.y },
          { name: 'topRight', x: box.x + box.width, y: box.y },
          { name: 'bottomLeft', x: box.x, y: box.y + box.height },
          { name: 'bottomRight', x: box.x + box.width, y: box.y + box.height },
          
          // Middle handles on each side (external only)
          { name: 'topCenter', x: box.x + box.width/2, y: box.y },
          { name: 'middleRight', x: box.x + box.width, y: box.y + box.height/2 },
          { name: 'bottomCenter', x: box.x + box.width/2, y: box.y + box.height },
          { name: 'middleLeft', x: box.x, y: box.y + box.height/2 }
        ];

        for (const handle of handles) {
          if (
            Math.abs(point.x - handle.x) <= HANDLE_SIZE/2 &&
            Math.abs(point.y - handle.y) <= HANDLE_SIZE/2
          ) {
            setResizeHandle(handle.name);
            setIsDragging(true);
            setIsMovingShape(false);
            return;
          }
        }
      }
      
      // Then check if clicking on any shape
      const clickedShape = shapes.find(shape => isPointInShape(point, shape));
      
      if (clickedShape) {
        // Clicked inside a shape - select it and prepare to move it
        setSelectedShape(clickedShape);
        originalShapePos.current = { ...clickedShape };
        
        setIsMovingShape(true);
        setIsDragging(true);
        setDragStart(point);
      } else {
        // Clicked on empty space - pan the canvas
        setSelectedShape(null);
        setIsMovingShape(false);
        setIsDragging(true);
        setDragStart(point);
      }
      return;
    } else {
      // If switching to drawing mode, deselect any selected shape
      setSelectedShape(null);
      setIsMovingShape(false);
    }

    // For text tool, start input at click location
    if (activeTool === 'text') {
      setStartPoint(point);
      setIsDrawing(true);
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);
    if (activeTool === 'pencil') {
      setCurrentPoints([point]);
    }
  };

  // Start text input at a specific position
  const startTextInputAtPosition = (position) => {
    // Store exact cursor position without adjustments
    setTextPosition(position);
    setIsTypingText(true);
    setTextInput('');
    
    console.log('Starting text input at position:', position);
  };

  // Handle text input from keyboard
  const handleTextInput = (e) => {
    if (!isTypingText) return;
    
    // Use the DirectTextInput component to handle key input
    if (e.key === 'Escape') {
      // If editing an existing text, restore it
      if (isEditingText && originalShapePos.current) {
        setShapes(prev => [...prev, originalShapePos.current]);
      }
      
      setIsTypingText(false);
      setIsEditingText(false);
      setTextInput('');
      setTextPosition(null);
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      confirmTextInput();
      return;
    }
    
    // Handle other key inputs with our helper
    DirectTextInput.handleKeyInput(e, textInput, setTextInput);
  };

  // Confirm text input and create a text shape
  const confirmTextInput = () => {
    if (textInput.trim() && textPosition) {
      setUndoHistory(prev => [...prev, [...shapes]]);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      // Recalculate dimensions based on current text
      const dims = DirectTextInput.calculateTextDimensions(ctx, textInput);
      console.log('Creating text at position:', textPosition.x, textPosition.y, 'with dims:', dims);
      const newTextShape = {
        ...createText(textInput, textPosition.x, textPosition.y, dims.width, dims.height, 16, DRAWING_COLOR)
      };
      setShapes(prev => [...prev, newTextShape]);
      setSelectedShape(newTextShape);
      setActiveTool('select');
    }
    setIsTypingText(false);
    setTextInput('');
    setTextPosition(null);
  };
  
  // Handle edit text click function for double-clicking text
  const handleEditTextClick = () => {
    if (!selectedShape || selectedShape.type !== 'text') return;
    
    setTextPosition({
      x: selectedShape.x,
      y: selectedShape.y
    });
    setTextInput(selectedShape.text);
    setIsTypingText(true);
    setIsEditingText(true);
    
    // Store original shape for restoration if needed
    originalShapePos.current = { ...selectedShape };
    
    // Delete the original text shape while editing
    setShapes(prev => prev.filter(shape => shape !== selectedShape));
  };

  // Show text toolbar when text is selected
  useEffect(() => {
    if (selectedShape && selectedShape.type === 'text') {
      const box = getShapeBoundingBox(selectedShape);
      setTextToolbarPosition({
        x: box.x + box.width / 2,
        y: box.y - 40 // Position above the text
      });
      setShowTextToolbar(true);
    } else {
      setShowTextToolbar(false);
    }
  }, [selectedShape]);

  // Focus textarea when editing text
  useEffect(() => {
    if (isEditingText) {
      const textarea = document.getElementById('text-editor');
      if (textarea) {
        textarea.focus();
      }
    }
  }, [isEditingText]);

  // Handle double-click to edit text
  const handleDoubleClick = (e) => {
    if (activeTool !== 'select') return;
    
    const canvas = canvasRef.current;
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);
    
    // Check if clicking on text shape
    const textShape = shapes.find(shape => 
      shape.type === 'text' && isPointInShape(point, shape)
    );
    
    if (textShape) {
      setSelectedShape(textShape);
      handleEditTextClick();
    }
  };

  // Handle text alignment change
  const handleTextAlign = (alignment) => {
    if (!selectedShape || selectedShape.type !== 'text') return;
    
    // Save to undo history
    setUndoHistory(prev => [...prev, [...shapes]]);
    
    // Update text alignment
    const updatedShape = setTextAlignment(selectedShape, alignment);
    
    // Update shapes array
    setShapes(prev => prev.map(shape => 
      shape === selectedShape ? updatedShape : shape
    ));
    
    // Update selected shape
    setSelectedShape(updatedShape);
  };

  // Handle vertical alignment change
  const handleVerticalAlign = (alignment) => {
    if (!selectedShape || selectedShape.type !== 'text') return;
    
    // Save to undo history
    setUndoHistory(prev => [...prev, [...shapes]]);
    
    // Update vertical alignment
    const updatedShape = setTextVerticalAlignment(selectedShape, alignment);
    
    // Update shapes array
    setShapes(prev => prev.map(shape => 
      shape === selectedShape ? updatedShape : shape
    ));
    
    // Update selected shape
    setSelectedShape(updatedShape);
  };

  // Handle font size change
  const handleFontSizeChange = (increase) => {
    if (!selectedShape || selectedShape.type !== 'text') return;
    
    // Save to undo history
    setUndoHistory(prev => [...prev, [...shapes]]);
    
    // Calculate new font size (min 8, max 72)
    const newSize = increase ? 
      Math.min(selectedShape.fontSize + 2, 72) : 
      Math.max(selectedShape.fontSize - 2, 8);
    
    // Update font size
    const updatedShape = updateTextProperties(selectedShape, { fontSize: newSize });
    
    // Update shapes array
    setShapes(prev => prev.map(shape => 
      shape === selectedShape ? updatedShape : shape
    ));
    
    // Update selected shape
    setSelectedShape(updatedShape);
  };

  // Handle text style toggle (bold, italic, underline)
  const handleTextStyleToggle = (styleType) => {
    if (!selectedShape || selectedShape.type !== 'text') return;
    
    // Save to undo history
    setUndoHistory(prev => [...prev, [...shapes]]);
    
    let updatedShape;
    
    // Update the style based on the type
    switch (styleType) {
      case 'bold':
        updatedShape = toggleBold(selectedShape);
        break;
      case 'italic':
        updatedShape = toggleItalic(selectedShape);
        break;
      case 'underline':
        updatedShape = toggleUnderline(selectedShape);
        break;
      default:
        return;
    }
    
    // Update shapes array
    setShapes(prev => prev.map(shape => 
      shape === selectedShape ? updatedShape : shape
    ));
    
    // Update selected shape
    setSelectedShape(updatedShape);
  };

  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);
    setCursorPosition(point);
    
    if (!isDrawing && !isDragging) return;
    
    const ctx = canvas.getContext('2d');

    if (activeTool === 'select' && isDragging) {
      if (selectedShape && resizeHandle && resizeStartPoint.current) {
        // Save state before first resize
        if (!originalShapePos.current.resizing) {
          setUndoHistory(prev => [...prev, [...shapes]]);
          originalShapePos.current.resizing = true;
        }
        
        // Resizing shape with handle - use fixed starting point to avoid jitter
        console.log('Resizing with handle:', resizeHandle);
        
        // Use the improved resizeShape function from shapeManipulation.js
        let updatedShape = resizeShape(
          selectedShape, 
          resizeHandle, 
          point, 
          resizeStartPoint.current
        );
        
        // Update shapes list
        setShapes(prev => prev.map(shape => 
          shape === selectedShape ? updatedShape : shape
        ));
        
        setSelectedShape(updatedShape);
        return;
      }
      
      if (isMovingShape && selectedShape) {
        // Moving a selected shape - use original position to avoid jitter
        if (!originalShapePos.current) return;
        
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        
        let updatedShape = { ...selectedShape };
        
        // Update position based on shape type
        if (selectedShape.type === 'pencil') {
          // Move all points in the pencil
          updatedShape.points = selectedShape.points.map(p => ({
            x: originalShapePos.current.points ? 
              p.x + dx : p.x,
            y: originalShapePos.current.points ? 
              p.y + dy : p.y
          }));
        } else {
          // For rectangles, circles, and text, just update x and y
          updatedShape.x = originalShapePos.current.x + dx;
          updatedShape.y = originalShapePos.current.y + dy;
        }
        
        // Update shapes list
        setShapes(prev => prev.map(shape => 
          shape === selectedShape ? updatedShape : shape
        ));
        
        setSelectedShape(updatedShape);
        return;
      }
      
      // Handle canvas panning
      if (!isMovingShape) {
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        
        // Calculate new offset based on original position and zoom
        const newOffsetX = originalCanvasOffset.current.x + dx; 
        const newOffsetY = originalCanvasOffset.current.y + dy;
        
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
        return;
      }
    }

    if (activeTool === 'text' && isDrawing) {
      clearCanvas(canvas);
      redrawShapes(ctx, shapes, zoomLevel, canvasOffset);
      const x = Math.min(startPoint.x, point.x);
      const y = Math.min(startPoint.y, point.y);
      const width = Math.max(Math.abs(point.x - startPoint.x), 10);
      const height = Math.max(Math.abs(point.y - startPoint.y), 10);
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.setLineDash([4,2]);
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
      return;
    }

    if (!isDrawing) return;
    
    // Ensure we have a valid start point
    if (!startPoint) {
      console.warn('No start point for drawing');
      return;
    }
    
    console.log('Drawing preview', { 
      activeTool, 
      start: startPoint, 
      end: point, 
      zoomLevel, 
      offset: canvasOffset 
    });

    // Clear and redraw all existing shapes
    clearCanvas(canvas);
    redrawShapes(ctx, shapes, zoomLevel, canvasOffset);

    // Draw the current shape being created
    if (activeTool === 'pencil') {
      setCurrentPoints(prev => [...prev, point]);
      const previewShape = { type: 'pencil', points: [...currentPoints, point], color: DRAWING_COLOR };
      drawPencil(ctx, previewShape.points, previewShape.color);
    } else {
      // Get the appropriate drawing handler based on active tool
      let drawHandler;
      switch (activeTool) {
        case 'rectangle':
          drawHandler = handleRectangleDrawing;
          break;
        case 'circle':
          drawHandler = handleCircleDrawing;
          break;
        default:
          drawHandler = null;
      }
      
      if (drawHandler) {
        try {
          // Make sure end point is valid
          const endPoint = point || { x: startPoint.x + 10, y: startPoint.y + 10 };
          drawHandler(ctx, startPoint, endPoint, zoomLevel, canvasOffset);
        } catch (error) {
          console.error('Error in drawing handler:', error);
        }
      }
    }
  }, [shapes, selectedShape, zoomLevel, canvasOffset, isDrawing, isDragging, startPoint, currentPoints, activeTool]);

  const handleMouseUp = (e) => {
    if (!canvasRef.current) return;
    
    console.log('Mouse up', { activeTool, isDrawing, isDragging });
    
    // Reset stored original positions
    originalShapePos.current = null;
    originalCanvasOffset.current = null;
    resizeStartPoint.current = null;
    
    if (activeTool === 'select') {
      setIsDragging(false);
      setResizeHandle(null);
      setIsMovingShape(false);
      return;
    }

    if (!isDrawing) return;

    // Save state before adding new shape
    setUndoHistory(prev => [...prev, [...shapes]]);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);

    let newShape;
    
    if (activeTool === 'pencil') {
      // Ensure we have at least 2 points for a pencil stroke
      if (currentPoints.length < 1) {
        setIsDrawing(false);
        setCurrentPoints([]);
        return;
      }
      
      newShape = handlePencilDrawing(ctx, [...currentPoints, point], zoomLevel, canvasOffset);
      console.log('Adding pencil shape with points:', newShape.points.length);
      
      if (newShape && newShape.points && newShape.points.length > 0) {
        setShapes(prev => [...prev, newShape]);
      }
      
      setCurrentPoints([]);
    } else {
      // Get the appropriate drawing handler based on active tool
      let drawHandler;
      switch (activeTool) {
        case 'rectangle':
          drawHandler = handleRectangleDrawing;
          break;
        case 'circle':
          drawHandler = handleCircleDrawing;
          break;
        default:
          drawHandler = null;
      }
      
      if (drawHandler && startPoint) {
        // Make sure we have a valid end point
        const endPoint = point || { x: startPoint.x + 10, y: startPoint.y + 10 };
        newShape = drawHandler(ctx, startPoint, endPoint, zoomLevel, canvasOffset);
        
        console.log('Created shape:', newShape);
        
        // Only add the shape if it's valid
        if (newShape) {
          setShapes(prevShapes => {
            const updatedShapes = [...prevShapes, newShape];
            console.log('Updated shapes array:', updatedShapes.length);
            return updatedShapes;
          });
        }
      }
    }

    if (newShape) {
      setSelectedShape(newShape);
      if (setActiveTool) {
        setActiveTool('select');
      }
    }

    if (activeTool === 'text' && isDrawing) {
      const endPoint = point;
      const x = Math.min(startPoint.x, endPoint.x);
      const y = Math.min(startPoint.y, endPoint.y);
      const width = Math.max(Math.abs(endPoint.x - startPoint.x), 10);
      const height = Math.max(Math.abs(endPoint.y - startPoint.y), 10);
      setTextPosition({ x, y, width, height });
      setIsTypingText(true);
      setIsDrawing(false);
      setStartPoint(null);
      return;
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  // Handle zooming with mouse wheel
  const handleWheel = (e) => {
    // Prevent default to avoid page scrolling
    e.preventDefault();
    
    // Get the cursor position relative to the canvas
    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left) / zoomLevel;
    const cursorY = (e.clientY - rect.top) / zoomLevel;
    
    // Determine zoom direction (in or out)
    const zoomDirection = e.deltaY < 0 ? 1 : -1;
    
    // Calculate new zoom level
    const zoomFactor = 0.05; // How much to zoom per scroll
    const newZoomLevel = Math.min(Math.max(zoomLevel + (zoomDirection * zoomFactor), 0.1), 5);
    
    // Adjust canvas offset to zoom centered on cursor
    if (newZoomLevel !== zoomLevel) {
      const newOffsetX = canvasOffset.x - (cursorX * (newZoomLevel - zoomLevel));
      const newOffsetY = canvasOffset.y - (cursorY * (newZoomLevel - zoomLevel));
      
      setZoomLevel(newZoomLevel);
      setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    }
  };

  // Setup canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const cleanup = setupCanvas(canvasRef.current);
    
    console.log('Canvas initialized', {
      width: canvasRef.current.width,
      height: canvasRef.current.height
    });
    
    return cleanup;
  }, []);
  
  // Add wheel event for zooming with trackpad
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, canvasOffset]);
  
  // Add keyboard listener for deletion and undo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle direct text input when in text mode
      if (isTypingText) {
        handleTextInput(e);
        e.preventDefault(); // Prevent default browser behavior
        return;
      }
      
      // Skip if we're typing text
      if (isTypingText) {
        return;
      }
      
      // Delete key to remove selected shape
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShape) {
        // Save current state to history before deleting
        setUndoHistory(prev => [...prev, [...shapes]]);
        
        setShapes(prev => prev.filter(shape => shape !== selectedShape));
        setSelectedShape(null);
        return;
      }
      
      // Ctrl+Z or Command+Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      
      // Space to cycle through tools
      if (e.key === ' ' && !isTypingText) {
        e.preventDefault();
        // Cycle through tools with spacebar
        const tools = ['select', 'rectangle', 'circle', 'pencil', 'text'];
        const currentIndex = tools.indexOf(activeTool);
        const nextIndex = (currentIndex + 1) % tools.length;
        setActiveTool(tools[nextIndex]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape, shapes, undoHistory, isTypingText, activeTool, isEditingText, textInput]);

  // Handle undo action
  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    
    const previousState = undoHistory[undoHistory.length - 1];
    setShapes([...previousState]);
    setUndoHistory(prev => prev.slice(0, -1));
    
    // Clear selection since the shape might no longer exist
    setSelectedShape(null);
  };

  // Draw text on canvas
  const drawText = (ctx, shape) => {
    if (!shape || !shape.text) return;
    
    // Use the imported drawText function directly
    drawingTools.drawText(ctx, shape);
  };

  // Redraw shapes when they change
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Debug the shapes array
    console.log('Redrawing shapes:', shapes.length);
    
    clearCanvas(canvas);
    
    // Apply transformations for all drawing
    ctx.save();
    ctx.scale(zoomLevel, zoomLevel);
    ctx.translate(canvasOffset.x, canvasOffset.y);
    
    // Draw all shapes
    shapes.forEach((shape, index) => {
      if (!shape) {
        console.warn('Undefined shape at index', index);
        return;
      }
      
      console.log('Drawing shape:', shape.type, index, 'color:', shape.color);
      
      switch (shape.type) {
        case 'rectangle':
          drawRectangle(ctx, shape.x, shape.y, shape.width, shape.height, shape.color);
          break;
        case 'circle':
          drawCircle(ctx, shape.x, shape.y, shape.radius, shape.color);
          break;
        case 'pencil':
          if (shape.points && shape.points.length > 1) {
            drawPencil(ctx, shape.points, shape.color);
          } else {
            console.warn('Invalid pencil shape:', shape);
          }
          break;
        case 'text':
          // For text shapes, we draw the text but NOT the handles here
          // Just draw the text itself - handles are drawn separately
          const isSelected = shape === selectedShape;
          // Don't include selection handles when drawing text via drawText
          if (!isSelected) {
            drawText(ctx, shape);
          } else {
            // Just use the imported draw text function for selected text 
            // without selection handles
            drawingTools.drawText(ctx, shape);
          }
          break;
        default:
          console.warn('Unknown shape type:', shape.type);
      }
    });
    
    // Draw the text being typed directly on canvas
    if (isTypingText && textPosition) {
      console.log('Drawing active text at:', textPosition);
      
      // Use our helper to draw the active text with styling
      const textStyleOptions = {
        fontSize: isEditingText && originalShapePos.current ? originalShapePos.current.fontSize : 16,
        fontWeight: isEditingText && originalShapePos.current ? originalShapePos.current.fontWeight : 'normal',
        fontStyle: isEditingText && originalShapePos.current ? originalShapePos.current.fontStyle : 'normal',
        textDecoration: isEditingText && originalShapePos.current ? originalShapePos.current.textDecoration : 'none',
        align: isEditingText && originalShapePos.current ? originalShapePos.current.align : 'left'
      };
      
      const textColor = isEditingText && originalShapePos.current ? originalShapePos.current.color : DRAWING_COLOR;
      DirectTextInput.drawActiveText(ctx, textInput, textPosition, textColor, textStyleOptions);
    }
    
    // Draw selection rectangle and handles if a shape is selected
    if (selectedShape) {
      const HANDLE_SIZE = 8;
      const box = getShapeBoundingBox(selectedShape);
      
      // Draw selection rectangle around the object with dashed border
      ctx.strokeStyle = '#7e73ff'; // Purple outline
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      
      // Draw the selection indicator (same for all shapes)
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      
      ctx.setLineDash([]);
      
      // Draw only the corner and edge handles (no internal handles)
      const handles = [
        // Corner handles
        { name: 'topLeft', x: box.x, y: box.y },
        { name: 'topRight', x: box.x + box.width, y: box.y },
        { name: 'bottomLeft', x: box.x, y: box.y + box.height },
        { name: 'bottomRight', x: box.x + box.width, y: box.y + box.height },
        
        // Middle handles on each side (external only)
        { name: 'topCenter', x: box.x + box.width/2, y: box.y },
        { name: 'middleRight', x: box.x + box.width, y: box.y + box.height/2 },
        { name: 'bottomCenter', x: box.x + box.width/2, y: box.y + box.height },
        { name: 'middleLeft', x: box.x, y: box.y + box.height/2 }
      ];
      
      // Draw all handles
      handles.forEach(handle => {
        drawHandle(ctx, handle.x, handle.y);
      });
    }
    
    ctx.restore();
  }, [shapes, selectedShape, zoomLevel, canvasOffset, isTypingText, textInput, textPosition]);

  // Update getCanvasCoordinates import to ensure it's working correctly
  useEffect(() => {
    // Add logging to check getCanvasCoordinates function
    if (canvasRef.current) {
      const testEvent = { clientX: 100, clientY: 100 };
      const coords = getCanvasCoordinates(canvasRef.current, testEvent, zoomLevel, canvasOffset);
      console.log('Test coordinates:', coords, 'with zoom:', zoomLevel, 'and offset:', canvasOffset);
    }
  }, [zoomLevel, canvasOffset]);

  return (
    <div 
      className="relative w-full h-full overflow-hidden" 
      tabIndex={0} 
      onKeyDown={(e) => {
        // The useEffect handles all keyboard events now
      }}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: getCursorType(activeTool, selectedShape, resizeHandle, isTypingText) }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full bg-white dark:bg-zinc-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      
      <ZoomControls zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
      
      {/* Status bar */}
      <div className="absolute bottom-4 left-4 text-xs bg-black/10 text-white px-2 py-1 rounded">
        {formatCursorPosition(cursorPosition)} | Zoom: {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
}

export default Canvas;
