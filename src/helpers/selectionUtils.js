// Selection and deselection utilities
import { isPointInShape } from './shapeManipulation';

/**
 * Check if click is on any shape in the shapes array
 * @param {Object} point - {x, y} coordinates
 * @param {Array} shapes - Array of shape objects  
 * @returns {Object|null} - The shape that was clicked, or null if none
 */
export function findShapeUnderPoint(point, shapes) {
  if (!shapes || !shapes.length) return null;
  
  return shapes.find(shape => isPointInShape(point, shape)) || null;
}

/**
 * Handle shape deselection when clicking outside any shape
 * or select a different shape when clicking on it
 * @param {Object} e - Mouse event
 * @param {Object} ctx - Canvas context with refs, state, etc.
 * @returns {Object} - { deselected: boolean, selectedNew: boolean, newShape: Object|null }
 */
export function handleClickDeselection(e, ctx) {
  const { 
    canvasRef, 
    zoomLevel, 
    canvasOffset, 
    shapes, 
    selectedShape, 
    setSelectedShape, 
    setResizeHandle 
  } = ctx;
  
  if (!canvasRef.current) return { deselected: false, selectedNew: false, newShape: null };

  // Calculate canvas coordinates
  const rect = canvasRef.current.getBoundingClientRect();
  const canvasX = (e.clientX - rect.left) / zoomLevel - canvasOffset.x;
  const canvasY = (e.clientY - rect.top) / zoomLevel - canvasOffset.y;
  const point = { x: canvasX, y: canvasY };

  console.log(`Mouse at (${canvasX.toFixed(2)}, ${canvasY.toFixed(2)})`);
  
  if (selectedShape) {
    console.log(`Selected: ${selectedShape.type} at (${selectedShape.x.toFixed(2)}, ${selectedShape.y.toFixed(2)})`);
  }

  // Find the shape under the cursor, if any
  const clickedShape = findShapeUnderPoint(point, shapes);
  
  // Case 1: Clicked outside any shape - deselect
  if (!clickedShape) {
    if (selectedShape) {
      console.log("No shape hit, DESELECTING");
      setSelectedShape(null);
      setResizeHandle(null);
      return { deselected: true, selectedNew: false, newShape: null };
    }
    return { deselected: false, selectedNew: false, newShape: null };
  }
  
  // Case 2: Clicked on a different shape - select the new one
  if (!selectedShape || selectedShape.id !== clickedShape.id) {
    console.log(`Selecting new shape: ${clickedShape.type} (id: ${clickedShape.id})`);
    setSelectedShape(clickedShape);
    setResizeHandle(null);
    return { deselected: false, selectedNew: true, newShape: clickedShape };
  }
  
  // Case 3: Clicked on the same shape - do nothing
  return { deselected: false, selectedNew: false, newShape: null };
}

/**
 * Handle document-level clicks for deselection
 * @param {Object} e - Mouse event
 * @param {Object} options - Canvas options (canvasRef, zoomLevel, etc)
 * @returns {Object} - { deselected: boolean, selectedNew: boolean, newShape: Object|null }
 */
export function handleDocumentDeselection(e, options) {
  const { 
    canvasRef, 
    zoomLevel, 
    canvasOffset, 
    shapes, 
    setSelectedShape, 
    setResizeHandle 
  } = options;
  
  // Get canvas element and check if the click was inside it
  const canvas = canvasRef.current;
  if (!canvas) return { deselected: false, selectedNew: false, newShape: null };
  
  // Check if click was inside the canvas
  const canvasRect = canvas.getBoundingClientRect();
  const clickX = e.clientX;
  const clickY = e.clientY;
  
  // If the click was outside the canvas, deselect the shape
  if (
    clickX < canvasRect.left || 
    clickX > canvasRect.right || 
    clickY < canvasRect.top || 
    clickY > canvasRect.bottom
  ) {
    console.log("Click was outside canvas - deselecting shape");
    setSelectedShape(null);
    setResizeHandle(null);
    return { deselected: true, selectedNew: false, newShape: null };
  }
  
  // Otherwise, calculate canvas coordinates
  const canvasX = (clickX - canvasRect.left) / zoomLevel - canvasOffset.x;
  const canvasY = (clickY - canvasRect.top) / zoomLevel - canvasOffset.y;
  const point = { x: canvasX, y: canvasY };
  
  // Find the shape under the cursor, if any
  const clickedShape = findShapeUnderPoint(point, shapes);
  
  // If no shape was clicked, deselect
  if (!clickedShape) {
    console.log("Click was inside canvas but outside any shape - deselecting");
    setSelectedShape(null);
    setResizeHandle(null);
    return { deselected: true, selectedNew: false, newShape: null };
  }
  
  return { deselected: false, selectedNew: false, newShape: null };
} 