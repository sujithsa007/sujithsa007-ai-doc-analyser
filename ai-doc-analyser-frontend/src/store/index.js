import { configureStore } from '@reduxjs/toolkit';
import pdfReducer from './slices/pdfSlice';
import chatReducer from './slices/chatSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    pdf: pdfReducer,
    chat: chatReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore File objects in Redux state
        ignoredActions: ['pdf/setSelectedFile'],
        ignoredPaths: ['pdf.selectedFile'],
      },
    }),
});

export default store;
