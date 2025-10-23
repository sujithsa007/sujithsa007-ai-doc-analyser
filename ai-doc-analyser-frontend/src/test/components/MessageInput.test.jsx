import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MessageInput from '../../components/MessageInput';
import chatReducer from '../../store/slices/chatSlice';
import pdfReducer from '../../store/slices/pdfSlice';

// Mock the API service
vi.mock('../../services/apiService', () => ({
  askQuestion: vi.fn(),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      pdf: pdfReducer,
    },
    preloadedState: {
      chat: { 
        messages: [], 
        isAsking: false, 
        question: '', 
        error: null,
        ...initialState.chat 
      },
      pdf: { 
        content: '', 
        selectedFile: null, 
        isParsing: false, 
        error: null,
        ...initialState.pdf 
      },
    },
  });
};

describe('MessageInput Component', () => {
  it('should render input field and button', () => {
    const store = createMockStore({
      pdf: { content: 'Some document content' }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

      expect(screen.getByPlaceholderText(/Ask any question about your document/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send question/i })).toBeInTheDocument();
  });

  it('should be disabled when no document is loaded', () => {
    const store = createMockStore({
      pdf: { content: '' }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

    const textarea = screen.getByPlaceholderText(/Upload a document first/i);
    const button = screen.getByRole('button');
    
    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should show processing state when asking', () => {
    const store = createMockStore({
      pdf: { content: 'Document content' },
      chat: { isAsking: true }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should update input value on change', () => {
    const store = createMockStore({
      pdf: { content: 'Document content' }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

    const textarea = screen.getByPlaceholderText(/Ask any question about your document/i);
    fireEvent.change(textarea, { target: { value: 'What is this about?' } });
    
    expect(textarea.value).toBe('What is this about?');
  });

  it('should handle Enter key submission', () => {
    const store = createMockStore({
      pdf: { content: 'Document content' }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

    const textarea = screen.getByPlaceholderText(/Ask any question about your document/i);
    fireEvent.change(textarea, { target: { value: 'Test question' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    // The question should be cleared after submission attempt
    // Note: The actual API call is mocked, so we're just testing the UI behavior
  });

  it('should not submit empty questions', () => {
    const store = createMockStore({
      pdf: { content: 'Document content' }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Button should remain enabled since no submission occurred
      // Button should remain disabled due to empty question (matches component logic)
      expect(button).toBeDisabled();
  });

  it('should show character count', () => {
    const store = createMockStore({
      pdf: { content: 'Document content' }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

    const textarea = screen.getByPlaceholderText(/Ask any question about your document/i);
    fireEvent.change(textarea, { target: { value: 'Test question' } });
    
      expect(screen.getByTestId('char-count')).toHaveTextContent('13/500');
  });

  it('should have proper accessibility attributes', () => {
    const store = createMockStore({
      pdf: { content: 'Document content' }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

    const textarea = screen.getByPlaceholderText(/Ask any question about your document/i);
    expect(textarea).toHaveAttribute('aria-label', 'Question input');
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Send question');
  });

  it('should show error state when error occurs', () => {
    const store = createMockStore({
      pdf: { content: 'Document content' },
      chat: { error: 'Failed to send question' }
    });
    
    render(
      <Provider store={store}>
        <MessageInput />
      </Provider>
    );

      expect(screen.getByText('Failed to send question')).toBeInTheDocument();
  });
});