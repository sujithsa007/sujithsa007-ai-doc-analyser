import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  content: '',
  selectedFile: null,
  isParsing: false,
  error: null,
};

const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    setContent: (state, action) => {
      state.content = action.payload;
    },
    setSelectedFile: (state, action) => {
      state.selectedFile = action.payload;
    },
    setIsParsing: (state, action) => {
      state.isParsing = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetPdf: (state) => {
      return initialState;
    },
  },
});

export const { setContent, setSelectedFile, setIsParsing, setError, resetPdf } = pdfSlice.actions;
export default pdfSlice.reducer;
