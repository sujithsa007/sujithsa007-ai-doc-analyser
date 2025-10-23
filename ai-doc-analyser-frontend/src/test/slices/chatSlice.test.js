import { describe, it, expect } from 'vitest';
import chatReducer, {
  addMessage,
  setQuestion,
  clearQuestion,
  setIsAsking,
  setError,
  clearMessages
} from '../../store/slices/chatSlice';

describe('chatSlice', () => {
  const initialState = {
    messages: [],
    question: '',
    isAsking: false,
    error: null,
  };

  it('should return initial state', () => {
    expect(chatReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle addMessage', () => {
    const message = {
      role: 'user',
      content: 'Test question',
      timestamp: '12:00:00'
    };
    const actual = chatReducer(initialState, addMessage(message));
    expect(actual.messages).toHaveLength(1);
    expect(actual.messages[0]).toEqual(message);
  });

  it('should handle multiple messages', () => {
    let state = chatReducer(initialState, addMessage({ role: 'user', content: 'Q1' }));
    state = chatReducer(state, addMessage({ role: 'assistant', content: 'A1' }));
    expect(state.messages).toHaveLength(2);
  });

  it('should handle setQuestion', () => {
    const question = 'What is this document about?';
    const actual = chatReducer(initialState, setQuestion(question));
    expect(actual.question).toBe(question);
  });

  it('should handle clearQuestion', () => {
    const stateWithQuestion = { ...initialState, question: 'Test question' };
    const actual = chatReducer(stateWithQuestion, clearQuestion());
    expect(actual.question).toBe('');
  });

  it('should handle setIsAsking', () => {
    const actual = chatReducer(initialState, setIsAsking(true));
    expect(actual.isAsking).toBe(true);
  });

  it('should handle setError', () => {
    const error = 'API error';
    const actual = chatReducer(initialState, setError(error));
    expect(actual.error).toBe(error);
  });

  it('should handle clearMessages', () => {
    const stateWithMessages = {
      ...initialState,
      messages: [{ role: 'user', content: 'test' }]
    };
    const actual = chatReducer(stateWithMessages, clearMessages());
    expect(actual.messages).toEqual([]);
  });
});
