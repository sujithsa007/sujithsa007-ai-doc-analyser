import { describe, it, expect } from 'vitest';
import pdfReducer, {
  setContent,
  setSelectedFile,
  setIsParsing,
  setError,
  resetPdf
} from '../../store/slices/pdfSlice';

describe('pdfSlice', () => {
  const initialState = {
    documents: [],
    activeDocumentId: null,
    content: '',
    selectedFile: null,
    isParsing: false,
    error: null,
    documentStats: {},
    comparisonMode: false,
    selectedForComparison: [],
  };

  it('should return initial state', () => {
    expect(pdfReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setContent', () => {
    const content = 'Test PDF content';
    const actual = pdfReducer(initialState, setContent(content));
    expect(actual.content).toBe(content);
  });

  it('should handle setSelectedFile', () => {
    const file = { name: 'test.pdf', size: 1024 };
    const actual = pdfReducer(initialState, setSelectedFile(file));
    expect(actual.selectedFile).toEqual(file);
  });

  it('should handle setIsParsing', () => {
    const actual = pdfReducer(initialState, setIsParsing(true));
    expect(actual.isParsing).toBe(true);
  });

  it('should handle setError', () => {
    const error = 'Test error message';
    const actual = pdfReducer(initialState, setError(error));
    expect(actual.error).toBe(error);
  });

  it('should handle resetPdf', () => {
    const modifiedState = {
      content: 'Some content',
      selectedFile: { name: 'test.pdf' },
      isParsing: true,
      error: 'Some error',
    };
    const actual = pdfReducer(modifiedState, resetPdf());
    expect(actual).toEqual(initialState);
  });
});
