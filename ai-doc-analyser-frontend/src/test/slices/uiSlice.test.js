import { describe, it, expect } from 'vitest';
import uiReducer, { togglePreview } from '../../store/slices/uiSlice';

describe('uiSlice', () => {
  const initialState = {
    showPreview: false,
  };

  it('should return initial state', () => {
    expect(uiReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle togglePreview from false to true', () => {
    const previousState = { showPreview: false };
    expect(uiReducer(previousState, togglePreview())).toEqual({
      showPreview: true,
    });
  });

  it('should handle togglePreview from true to false', () => {
    const previousState = { showPreview: true };
    expect(uiReducer(previousState, togglePreview())).toEqual({
      showPreview: false,
    });
  });

  it('should toggle preview multiple times', () => {
    let state = initialState;
    
    // Toggle to true
    state = uiReducer(state, togglePreview());
    expect(state.showPreview).toBe(true);
    
    // Toggle back to false
    state = uiReducer(state, togglePreview());
    expect(state.showPreview).toBe(false);
    
    // Toggle to true again
    state = uiReducer(state, togglePreview());
    expect(state.showPreview).toBe(true);
  });
});