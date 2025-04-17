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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });

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
      
      // Draw selection rectangle
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line
      
      const HANDLE_SIZE = 8;
      
      switch (selectedShape.type) {
        case 'rectangle':
          ctx.strokeRect(
            selectedShape.x - 5, 
            selectedShape.y - 5, 
            selectedShape.width + 10, 
            selectedShape.height + 10
          );
          
          // Draw resize handles (white squares)
          ctx.fillStyle = 'white';
          ctx.setLineDash([]); // Reset dash
          
          // Top-left
          ctx.fillRect(
            selectedShape.x - HANDLE_SIZE/2, 
            selectedShape.y - HANDLE_SIZE/2, 
            HANDLE_SIZE, 
            HANDLE_SIZE
          );
          
          // Top-right
          ctx.fillRect(
            selectedShape.x + selectedShape.width - HANDLE_SIZE/2, 
            selectedShape.y - HANDLE_SIZE/2, 
            HANDLE_SIZE, 
            HANDLE_SIZE
          );
          
          // Bottom-left
          ctx.fillRect(
            selectedShape.x - HANDLE_SIZE/2, 
            selectedShape.y + selectedShape.height - HANDLE_SIZE/2, 
            HANDLE_SIZE, 
            HANDLE_SIZE
          );
          
          // Bottom-right
          ctx.fillRect(
            selectedShape.x + selectedShape.width - HANDLE_SIZE/2, 
            selectedShape.y + selectedShape.height - HANDLE_SIZE/2, 
            HANDLE_SIZE, 
            HANDLE_SIZE
          );
          break;
          
        case 'circle':
          // Draw selection circle
          ctx.beginPath();
          ctx.arc(
            selectedShape.x + selectedShape.radius,
            selectedShape.y + selectedShape.radius,
            selectedShape.radius + 5,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          
          // Draw resize handle
          ctx.fillStyle = 'white';
          ctx.setLineDash([]); // Reset dash
          ctx.fillRect(
            selectedShape.x + selectedShape.radius * 2 - HANDLE_SIZE/2,
            selectedShape.y + selectedShape.radius * 2 - HANDLE_SIZE/2,
            HANDLE_SIZE,
            HANDLE_SIZE
          );
          break;
          
        case 'text':
          // Draw selection rectangle around text
          ctx.strokeRect(
            selectedShape.x - 50 - 5, 
            selectedShape.y - 20 - 5, 
            100 + 10, 
            40 + 10
          );
          
          // Draw resize handle
          ctx.fillStyle = 'white';
          ctx.setLineDash([]); // Reset dash
          ctx.fillRect(
            selectedShape.x + 50 - HANDLE_SIZE/2,
            selectedShape.y + 20 - HANDLE_SIZE/2,
            HANDLE_SIZE,
            HANDLE_SIZE
          );
          break;
          
        case 'pencil':
          // Find bounding box
          let minX = Infinity, minY = Infinity;
          let maxX = -Infinity, maxY = -Infinity;
          
          selectedShape.points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
          });
          
          // Draw selection rectangle
          ctx.strokeRect(
            minX - 5, 
            minY - 5, 
            maxX - minX + 10, 
            maxY - minY + 10
          );
          
          // Draw resize handle
          ctx.fillStyle = 'white';
          ctx.setLineDash([]); // Reset dash
          ctx.fillRect(
            maxX - HANDLE_SIZE/2,
            maxY - HANDLE_SIZE/2,
            HANDLE_SIZE,
            HANDLE_SIZE
          );
          break;
      }
      
      ctx.restore();
    }
    
    console.log('Redrawing shapes', { shapes, selectedShape, zoomLevel });
  }, [shapes, selectedShape, zoomLevel, canvasOffset]);

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);
    
    console.log('Mouse down', { activeTool, point });

    if (activeTool === 'select') {
      // Check if clicking on a shape
      const clickedShape = shapes.find(shape => isPointInShape(point, shape));
      
      if (clickedShape) {
        setSelectedShape(clickedShape);
        // Check if clicking on a resize handle
        const handle = getResizeHandle(point, clickedShape);
        console.log('Resize handle:', handle);
        
        if (handle) {
          setResizeHandle(handle);
          setIsDragging(true);
        } else {
          setDragStart(point);
          setIsDragging(true);
        }
      } else {
        // Clicked on empty space, deselect any selected shape
        setSelectedShape(null);
        setIsDragging(true);
        setDragStart(point);
      }
      return;
    } else {
      // If switching to drawing mode, deselect any selected shape
      setSelectedShape(null);
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
    if (!isDrawing && !isDragging) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const point = getCanvasCoordinates(canvas, e, zoomLevel, canvasOffset);

    if (activeTool === 'select' && isDragging) {
      if (selectedShape && resizeHandle) {
        console.log('Resizing with handle:', resizeHandle);
        const updatedShape = resizeShape(selectedShape, resizeHandle, point);
        setShapes(prev => prev.map(shape => 
          shape === selectedShape ? updatedShape : shape
        ));
        setSelectedShape(updatedShape);
      } else if (selectedShape) {
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        const updatedShape = {
          ...selectedShape,
          x: selectedShape.x + dx,
          y: selectedShape.y + dy
        };
        setShapes(prev => prev.map(shape => 
          shape === selectedShape ? updatedShape : shape
        ));
        setSelectedShape(updatedShape);
        setDragStart(point);
      } else {
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;
        setCanvasOffset(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
        setDragStart(point);
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
    
    if (activeTool === 'select') {
      setIsDragging(false);
      setResizeHandle(null);
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
        className="absolute top-0 left-0 w-full h-full bg-white dark:bg-zinc-900 cursor-crosshair"
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
    </div>
  );
}

export default Canvas;
