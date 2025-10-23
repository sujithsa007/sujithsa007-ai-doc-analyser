import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showPreview: true,
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
