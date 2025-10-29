import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Sidebar from '../../components/Sidebar';
import chatReducer from '../../store/slices/chatSlice';
import pdfReducer from '../../store/slices/pdfSlice';
import uiReducer from '../../store/slices/uiSlice';

// Mock the services
vi.mock('../../services/pdfService', () => ({
  extractTextFromPDF: vi.fn(),
  validatePDFFile: vi.fn(),
}));

vi.mock('../../services/apiService', () => ({
  uploadDocument: vi.fn(),
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      pdf: pdfReducer,
      ui: uiReducer,
    },
    preloadedState: {
      chat: {
        messages: [],
        isAsking: false,
        question: '',
        error: null,
        conversationHistory: [],
        suggestedFollowUps: [],
        currentDocumentId: null,
        conversationStarted: null,
        ...initialState.chat
      },
      pdf: {
        content: '',
        selectedFile: null,
        isParsing: false,
        error: null,
        documents: [],
        activeDocumentId: null,
        documentStats: {},
        comparisonMode: false,
        selectedForComparison: [],
        ...initialState.pdf
      },
      ui: {
        showPreview: false,
        ...initialState.ui
      },
    },
  });
};

describe('Sidebar Component', () => {
  it('should render document manager title', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    expect(screen.getByText('Document Manager')).toBeInTheDocument();
  });

  it('should render upload button', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    expect(screen.getByText('Choose Documents')).toBeInTheDocument();
  });

  it('should show processing state when parsing', () => {
    const store = createMockStore({
      pdf: { isParsing: true }
    });
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Processing document...')).toBeInTheDocument();
  });

  it('should show file info when document is loaded', () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const store = createMockStore({
      pdf: { 
        selectedFile: mockFile,
        content: 'This is test content for the document.',
        isParsing: false 
      }
    });
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText(/words/)).toBeInTheDocument();
    expect(screen.getByText(/chars/)).toBeInTheDocument();
  });

  it('should show error state when error occurs', () => {
    const store = createMockStore({
      pdf: { error: 'Failed to process document' }
    });
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    expect(screen.getByText('Failed to process document')).toBeInTheDocument();
  });

  it('should show preview button when document is loaded', () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const store = createMockStore({
      pdf: { 
        selectedFile: mockFile,
        content: 'Test content',
        isParsing: false 
      }
    });
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    expect(screen.getByText('Show Preview')).toBeInTheDocument();
  });

  it('should toggle preview button text', () => {
    const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const store = createMockStore({
      pdf: { 
        selectedFile: mockFile,
        content: 'Test content',
        isParsing: false 
      },
      ui: { showPreview: true }
    });
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    expect(screen.getByText('Hide Preview')).toBeInTheDocument();
  });

  it('should disable upload button when parsing', () => {
    const store = createMockStore({
      pdf: { isParsing: true }
    });
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    const uploadButton = screen.getByText('Processing...');
    expect(uploadButton).toBeDisabled();
  });

  it('should have correct file input accept attribute', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', '.pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.txt,.md,.html,.rtf,.odt,.ods');
  });

  it('should have accessibility attributes', () => {
    const store = createMockStore();
    
    render(
      <Provider store={store}>
        <Sidebar />
      </Provider>
    );

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('aria-label', 'Document management');
    
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('aria-label', 'Document file upload (multiple files supported)');
  });
});