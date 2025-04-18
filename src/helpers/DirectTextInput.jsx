import React, { useEffect, useRef } from 'react';

/**
 * DirectTextInput - Handles text input directly on canvas
 * Manages the drawing of text and cursor while typing
 */
const DirectTextInput = {
  // Draw text being typed on canvas with styling
  drawActiveText: (ctx, textInput, position, color = '#f54a00', options = {}) => {
    if (!position) return;
    
    // Extract styling properties
    const { 
      fontSize = 16, 
      fontWeight = 'normal', 
      fontStyle = 'normal', 
      textDecoration = 'none',
      align = 'left'
    } = options;
    
    
    // Set the font with styling
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
    
    // Calculate text metrics
    const lines = textInput.split('\n');
    const lineHeight = fontSize * 1.2;
    
    // Find the widest line for the box width
    let maxWidth = 100; // Minimum width
    for (const line of lines) {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width + 20); // Add some padding
    }
    
    // Calculate box height based on number of lines
    const boxHeight = Math.max(lineHeight * lines.length + 20, 40);
    
    // Draw the box exactly at the click position
    ctx.strokeStyle = '#7e73ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(
      position.x, 
      position.y, 
      maxWidth,
      boxHeight
    );
    ctx.setLineDash([]);
    
    // Draw the text itself with proper alignment
    ctx.fillStyle = color;
    ctx.textAlign = align;
    
    let xOffset;
    switch (align) {
      case 'center':
        xOffset = position.x + maxWidth / 2;
        break;
      case 'right':
        xOffset = position.x + maxWidth - 10;
        break;
      case 'left':
      default:
        xOffset = position.x + 10;
        break;
    }
    
    lines.forEach((line, index) => {
      ctx.fillText(line, xOffset, position.y + 20 + (index * lineHeight));
      
      // Draw underline if needed
      if (textDecoration === 'underline') {
        const metrics = ctx.measureText(line);
        const lineWidth = metrics.width;
        
        // Calculate underline position based on alignment
        let underlineX;
        switch (align) {
          case 'center':
            underlineX = xOffset - lineWidth / 2;
            break;
          case 'right':
            underlineX = xOffset - lineWidth;
            break;
          case 'left':
          default:
            underlineX = xOffset;
            break;
        }
        
        ctx.strokeStyle = color;
        ctx.lineWidth = fontSize / 15;
        ctx.beginPath();
        ctx.moveTo(underlineX, position.y + 20 + (index * lineHeight) + (fontSize / 10));
        ctx.lineTo(underlineX + lineWidth, position.y + 20 + (index * lineHeight) + (fontSize / 10));
        ctx.stroke();
      }
    });
    
    // Add a cursor indicator (blinking effect)
    const cursorVisible = Math.floor(Date.now() / 500) % 2 === 0;
    if (cursorVisible) {
      // Calculate cursor position based on text position and current text
      if (lines.length === 0) {
        // If no text, cursor at start position
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xOffset, position.y + 20);
        ctx.lineTo(xOffset, position.y + 20 + lineHeight);
        ctx.stroke();
      } else {
        // Calculate cursor position at the end of the last line
        const lastLine = lines[lines.length - 1];
        const lastLineWidth = ctx.measureText(lastLine).width;
        
        let cursorX;
        switch (align) {
          case 'center':
            cursorX = xOffset + lastLineWidth / 2;
            break;
          case 'right':
            cursorX = xOffset;
            break;
          case 'left':
          default:
            cursorX = xOffset + lastLineWidth;
            break;
        }
        
        const cursorY = position.y + 20 + (lines.length - 1) * lineHeight;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cursorX, cursorY);
        ctx.lineTo(cursorX, cursorY + lineHeight);
        ctx.stroke();
      }
    }
    
    // Return the dimensions with the specific padding info
    return {
      width: maxWidth,
      height: boxHeight,
      paddingLeft: 10,
      paddingTop: 20
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
    
    // Find the widest line for the box width
    let maxWidth = 100; // Minimum width
    for (const line of lines) {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width + 20); // Add some padding
    }
    
    // Calculate box height based on number of lines
    const boxHeight = Math.max(lineHeight * lines.length + 20, 40);
    
    return {
      width: maxWidth,
      height: boxHeight,
      paddingLeft: 10,
      paddingTop: 20
    };
  }
};

export default DirectTextInput; 