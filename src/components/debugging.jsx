import React, { useState, useEffect } from 'react';

// Debug component to display state and help diagnose issues
const Debugging = ({ activeTool, textPosition, editingText }) => {
  const [logs, setLogs] = useState([]);
  
  // Add logs when props change
  useEffect(() => {
    addLog(`Active tool changed to: ${activeTool}`);
  }, [activeTool]);
  
  useEffect(() => {
    if (textPosition) {
      addLog(`Text position set: ${JSON.stringify(textPosition)}`);
    } else {
      addLog(`Text position cleared`);
    }
  }, [textPosition]);
  
  useEffect(() => {
    if (editingText) {
      addLog(`Editing text: ${editingText.text}`);
    } else {
      addLog(`Text editing stopped`);
    }
  }, [editingText]);
  
  // Add a log entry with timestamp
  const addLog = (message) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };
  
  return (
    <div className="absolute right-4 top-20 bg-black/70 text-white text-xs p-2 rounded w-64 max-h-80 overflow-auto z-50">
      <div className="font-bold mb-2">Debug Info:</div>
      <div className="mb-2">
        <span className="font-semibold">Active Tool:</span> {activeTool}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Text Position:</span> {textPosition ? `${Math.round(textPosition.x)}, ${Math.round(textPosition.y)}` : 'null'}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Editing Text:</span> {editingText ? 'true' : 'false'}
      </div>
      <div className="font-bold mt-2">Log:</div>
      <div className="border-t border-white/20 mt-1 pt-1">
        {logs.map((log, i) => (
          <div key={i} className="text-xs mb-1 opacity-80">{log}</div>
        ))}
      </div>
    </div>
  );
};

export default Debugging; 