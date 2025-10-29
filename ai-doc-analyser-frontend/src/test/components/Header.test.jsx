import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Header from '../../components/Header';
import pdfReducer from '../../store/slices/pdfSlice';
import chatReducer from '../../store/slices/chatSlice';
import uiReducer from '../../store/slices/uiSlice';

// Helper function to create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      pdf: pdfReducer,
      chat: chatReducer,
      ui: uiReducer,
    },
    preloadedState: initialState,
  });
};

// Helper function to render with Redux Provider
const renderWithProvider = (component, initialState = {}) => {
  const store = createTestStore(initialState);
  return render(<Provider store={store}>{component}</Provider>);
};

describe('Header Component', () => {
  it('should render the header with title', () => {
    renderWithProvider(<Header />);
    expect(screen.getByText(/AI Doc Analyser/i)).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    renderWithProvider(<Header />);
    expect(screen.getByText(/Upload any document.*and ask questions using AI/i)).toBeInTheDocument();
  });

  it('should have correct styling', () => {
    const { container } = renderWithProvider(<Header />);
    const headerDiv = container.firstChild;
    expect(headerDiv).toHaveStyle({ backgroundColor: '#fff' });
  });

  it('should have semantic HTML structure', () => {
    renderWithProvider(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
  });

  it('should include document icon', () => {
    renderWithProvider(<Header />);
    const icon = screen.getByLabelText('Document icon');
    expect(icon).toBeInTheDocument();
  });
});
