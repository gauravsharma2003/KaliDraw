/**
 * Handle clicks outside the text input area during text editing
 * @param {MouseEvent} e - Mouse event
 * @param {HTMLCanvasElement} canvas - Canvas element reference
 * @param {Object} textPosition - Position and dimensions of text input
 * @param {number} zoomLevel - Current zoom level
 * @param {Object} canvasOffset - Current canvas offset
 * @param {boolean} isTypingText - Whether we're currently in text typing mode
 * @returns {boolean} - Whether the click was outside text area
 */
export function isClickOutsideTextArea(
  e,
  canvas,
  textPosition,
  zoomLevel,
  canvasOffset,
  isTypingText
) {
  if (!isTypingText || !textPosition || !canvas) return false;
  
  // Convert click position to canvas coordinates
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / zoomLevel - canvasOffset.x;
  const y = (e.clientY - rect.top) / zoomLevel - canvasOffset.y;
  
  // Check if click is outside text input area
  return (
    x < textPosition.x || 
    x > textPosition.x + textPosition.width || 
    y < textPosition.y || 
    y > textPosition.y + textPosition.height
  );
}

/**
 * Calculate text dimensions based on font size and text content
 * @param {string} text - The text content
 * @param {number} fontSize - The font size in px
 * @param {string} fontFamily - The font family
 * @returns {Object} - The width and height of the text
 */
export function calculateTextDimensions(text, ctx, fontSize = 16, fontFamily = 'Arial') {
  // Use provided context or create a temporary canvas for measurement
  let tempCanvas, tempCtx;
  if (!ctx) {
    tempCanvas = document.createElement('canvas');
    tempCtx = tempCanvas.getContext('2d');
    ctx = tempCtx;
  }
  
  // Set the font with appropriate weight and style
  const fontWeight = 'normal';
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // Ensure text is not null or undefined
  const safeText = text || '';
  
  // Measure each line and find the longest one
  const lines = safeText.split('\n');
  if (lines.length === 0) lines.push(''); // Ensure at least one line
  
  let maxWidth = 0;
  
  for (const line of lines) {
    // Use a non-empty string for measurement to handle empty lines properly
    const lineToMeasure = line || ' ';
    const metrics = ctx.measureText(lineToMeasure);
    maxWidth = Math.max(maxWidth, metrics.width);
  }
  
  // Calculate height based on number of lines and font metrics
  const lineHeight = fontSize * 1.2; // Standard line height is usually 1.2 times font size
  const textContentHeight = lineHeight * lines.length;
  
  // Add more generous padding to prevent text from getting too close to edges
  // Increase padding for better usability and to prevent out-of-bounds issues
  const paddingX = fontSize * 1.2; // Increased from 0.75
  const paddingY = fontSize * 0.8; // Increased from 0.5
  
  // Use dynamic width based on content with sensible minimum
  // Add extra padding to prevent overflow during typing
  const contentWidth = maxWidth;
  const contentHeight = textContentHeight;
  
  // Calculate total dimensions with padding
  const width = Math.max(contentWidth + paddingX * 2, 80); // Increased minimum width
  const height = Math.max(contentHeight + paddingY * 2, 40); // Increased minimum height
  
  // Store and return additional metrics to help with text positioning
  return {
    width,
    height,
    contentWidth,
    contentHeight,
    lineHeight,
    lineCount: lines.length,
    paddingX,
    paddingY
  };
} 