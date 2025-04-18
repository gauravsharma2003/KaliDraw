import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, ChevronUp, ChevronDown, Edit, Bold, Italic, Underline } from 'lucide-react';

const TextToolbar = ({ 
  position, 
  onAlignChange, 
  onFontSizeChange, 
  onEditClick,
  onStyleChange,
  currentAlign = 'left',
  currentFontSize = 16,
  currentStyles = {}
}) => {
  // Increase font size, max 72
  const increaseFontSize = () => {
    const newSize = Math.min(72, currentFontSize + 2);
    onFontSizeChange(newSize);
  };

  // Decrease font size, min 8
  const decreaseFontSize = () => {
    const newSize = Math.max(8, currentFontSize - 2);
    onFontSizeChange(newSize);
  };

  // Toggle text style (bold, italic, underline)
  const toggleStyle = (styleName) => {
    if (onStyleChange) {
      const styleValue = styleName === 'textDecoration' 
        ? (currentStyles.textDecoration === 'underline' ? 'none' : 'underline')
        : styleName === 'fontWeight'
          ? (currentStyles.fontWeight === 'bold' ? 'normal' : 'bold')
          : styleName === 'fontStyle'
            ? (currentStyles.fontStyle === 'italic' ? 'normal' : 'italic')
            : '';
      
      onStyleChange({ [styleName]: styleValue });
    }
  };

  return (
    <div 
      className="absolute bg-white/90 backdrop-blur-sm border border-gray-300 rounded-md shadow-lg p-1 flex gap-1 z-50"
      style={{
        top: `${position.y - 38}px`,
        left: `${position.x}px`,
      }}
    >
      {/* Text alignment buttons */}
      <div className="flex border-r border-gray-300 pr-1">
        <button 
          className={`p-1 rounded hover:bg-gray-200 ${currentAlign === 'left' ? 'bg-gray-200' : ''}`}
          onClick={() => onAlignChange('left')}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </button>
        <button 
          className={`p-1 rounded hover:bg-gray-200 ${currentAlign === 'center' ? 'bg-gray-200' : ''}`}
          onClick={() => onAlignChange('center')}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </button>
        <button 
          className={`p-1 rounded hover:bg-gray-200 ${currentAlign === 'right' ? 'bg-gray-200' : ''}`}
          onClick={() => onAlignChange('right')}
          title="Align Right"
        >
          <AlignRight size={16} />
        </button>
      </div>

      {/* Font size controls */}
      <div className="flex border-r border-gray-300 pr-1">
        <button 
          className="p-1 rounded hover:bg-gray-200"
          onClick={increaseFontSize}
          title="Increase Font Size"
        >
          <ChevronUp size={16} />
        </button>
        <span className="flex items-center px-1 text-xs">{currentFontSize}px</span>
        <button 
          className="p-1 rounded hover:bg-gray-200"
          onClick={decreaseFontSize}
          title="Decrease Font Size"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Text styling buttons */}
      {onStyleChange && (
        <div className="flex border-r border-gray-300 pr-1">
          <button 
            className={`p-1 rounded hover:bg-gray-200 ${currentStyles.fontWeight === 'bold' ? 'bg-gray-200' : ''}`}
            onClick={() => toggleStyle('fontWeight')}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button 
            className={`p-1 rounded hover:bg-gray-200 ${currentStyles.fontStyle === 'italic' ? 'bg-gray-200' : ''}`}
            onClick={() => toggleStyle('fontStyle')}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button 
            className={`p-1 rounded hover:bg-gray-200 ${currentStyles.textDecoration === 'underline' ? 'bg-gray-200' : ''}`}
            onClick={() => toggleStyle('textDecoration')}
            title="Underline"
          >
            <Underline size={16} />
          </button>
        </div>
      )}

      {/* Edit text button */}
      <button 
        className="p-1 rounded hover:bg-gray-200"
        onClick={onEditClick}
        title="Edit Text"
      >
        <Edit size={16} />
      </button>
    </div>
  );
};

export default TextToolbar; 