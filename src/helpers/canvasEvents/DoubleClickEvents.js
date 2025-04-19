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