import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatMessages from '../../components/ChatMessages';
import chatReducer from '../../store/slices/chatSlice';
import pdfReducer from '../../store/slices/pdfSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      pdf: pdfReducer,
    },
    preloadedState: initialState,
  });
};

describe('ChatMessages Component', () => {
  it('should show empty state when no messages', () => {
    const store = createMockStore({
      chat: { messages: [], isAsking: false },
      pdf: { content: 'Test content' }
    });

    render(
      <Provider store={store}>
        <ChatMessages />
      </Provider>
    );

    expect(screen.getByText(/Ready to analyze your document!/i)).toBeInTheDocument();
  });

  it('should render user message', () => {
    const store = createMockStore({
      chat: {
        messages: [{
          role: 'user',
          content: 'Test question',
          timestamp: '12:00:00'
        }],
        isAsking: false
      },
      pdf: { content: 'Test content' }
    });

    render(
      <Provider store={store}>
        <ChatMessages />
      </Provider>
    );

    expect(screen.getByText('Test question')).toBeInTheDocument();
    expect(screen.getByText('12:00:00')).toBeInTheDocument();
  });

  it('should render assistant message', () => {
    const store = createMockStore({
      chat: {
        messages: [{
          role: 'assistant',
          content: 'Test answer',
          timestamp: '12:01:00'
        }],
        isAsking: false
      },
      pdf: { content: 'Test content' }
    });

    render(
      <Provider store={store}>
        <ChatMessages />
      </Provider>
    );

    expect(screen.getByText('Test answer')).toBeInTheDocument();
  });

  it('should show thinking indicator when asking', () => {
    const store = createMockStore({
      chat: { messages: [], isAsking: true },
      pdf: { content: 'Test content' }
    });

    render(
      <Provider store={store}>
        <ChatMessages />
      </Provider>
    );

    expect(screen.getByText('AI is thinking')).toBeInTheDocument();
  });

  it('should render multiple messages in conversation', () => {
    const store = createMockStore({
      chat: {
        messages: [
          { role: 'user', content: 'Question 1', timestamp: '12:00:00' },
          { role: 'assistant', content: 'Answer 1', timestamp: '12:01:00' },
          { role: 'user', content: 'Question 2', timestamp: '12:02:00' },
        ],
        isAsking: false
      },
      pdf: { content: 'Test content' }
    });

    render(
      <Provider store={store}>
        <ChatMessages />
      </Provider>
    );

    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });
});
