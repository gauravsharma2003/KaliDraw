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
    setActiveTool,
    activeTool
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