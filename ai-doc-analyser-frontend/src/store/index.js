import { configureStore } from '@reduxjs/toolkit';
import pdfReducer from './slices/pdfSlice';
import chatReducer from './slices/chatSlice';
import uiReducer from './slices/uiSlice';
import analysisReducer from './slices/analysisSlice';

export const store = configureStore({
  reducer: {
    pdf: pdfReducer,
    chat: chatReducer,
    ui: uiReducer,
    analysis: analysisReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore File objects in Redux state
        ignoredActions: ['pdf/setSelectedFile', 'pdf/addDocument'],
        ignoredPaths: ['pdf.selectedFile', 'pdf.documents'],
      },
    }),
});

export default store;
