import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  question: '',
  isAsking: false,
  error: null,
  conversationHistory: [], // Full conversation context for AI
  suggestedFollowUps: [], // AI-suggested next questions
  currentDocumentId: null, // Track which document this conversation belongs to
  conversationStarted: null, // Timestamp of conversation start
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const message = {
        ...action.payload,
        id: action.payload.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: action.payload.timestamp || new Date().toISOString(),
      };
      state.messages.push(message);
      
      // Add to conversation history for AI context
      state.conversationHistory.push({
        role: action.payload.type === 'user' ? 'user' : 'assistant',
        content: action.payload.content,
      });
      
      // Update conversation start time if first message
      if (!state.conversationStarted) {
        state.conversationStarted = message.timestamp;
      }
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
      state.conversationHistory = [];
      state.suggestedFollowUps = [];
      state.conversationStarted = null;
    },
    setSuggestedFollowUps: (state, action) => {
      state.suggestedFollowUps = action.payload;
    },
    setCurrentDocumentId: (state, action) => {
      const newDocId = action.payload;
      // Clear messages when switching documents
      if (newDocId !== state.currentDocumentId && state.currentDocumentId !== null) {
        state.messages = [];
        state.conversationHistory = [];
        state.suggestedFollowUps = [];
        state.conversationStarted = null;
      }
      state.currentDocumentId = newDocId;
    },
    // New: Add conversation branching
    createConversationBranch: (state, action) => {
      const { fromMessageId } = action.payload;
      const branchIndex = state.messages.findIndex(m => m.id === fromMessageId);
      if (branchIndex >= 0) {
        // Keep messages up to branch point
        state.messages = state.messages.slice(0, branchIndex + 1);
        state.conversationHistory = state.conversationHistory.slice(0, branchIndex + 1);
      }
    },
  },
});

export const { 
  addMessage, 
  setQuestion, 
  clearQuestion, 
  setIsAsking, 
  setError, 
  clearMessages,
  setSuggestedFollowUps,
  setCurrentDocumentId,
  createConversationBranch,
} = chatSlice.actions;

export default chatSlice.reducer;
