// Export all text utility functions from a single entry point
import { drawActiveText, drawTextSelectionPreview } from './TextRenderer';
import { isClickOutsideTextArea, calculateTextDimensions } from './TextGeometry';
import { 
  startTextInputAtPosition, 
  handleTextInput, 
  updateTextDimensions, 
  confirmTextInput,
  handleEditTextClick
} from './TextEditor';

export {
  // From TextRenderer
  drawActiveText,
  drawTextSelectionPreview,
  
  // From TextGeometry
  isClickOutsideTextArea,
  calculateTextDimensions,
  
  // From TextEditor
  startTextInputAtPosition,
  handleTextInput,
  updateTextDimensions,
  confirmTextInput,
  handleEditTextClick
}; 