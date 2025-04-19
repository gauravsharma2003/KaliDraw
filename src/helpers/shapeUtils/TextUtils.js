import { generateId } from './ShapeGeometry';

/**
 * Creates a text shape with the given properties
 * @param {string} text - The text content
 * @param {number} x - The x position
 * @param {number} y - The y position
 * @param {number} fontSize - The font size
 * @param {Object} options - Additional options for the text shape
 * @returns {Object} - The created text shape
 */
export const createText = (text, x, y, fontSize = 16, options = {}) => {
  const {
    color = '#f54a00',
    align = 'center',
    verticalAlign = 'middle',
    width = 150,
    height = 40,
    id = generateId()
  } = options;
  
  return {
    type: 'text',
    text,
    x,
    y,
    fontSize,
    color,
    align,
    verticalAlign,
    width,
    height,
    id
  };
};

/**
 * Scale a text shape by the given factor
 * @param {Object} textShape - The text shape to scale
 * @param {number} scaleFactor - The scaling factor
 * @returns {Object} - The scaled text shape
 */
export const scaleText = (textShape, scaleFactor) => {
  return {
    ...textShape,
    fontSize: textShape.fontSize * scaleFactor,
    width: textShape.width * scaleFactor,
    height: textShape.height * scaleFactor
  };
};

/**
 * Get the bounding box of a text shape
 * @param {Object} textShape - The text shape to get bounding box of
 * @returns {Object} - The bounding box with x, y, width, height
 */
export const getTextBoundingBox = (textShape) => {
  // Return the bounding box with top-left coordinates as stored in the text shape
  return {
    x: textShape.x,
    y: textShape.y,
    width: textShape.width,
    height: textShape.height
  };
};

/**
 * Update text properties (fontSize, alignment, etc.)
 * @param {Object} textShape - The text shape to update
 * @param {Object} properties - The properties to update
 * @returns {Object} - The updated text shape
 */
export const updateTextProperties = (textShape, properties) => {
  return {
    ...textShape,
    ...properties
  };
};

/**
 * Change text alignment
 * @param {Object} textShape - The text shape to update
 * @param {string} align - The new alignment
 * @returns {Object} - The updated text shape
 */
export const setTextAlignment = (textShape, align) => {
  return {
    ...textShape,
    align
  };
};

/**
 * Change vertical alignment
 * @param {Object} textShape - The text shape to update
 * @param {string} verticalAlign - The new vertical alignment
 * @returns {Object} - The updated text shape
 */
export const setTextVerticalAlignment = (textShape, verticalAlign) => {
  return {
    ...textShape,
    verticalAlign
  };
};

/**
 * Toggle bold formatting for text
 * @param {Object} textShape - The text shape to update
 * @returns {Object} - The updated text shape
 */
export const toggleBold = (textShape) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    fontWeight: textShape.fontWeight === 'bold' ? 'normal' : 'bold'
  };
};

/**
 * Toggle italic formatting for text
 * @param {Object} textShape - The text shape to update
 * @returns {Object} - The updated text shape
 */
export const toggleItalic = (textShape) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    fontStyle: textShape.fontStyle === 'italic' ? 'normal' : 'italic'
  };
};

/**
 * Toggle underline formatting for text
 * @param {Object} textShape - The text shape to update
 * @returns {Object} - The updated text shape
 */
export const toggleUnderline = (textShape) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    textDecoration: textShape.textDecoration === 'underline' ? 'none' : 'underline'
  };
};

/**
 * Change text color
 * @param {Object} textShape - The text shape to update
 * @param {string} color - The new color
 * @returns {Object} - The updated text shape
 */
export const setTextColor = (textShape, color) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    color
  };
};

/**
 * Update multiple text styles at once
 * @param {Object} textShape - The text shape to update
 * @param {Object} styles - Object containing style properties to update
 * @returns {Object} - The updated text shape
 */
export const updateTextStyle = (textShape, styles) => {
  if (!textShape || textShape.type !== 'text') return textShape;
  
  return {
    ...textShape,
    ...styles
  };
}; 