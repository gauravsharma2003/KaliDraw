import DirectTextInput from '../DirectTextInput';
import { calculateTextDimensions } from './TextGeometry';
import { createText } from '../drawingTools';

/**
 * Initialize text input mode at the given position.
 */
export function startTextInputAtPosition(
  position,
  setTextPosition,
  setIsTypingText,
  setTextInput
) {
  // Clear any existing text input
  setTextInput('');
  
  // Set initial text position with a minimum size box
  setTextPosition({
    x: position.x,
    y: position.y,
    width: 100, // Initial minimum width
    height: 40  // Initial minimum height
  });
  setIsTypingText(true);
}

/**
 * Handle keyboard events during text input.
 */
export function handleTextInput(
  e,
  isTypingText,
  isEditingText,
  originalShapePosRef,
  textInput,
  setTextInput,
  setIsTypingText,
  setIsEditingText,
  setShapes
) {
  if (!isTypingText) return false;

  if (e.key === 'Escape') {
    // Cancel typing: if editing, restore the original shape (by updating it) instead of appending it
    if (isEditingText && originalShapePosRef.current) {
      setShapes(prev => prev.map(s => s.id === originalShapePosRef.current.id ? originalShapePosRef.current : s));
    }
    setIsTypingText(false);
    setIsEditingText(false);
    setTextInput('');
    return true;
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    // Confirm handled separately
    return true;
  }

  // Delegate other keys to DirectTextInput
  return DirectTextInput.handleKeyInput(e, textInput, setTextInput);
}

/**
 * Update text position dimensions based on current input
 */
export function updateTextDimensions(
  canvasRef,
  textInput,
  textPosition,
  setTextPosition
) {
  if (!canvasRef.current || !textPosition) return;
  
  const ctx = canvasRef.current.getContext('2d');
  ctx.font = '16px Arial'; // Use the same font as in text rendering
  
  // Pass the ctx to calculateTextDimensions to use the same context
  const dimensions = calculateTextDimensions(textInput, ctx);
  
  // Add a buffer to dimensions to prevent flickering during typing
  // This makes the box slightly larger than needed to avoid constant resizing
  const widthBuffer = 20; // Extra space for width
  const heightBuffer = 10; // Extra space for height
  
  // Only update dimensions if new size is larger than current or significantly smaller
  // This prevents constant small changes that cause flickering
  setTextPosition(prev => {
    // Only grow the box if needed, and only shrink it if it's significantly larger than needed
    // This avoids the box constantly changing size during typing
    const newWidth = Math.max(
      prev.width, 
      dimensions.width + widthBuffer
    );
    const newHeight = Math.max(
      prev.height, 
      dimensions.height + heightBuffer
    );
    
    // Only update if dimensions have changed significantly
    // This prevents unnecessary re-renders
    if (Math.abs(newWidth - prev.width) > 5 || Math.abs(newHeight - prev.height) > 5) {
      return {
        ...prev,
        width: newWidth,
        height: newHeight
      };
    }
    
    // If changes are minor, keep previous dimensions to reduce flickering
    return prev;
  });
}

/**
 * Confirm the current text input, creating or updating a text shape.
 * This always switches to select mode after confirming text.
 */
export function confirmTextInput(
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
) {
  // Skip if there's no text position (invalid state)
  if (!textPosition) {
    console.log("No text position, skipping text confirmation");
    return;
  }
  
  // If input is empty, cancel text input without creating a shape
  if (!textInput || textInput.trim() === '') {
    console.log("Empty text input, canceling text creation");
    setIsTypingText(false);
    setIsEditingText(false);
    setSelectedShape(null);
    // Always switch to select mode
    if (setActiveTool) setActiveTool('select');
    return;
  }

  console.log("Confirming text input:", textInput);

  // Calculate final dimensions with proper context
  const ctx = canvasRef.current.getContext('2d');
  ctx.font = '16px Arial';
  const dimensions = calculateTextDimensions(textInput, ctx);

  // Calculate a more appropriate font size based on container dimensions
  // This helps text scale with the container size when initially created
  const baseSize = 16;
  const textWidth = dimensions.width;
  const textHeight = dimensions.height;
  
  // Calculate the width and height ratios
  const containerWidth = Math.max(textPosition.width, 100);
  const containerHeight = Math.max(textPosition.height, 40);
  const widthRatio = containerWidth / textWidth;
  const heightRatio = containerHeight / textHeight;
  
  // Use a scaled font size based on container size
  // We'll use a conservative scaling factor to avoid making text too large
  const scalingFactor = Math.min(widthRatio, heightRatio, 3) * 0.8;
  const initialFontSize = Math.max(baseSize, Math.min(72, Math.round(baseSize * scalingFactor)));
  
  console.log("Initial font size calculation:", { 
    containerWidth, containerHeight, textWidth, textHeight, 
    widthRatio, heightRatio, scalingFactor, initialFontSize 
  });

  let createdOrUpdatedShape = null;

  setShapes(prevShapes => {
    // Save undo state using the previous shapes
    setUndoHistory(undoPrev => [...undoPrev, prevShapes]);

    // Check if we're editing an existing text shape
    const hasEditing = prevShapes.some(shape => shape.type === 'text' && shape.isEditing);

    // If we're editing, update the existing shape
    if (hasEditing) {
      console.log("Updating existing text shape");
      const newShapes = prevShapes.map(shape => {
        if (shape.type === 'text' && shape.isEditing) {
          // Update with new text and position, remove editing flag
          const updatedShape = { 
            ...shape, 
            text: textInput, 
            x: textPosition.x, 
            y: textPosition.y, 
            width: Math.max(dimensions.width, textPosition.width),
            height: Math.max(dimensions.height, textPosition.height),
            fontSize: shape.fontSize || initialFontSize, // Keep existing fontSize or use calculated
            isEditing: false 
          };
          
          // Store the updated shape for selection
          createdOrUpdatedShape = updatedShape;
          return updatedShape;
        }
        return shape;
      });
      return newShapes;
    } 
    // If we're creating a new shape
    else {
      console.log("Creating new text shape at", textPosition.x, textPosition.y);
      // Generate a unique ID
      const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
      
      // Create new text shape with dimensions from the calculated size
      // and font size appropriate for the container size
      const newTextShape = {
        id,
        type: 'text',
        text: textInput,
        x: textPosition.x,
        y: textPosition.y,
        width: Math.max(dimensions.width, textPosition.width),
        height: Math.max(dimensions.height, textPosition.height),
        fontSize: initialFontSize, // Use the calculated font size
        color: '#f54a00', // Default color
        align: 'center', // Center text by default
        verticalAlign: 'middle', // Center vertically by default
        isEditing: false,
      };
      
      // Store the new shape for selection
      createdOrUpdatedShape = newTextShape;
      
      const newShapes = [...prevShapes, newTextShape];
      return newShapes;
    }
  });

  // Reset text editing state
  setIsTypingText(false);
  setIsEditingText(false);
  setTextInput('');
  
  // Always switch to select mode
  if (setActiveTool) setActiveTool('select');
  
  // Select the shape that was just created or updated
  if (createdOrUpdatedShape) {
    setSelectedShape(createdOrUpdatedShape);
  }
}

/**
 * Prepare an existing text shape for editing on double-click.
 */
export function handleEditTextClick(
  selectedShape,
  setTextPosition,
  setTextInput,
  setIsTypingText,
  setIsEditingText,
  originalShapePosRef,
  setShapes
) {
  if (!selectedShape) return;

  setTextPosition({ 
    x: selectedShape.x, 
    y: selectedShape.y,
    width: selectedShape.width,
    height: selectedShape.height
  });
  setTextInput(selectedShape.text);
  setIsTypingText(true);
  setIsEditingText(true);

  // Save original in case of cancel
  originalShapePosRef.current = { ...selectedShape };
  // Instead of removing the shape, mark it as editing
  setShapes(prev => prev.map(s => s.id === selectedShape.id ? { ...s, isEditing: true } : s));
} 