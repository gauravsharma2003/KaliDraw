import React, { useState, useEffect, useRef } from 'react';
import {
  drawRectangle,
  drawCircle,
  drawPencil,
  handleRectangleDrawing,
  handleCircleDrawing,
  handlePencilDrawing
} from './helpers/drawingTools';
import { getCanvasCoordinates, clearCanvas, redrawShapes, setupCanvas } from './helpers/canvasUtils';
import { isPointInShape, getResizeHandle, resizeShape } from './helpers/shapeManipulation';
import ZoomControls from './helpers/ZoomControls';

function Canvas({ activeTool }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [shapes, setShapes] = useState([]);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [textInput, setTextInput] = useState('');
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
      const zoomFactor = 0.02; // How much to zoom per scroll - reduced from 0.05
      const newZoomLevel = Math.min(Math.max(zoomLevel + (zoomDirection * zoomFactor), 0.1), 5);
      
      // Adjust canvas offset to zoom centered on cursor
      if (newZoomLevel !== zoomLevel) {
        const newOffsetX = canvasOffset.x - (cursorX * (newZoomLevel - zoomLevel));
        const newOffsetY = canvasOffset.y - (cursorY * (newZoomLevel - zoomLevel));
        
        setZoomLevel(newZoomLevel);
        setCanvasOffset({ x: newOffsetX, y: newOffsetY });
      }
    };
    
    const canvas = canvasRef.current;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [zoomLevel, canvasOffset]);
  
  // Listen for delete key to remove selected shape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' && selectedShape) {
        setShapes(prev => prev.filter(shape => shape !== selectedShape));
        setSelectedShape(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShape]);

  // Get object bounding box for selection
  const getShapeBoundingBox = (shape) => {
    switch (shape.type) {
      case 'rectangle':
        return {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height
        };
      case 'circle':
        return {
          x: shape.x,
          y: shape.y,
          width: shape.radius * 2,
          height: shape.radius * 2
        };
      case 'text':
        return {
          x: shape.x - 50,
          y: shape.y - 20,
          width: 100,
          height: 40
        };
      case 'pencil':
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        shape.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
        
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      default:
        return { x: 0, y: 0, width: 0, height: 0 };
    }
  };

  // Redraw shapes when they change
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    clearCanvas(canvas);
    redrawShapes(ctx, shapes, zoomLevel, canvasOffset);
    
    // Draw selection rectangle and handles if a shape is selected
    if (selectedShape) {
      ctx.save();
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(canvasOffset.x, canvasOffset.y);
      
      const HANDLE_SIZE = 8;
      const box = getShapeBoundingBox(selectedShape);
      
      // Draw selection rectangle around the object with full border
      ctx.strokeStyle = '#7e73ff'; // Purple outline matching the image
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(
        box.x - 5, 
        box.y - 5, 
        box.width + 10, 
        box.height + 10
      );
      
      // Draw resize handles (white squares with blue border)
      const drawHandle = (x, y) => {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = '#7e73ff';
        ctx.lineWidth = 1;
        
        // Fill and stroke to create white square with blue border
        ctx.fillRect(x - HANDLE_SIZE/2, y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.strokeRect(x - HANDLE_SIZE/2, y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
      };
      
      // Top-left handle
      drawHandle(box.x - 5, box.y - 5);
      
      // Top-middle handle
      drawHandle(box.x + box.width/2, box.y - 5);
      
      // Top-right handle
      drawHandle(box.x + box.width + 5, box.y - 5);
      
      // Middle-left handle
      drawHandle(box.x - 5, box.y + box.height/2);
      
      // Middle-right handle
      drawHandle(box.x + box.width + 5, box.y + box.height/2);
      
      // Bottom-left handle
      drawHandle(box.x - 5, box.y + box.height + 5);
      
      // Bottom-middle handle
      drawHandle(box.x + box.width/2, box.y + box.height + 5);
      
      // Bottom-right handle
      drawHandle(box.x + box.width + 5, box.y + box.height + 5);
      
      ctx.restore();
    }
  }, [shapes, selectedShape, zoomLevel, canvasOffset]);

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);
    setCursorPosition(point);
    
    console.log('Mouse down', { activeTool, point });

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

        // Check each resize handle
        const handles = [
          { name: 'topLeft', x: box.x - 5, y: box.y - 5 },
          { name: 'topCenter', x: box.x + box.width/2, y: box.y - 5 },
          { name: 'topRight', x: box.x + box.width + 5, y: box.y - 5 },
          { name: 'middleLeft', x: box.x - 5, y: box.y + box.height/2 },
          { name: 'middleRight', x: box.x + box.width + 5, y: box.y + box.height/2 },
          { name: 'bottomLeft', x: box.x - 5, y: box.y + box.height + 5 },
          { name: 'bottomCenter', x: box.x + box.width/2, y: box.y + box.height + 5 },
          { name: 'bottomRight', x: box.x + box.width + 5, y: box.y + box.height + 5 }
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

    if (activeTool === 'text') {
      setTextPosition(point);
      return;
    }

    setIsDrawing(true);
    setStartPoint(point);
    if (activeTool === 'pencil') {
      setCurrentPoints([point]);
    }
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);
    setCursorPosition(point);
    
    if (!isDrawing && !isDragging) return;
    
    const ctx = canvas.getContext('2d');

    if (activeTool === 'select' && isDragging) {
      if (selectedShape && resizeHandle && resizeStartPoint.current) {
        // Resizing shape with handle - use fixed starting point to avoid jitter
        console.log('Resizing with handle:', resizeHandle);
        
        const box = getShapeBoundingBox(selectedShape);
        const dx = point.x - resizeStartPoint.current.x;
        const dy = point.y - resizeStartPoint.current.y;
        
        let updatedShape = { ...selectedShape };
        
        switch (selectedShape.type) {
          case 'rectangle':
            if (resizeHandle === 'topLeft') {
              updatedShape = {
                ...updatedShape,
                x: originalShapePos.current.x + dx,
                y: originalShapePos.current.y + dy,
                width: originalShapePos.current.width - dx,
                height: originalShapePos.current.height - dy
              };
            } else if (resizeHandle === 'topCenter') {
              updatedShape = {
                ...updatedShape,
                y: originalShapePos.current.y + dy,
                height: originalShapePos.current.height - dy
              };
            } else if (resizeHandle === 'topRight') {
              updatedShape = {
                ...updatedShape,
                y: originalShapePos.current.y + dy,
                width: originalShapePos.current.width + dx,
                height: originalShapePos.current.height - dy
              };
            } else if (resizeHandle === 'middleLeft') {
              updatedShape = {
                ...updatedShape,
                x: originalShapePos.current.x + dx,
                width: originalShapePos.current.width - dx
              };
            } else if (resizeHandle === 'middleRight') {
              updatedShape = {
                ...updatedShape,
                width: originalShapePos.current.width + dx
              };
            } else if (resizeHandle === 'bottomLeft') {
              updatedShape = {
                ...updatedShape,
                x: originalShapePos.current.x + dx,
                width: originalShapePos.current.width - dx,
                height: originalShapePos.current.height + dy
              };
            } else if (resizeHandle === 'bottomCenter') {
              updatedShape = {
                ...updatedShape,
                height: originalShapePos.current.height + dy
              };
            } else if (resizeHandle === 'bottomRight') {
              updatedShape = {
                ...updatedShape,
                width: originalShapePos.current.width + dx,
                height: originalShapePos.current.height + dy
              };
            }
            
            // Ensure minimum dimensions
            if (updatedShape.width < 10) {
              updatedShape.width = 10;
              updatedShape.x = originalShapePos.current.x + (originalShapePos.current.width - 10);
            }
            
            if (updatedShape.height < 10) {
              updatedShape.height = 10;
              updatedShape.y = originalShapePos.current.y + (originalShapePos.current.height - 10);
            }
            break;
            
          case 'circle':
            const centerX = originalShapePos.current.x + originalShapePos.current.radius;
            const centerY = originalShapePos.current.y + originalShapePos.current.radius;
            
            // Calculate distance from center to new point
            const distX = Math.abs(point.x - centerX);
            const distY = Math.abs(point.y - centerY);
            
            // Use the maximum distance for uniform scaling
            let newRadius = Math.max(distX, distY);
            
            // Ensure minimum radius
            newRadius = Math.max(newRadius, 10);
            
            updatedShape = {
              ...updatedShape,
              radius: newRadius
            };
            break;
            
          case 'text':
            // Simple movement for text
            if (resizeHandle.includes('bottom') || resizeHandle.includes('Right')) {
              // No resizing for text, just reposition
              updatedShape = {
                ...updatedShape,
                x: originalShapePos.current.x + dx/2,
                y: originalShapePos.current.y + dy/2
              };
            }
            break;
        }
        
        setShapes(prev => prev.map(shape => 
          shape === selectedShape ? updatedShape : shape
        ));
        setSelectedShape(updatedShape);
      } else if (isMovingShape && selectedShape && originalShapePos.current) {
        // Moving a shape - calculate exact position from original
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        
        const updatedShape = {
          ...selectedShape,
          x: originalShapePos.current.x + dx,
          y: originalShapePos.current.y + dy
        };
        
        setShapes(prev => prev.map(shape => 
          shape === selectedShape ? updatedShape : shape
        ));
        setSelectedShape(updatedShape);
      } else if (originalCanvasOffset.current) {
        // Panning the canvas - calculate exact offset from original
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        
        setCanvasOffset({
          x: originalCanvasOffset.current.x + dx,
          y: originalCanvasOffset.current.y + dy
        });
      }
      return;
    }

    if (!isDrawing) return;
    
    console.log('Drawing', { activeTool, start: startPoint, end: point });

    clearCanvas(canvas);
    redrawShapes(ctx, shapes, zoomLevel, canvasOffset);

    if (activeTool === 'pencil') {
      setCurrentPoints(prev => [...prev, point]);
      handlePencilDrawing(ctx, [...currentPoints, point], zoomLevel, canvasOffset);
    } else {
      const drawHandler = getDrawHandler();
      if (drawHandler) {
        drawHandler(ctx, startPoint, point, zoomLevel, canvasOffset);
      }
    }
  };

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

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);

    if (activeTool === 'pencil') {
      const newShape = handlePencilDrawing(ctx, [...currentPoints, point], zoomLevel, canvasOffset);
      setShapes(prev => [...prev, newShape]);
      setCurrentPoints([]);
    } else {
      const drawHandler = getDrawHandler();
      if (drawHandler) {
        const newShape = drawHandler(ctx, startPoint, point, zoomLevel, canvasOffset);
        setShapes(prev => [...prev, newShape]);
        console.log('Added shape', newShape);
      }
    }

    setIsDrawing(false);
  };

  const getDrawHandler = () => {
    switch (activeTool) {
      case 'rectangle':
        return handleRectangleDrawing;
      case 'circle':
        return handleCircleDrawing;
      case 'pencil':
        return handlePencilDrawing;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full" style={{ height: 'calc(100vh - 80px)' }}>
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full bg-white dark:bg-zinc-900 ${
          activeTool === 'select' ? 'cursor-move' : 'cursor-crosshair'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      {textPosition && (
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const newShape = {
                type: 'text',
                text: textInput,
                x: textPosition.x,
                y: textPosition.y
              };
              setShapes(prev => [...prev, newShape]);
              setTextPosition(null);
              setTextInput('');
            }
          }}
          className="absolute border-2 border-[#f54a00] rounded px-2 py-1 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white"
          style={{
            left: textPosition.x * zoomLevel + canvasOffset.x,
            top: textPosition.y * zoomLevel + canvasOffset.y,
            transform: `scale(${1/zoomLevel})`
          }}
          autoFocus
        />
      )}
      <ZoomControls zoomLevel={zoomLevel} setZoomLevel={setZoomLevel} />
      <div className="absolute bottom-20 left-4 text-xs text-white bg-black/10 px-2 py-1 rounded">
        Position: x:{Math.round(cursorPosition.x)}, y:{Math.round(cursorPosition.y)}
      </div>
    </div>
  );
}

export default Canvas;
