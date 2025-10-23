import { createSlice } from '@reduxjs/toolkit';

// Initial state updated: tests expect showPreview to default to false
const initialState = {
  showPreview: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    togglePreview: (state) => {
      state.showPreview = !state.showPreview;
    },
    setShowPreview: (state, action) => {
      state.showPreview = action.payload;
    },
  },
});

export const { togglePreview, setShowPreview } = uiSlice.actions;
export default uiSlice.reducer;
