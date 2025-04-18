import React, { useEffect, useRef } from 'react';

/**
 * DirectTextInput - Handles text input directly on canvas
 * Manages the drawing of text and cursor while typing
 */
const DirectTextInput = {
  // Draw text being typed on canvas with styling
  drawActiveText: (ctx, textInput, position, color = '#f54a00', options = {}) => {
    if (!position) return;
    
    const { 
      fontSize = 16, 
      fontWeight = 'normal', 
      fontStyle = 'normal', 
      textDecoration = 'none',
      align = 'left'
    } = options;
    
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
    ctx.textBaseline = 'top';
    
    const lines = textInput.split('\n');
    const lineHeight = fontSize * 1.2;
    
    // Define padding
    const paddingLeft = 10;
    const paddingRight = 10;
    const paddingTop = 5;
    const paddingBottom = 5;
    
    // Calculate content width
    let contentWidth = 100; // minimum width
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      contentWidth = Math.max(contentWidth, metrics.width);
    });
    const maxWidth = contentWidth + paddingLeft + paddingRight;
    const boxHeight = Math.max(lineHeight * lines.length + paddingTop + paddingBottom, 40);
    
    // Draw dashed rectangle box
    ctx.strokeStyle = '#7e73ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(position.x, position.y, maxWidth, boxHeight);
    ctx.setLineDash([]);
    
    // Set text alignment and calculate xOffset
    let xOffset;
    if (align === 'center') {
      xOffset = position.x + maxWidth / 2;
      ctx.textAlign = 'center';
    } else if (align === 'right') {
      xOffset = position.x + maxWidth - paddingRight;
      ctx.textAlign = 'right';
    } else {
      xOffset = position.x + paddingLeft;
      ctx.textAlign = 'left';
    }
    
    // Draw text lines
    ctx.fillStyle = color;
    lines.forEach((line, index) => {
      ctx.fillText(line, xOffset, position.y + paddingTop + index * lineHeight);
      if (textDecoration === 'underline') {
        const metrics = ctx.measureText(line);
        let underlineX;
        if (align === 'center') {
          underlineX = xOffset - metrics.width / 2;
        } else if (align === 'right') {
          underlineX = xOffset - metrics.width;
        } else {
          underlineX = xOffset;
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = fontSize / 15;
        ctx.beginPath();
        ctx.moveTo(underlineX, position.y + paddingTop + index * lineHeight + fontSize);
        ctx.lineTo(underlineX + metrics.width, position.y + paddingTop + index * lineHeight + fontSize);
        ctx.stroke();
      }
    });
    
    // Draw cursor indicator
    const cursorVisible = Math.floor(Date.now() / 500) % 2 === 0;
    if (cursorVisible) {
      let currentLine = lines[lines.length - 1] || '';
      let currentLineWidth = ctx.measureText(currentLine).width;
      let cursorX;
      if (align === 'center') {
        cursorX = position.x + maxWidth / 2 + currentLineWidth / 2;
      } else if (align === 'right') {
        cursorX = position.x + maxWidth - paddingRight;
      } else {
        cursorX = position.x + paddingLeft + currentLineWidth;
      }
      const cursorY = position.y + paddingTop + (lines.length - 1) * lineHeight;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursorX, cursorY);
      ctx.lineTo(cursorX, cursorY + lineHeight);
      ctx.stroke();
    }
    
    return {
      width: maxWidth,
      height: boxHeight,
      paddingLeft: paddingLeft,
      paddingTop: paddingTop
    };
  },
  
  // Handle text input keyboard events
  handleKeyInput: (e, textInput, setTextInput) => {
    // Handle special keys
    switch (e.key) {
      case 'Backspace':
        setTextInput(prev => prev.slice(0, -1));
        return true;
      case 'Enter':
        if (e.shiftKey) {
          // Add a newline character
          setTextInput(prev => prev + '\n');
          return true;
        }
        // Regular Enter should be handled by the parent
        return false;
      case 'Escape':
        // Escape should be handled by the parent
        return false;
      default:
        // Only accept printable characters
        if (e.key.length === 1) {
          setTextInput(prev => prev + e.key);
          return true;
        }
        return false;
    }
  },
  
  // Calculate dimensions for a text shape based on content
  calculateTextDimensions: (ctx, text, options = {}) => {
    const { 
      fontSize = 16, 
      fontWeight = 'normal', 
      fontStyle = 'normal'
    } = options;
    
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
    
    // Calculate text metrics
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    
    // Define padding consistent with drawActiveText
    const paddingLeft = 10;
    const paddingRight = 10;
    const paddingTop = 5;
    const paddingBottom = 5;
    
    // Find the widest line for the content width
    let contentWidth = 100; // Minimum content width
    for (const line of lines) {
      const metrics = ctx.measureText(line);
      contentWidth = Math.max(contentWidth, metrics.width);
    }
    const maxWidth = contentWidth + paddingLeft + paddingRight;
    
    // Calculate box height based on number of lines
    const boxHeight = Math.max(lineHeight * lines.length + paddingTop + paddingBottom, 40);
    
    return {
      width: maxWidth,
      height: boxHeight,
      paddingLeft: paddingLeft,
      paddingTop: paddingTop
    };
  }
};

export default DirectTextInput; 