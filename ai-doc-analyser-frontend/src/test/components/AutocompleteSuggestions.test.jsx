/**
 * AutocompleteSuggestions Component Tests
 * 
 * Tests autocomplete functionality including:
 * - Suggestion filtering
 * - Keyboard navigation
 * - Click selection
 * - Context detection
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AutocompleteSuggestions from '../AutocompleteSuggestions';
import pdfReducer from '../../store/slices/pdfSlice';
import chatReducer from '../../store/slices/chatSlice';

// Helper function to create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      pdf: pdfReducer,
      chat: chatReducer,
    },
    preloadedState: initialState,
  });
};

describe('AutocompleteSuggestions', () => {
  let mockStore;
  let mockOnSelect;
  let mockOnClose;

  beforeEach(() => {
    // Reset mocks before each test
    mockOnSelect = vi.fn();
    mockOnClose = vi.fn();
    
    // Create store with default state
    mockStore = createMockStore({
      pdf: {
        content: 'Sample contract document with terms and conditions',
        documents: [],
        isParsing: false,
      },
      chat: {
        messages: [],
        question: '',
        isAsking: false,
      },
    });
  });

  it('should render suggestions when query is provided', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="what is"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    expect(screen.getByText('Suggestions')).toBeInTheDocument();
  });

  it('should not render when query is too short', () => {
    const { container } = render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="w"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
  });

  it('should filter suggestions based on query', () => {
    render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="what are"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    // Should show suggestions containing "what are"
    expect(screen.getByText(/What are the key findings?/i)).toBeInTheDocument();
  });

  it('should call onSelect when suggestion is clicked', async () => {
    render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="summ"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const suggestion = screen.getByText(/Summarize the main points/i);
    fireEvent.click(suggestion);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(expect.stringContaining('Summarize'));
    });
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="what"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const closeButton = screen.getByLabelText('Close suggestions');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should detect legal document context', () => {
    const legalStore = createMockStore({
      pdf: {
        content: 'This contract agreement contains terms and conditions, liability clauses, and jurisdiction details.',
        documents: [],
        isParsing: false,
      },
      chat: {
        messages: [],
        question: '',
        isAsking: false,
      },
    });

    render(
      <Provider store={legalStore}>
        <AutocompleteSuggestions
          query="what are the"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    // Should show legal-specific suggestions
    expect(screen.getByText(/What are the key terms and conditions?/i)).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="what"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    // Test ArrowDown key
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    
    // First suggestion should be highlighted
    const suggestions = screen.getAllByRole('option');
    expect(suggestions[0]).toHaveAttribute('aria-selected', 'false');
    expect(suggestions[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('should close on Escape key', () => {
    render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="what"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show context-specific suggestions for financial documents', () => {
    const financialStore = createMockStore({
      pdf: {
        content: 'Financial report showing revenue, expenses, profit margins, and balance sheet details.',
        documents: [],
        isParsing: false,
      },
      chat: {
        messages: [],
        question: '',
        isAsking: false,
      },
    });

    render(
      <Provider store={financialStore}>
        <AutocompleteSuggestions
          query="what is"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    // Should show financial-specific suggestions
    expect(screen.getByText(/What is the total revenue?/i)).toBeInTheDocument();
  });

  it('should limit suggestions to maximum 6 items', () => {
    render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="what"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    const suggestions = screen.getAllByRole('option');
    expect(suggestions.length).toBeLessThanOrEqual(6);
  });

  it('should show helper text for keyboard shortcuts', () => {
    render(
      <Provider store={mockStore}>
        <AutocompleteSuggestions
          query="what"
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      </Provider>
    );

    expect(screen.getByText(/Use ↑↓ to navigate/i)).toBeInTheDocument();
    expect(screen.getByText(/Enter to select/i)).toBeInTheDocument();
  });
});
