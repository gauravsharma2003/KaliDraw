import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

const ZoomControls = ({ zoomLevel, setZoomLevel }) => {
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 3)); // Max zoom 300%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.1)); // Min zoom 10%
  };

  return (
    <div className="fixed bottom-4 left-4 flex items-center gap-2 p-2 rounded-lg backdrop-blur-md bg-white/10 dark:bg-zinc-900/10 border border-white/20 dark:border-zinc-700/20 shadow-lg z-50">
      <button
        onClick={handleZoomOut}
        className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-zinc-800/20 transition-colors duration-300"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {Math.round(zoomLevel * 100)}%
      </span>
      <button
        onClick={handleZoomIn}
        className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-zinc-800/20 transition-colors duration-300"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ZoomControls; 