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
      align = 'center', // Default to center
      verticalAlign = 'middle' // Default to middle
    } = options;
    
    // Use a consistent font setting
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
    ctx.textBaseline = 'top';
    
    // Ensure we have a valid string to render
    const safeText = textInput || '';
    const lines = safeText.split('\n');
    const lineHeight = fontSize * 1.2;
    
    // Use more generous padding to ensure text stays within bounds
    const paddingLeft = fontSize * 0.8;
    const paddingRight = fontSize * 0.8;
    const paddingTop = fontSize * 0.6;
    const paddingBottom = fontSize * 0.6;
    
    // Use box dimensions from position, accounting for minimum size
    const boxWidth = Math.max(position.width, 80);
    const boxHeight = Math.max(position.height, 40);
    
    // Draw dashed rectangle box
    ctx.strokeStyle = '#7e73ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(position.x, position.y, boxWidth, boxHeight);
    ctx.setLineDash([]);
    
    // Set text alignment and calculate xOffset
    let xOffset;
    if (align === 'center') {
      xOffset = position.x + boxWidth / 2;
      ctx.textAlign = 'center';
    } else if (align === 'right') {
      xOffset = position.x + boxWidth - paddingRight;
      ctx.textAlign = 'right';
    } else {
      xOffset = position.x + paddingLeft;
      ctx.textAlign = 'left';
    }
    
    // Calculate vertical positioning based on verticalAlign
    let yOffset = position.y + paddingTop;
    const totalTextHeight = lines.length * lineHeight;
    
    if (verticalAlign === 'middle') {
      yOffset = position.y + (boxHeight - totalTextHeight) / 2;
    } else if (verticalAlign === 'bottom') {
      yOffset = position.y + boxHeight - totalTextHeight - paddingBottom;
    }
    
    // Draw text lines with clipping to ensure text stays in box
    ctx.save();
    // Create a clipping region to keep text inside the box
    ctx.beginPath();
    ctx.rect(position.x, position.y, boxWidth, boxHeight);
    ctx.clip();
    
    // Draw text lines
    ctx.fillStyle = color;
    lines.forEach((line, index) => {
      // Skip very long lines that might cause performance issues
      if (line.length > 1000) {
        line = line.substring(0, 1000) + '...';
      }
      
      ctx.fillText(line, xOffset, yOffset + index * lineHeight);
      
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
        ctx.moveTo(underlineX, yOffset + index * lineHeight + fontSize);
        ctx.lineTo(underlineX + metrics.width, yOffset + index * lineHeight + fontSize);
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
        cursorX = xOffset + currentLineWidth / 2;
      } else if (align === 'right') {
        cursorX = xOffset;
      } else {
        cursorX = xOffset + currentLineWidth;
      }
      const cursorY = yOffset + (lines.length - 1) * lineHeight;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cursorX, cursorY);
      ctx.lineTo(cursorX, cursorY + lineHeight);
      ctx.stroke();
    }
    
    // Restore context to remove clipping
    ctx.restore();
    
    return {
      width: boxWidth,
      height: boxHeight
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
    let maxWidth = 0;
    for (const line of lines) {
      const metrics = ctx.measureText(line || ' ');
      maxWidth = Math.max(maxWidth, metrics.width);
    }
    
    // Calculate total width with padding
    const totalWidth = Math.max(maxWidth + paddingLeft + paddingRight, 100);
    
    // Calculate box height based on number of lines
    const contentHeight = lineHeight * lines.length;
    const totalHeight = Math.max(contentHeight + paddingTop + paddingBottom, 40);
    
    return {
      width: totalWidth,
      height: totalHeight,
      contentWidth: maxWidth,
      contentHeight: contentHeight,
      lineHeight: lineHeight,
      lineCount: lines.length,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom
    };
  }
};

export default DirectTextInput; 