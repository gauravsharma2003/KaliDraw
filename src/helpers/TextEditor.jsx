import React, { useState, useEffect, useRef } from 'react';

const TextEditor = ({ 
  position, 
  zoomLevel, 
  canvasOffset, 
  onComplete, 
  onCancel,
  initialText = '' 
}) => {
  const [text, setText] = useState(initialText);
  const inputRef = useRef(null);
  const editorRef = useRef(null);
  
  // Log when component mounts/updates
  useEffect(() => {
    console.log('TextEditor mounted/updated', { position, zoomLevel });
  }, [position, zoomLevel]);
  
  // Focus on input when component mounts
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        console.log('Focusing input');
        inputRef.current.focus();
        // Select all text when editing existing text
        if (initialText) {
          inputRef.current.select();
        }
      }
    };
    
    // Try immediately and then with a small delay
    focusInput();
    const timer = setTimeout(focusInput, 100);
    
    return () => clearTimeout(timer);
  }, [initialText]);
  
  // Add click listener to handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (editorRef.current && !editorRef.current.contains(e.target)) {
        console.log('Click detected outside editor - completing text edit');
        handleComplete();
      }
    };
    
    // Add after a small delay to prevent immediate triggering
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 300);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [text]);

  const handleKeyDown = (e) => {
    // Complete on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComplete();
    }
    
    // Cancel on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    
    // Stop event propagation to prevent canvas keyboard shortcuts
    e.stopPropagation();
  };
  
  const handleComplete = () => {
    if (text.trim()) {
      onComplete(text);
    } else {
      onCancel();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    // Text dimensions will be recalculated automatically
  };

  return (
    <div 
      ref={editorRef}
      className="absolute z-50"
      style={{
        left: (position.x + canvasOffset.x) * zoomLevel,
        top: (position.y + canvasOffset.y) * zoomLevel,
        transformOrigin: 'top left',
      }}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        placeholder="Type here..."
        className="min-w-[150px] min-h-[40px] p-2 outline-none border-2 border-[#7e73ff] rounded bg-white/90 dark:bg-zinc-900/90 text-black dark:text-white shadow-md resize-none"
        style={{
          fontSize: '16px',
          transformOrigin: 'top left',
          transform: `scale(${1/zoomLevel})`,
          width: Math.max(150, position.width) * (1/zoomLevel) + 'px',
          height: Math.max(40, position.height) * (1/zoomLevel) + 'px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      />
      <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-white">
        Press Enter to confirm, Esc to cancel
      </div>
    </div>
  );
};

export default TextEditor; 