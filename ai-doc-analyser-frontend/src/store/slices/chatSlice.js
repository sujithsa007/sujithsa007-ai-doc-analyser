import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  question: '',
  isAsking: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setQuestion: (state, action) => {
      state.question = action.payload;
    },
    clearQuestion: (state) => {
      state.question = '';
    },
    setIsAsking: (state, action) => {
      state.isAsking = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { 
  addMessage, 
  setQuestion, 
  clearQuestion, 
  setIsAsking, 
  setError, 
  clearMessages 
} = chatSlice.actions;

export default chatSlice.reducer;
