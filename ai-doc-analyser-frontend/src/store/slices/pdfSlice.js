import { createSlice } from '@reduxjs/toolkit';
import { UI_LIMITS, DEFAULTS } from '../../constants';

const initialState = {
  documents: [], // Array of {id, file, content, metadata, summary, uploadedAt}
  activeDocumentId: null, // Currently selected document
  content: DEFAULTS.EMPTY_CONTENT, // Content of active document (for backward compatibility)
  selectedFile: null, // Active file (for backward compatibility)
  isParsing: false,
  error: null,
  documentStats: {}, // Statistics per document {id: {wordCount, pageCount, etc}}
  comparisonMode: false, // Multi-document comparison view
  selectedForComparison: [], // Array of document IDs to compare
};

const pdfSlice = createSlice({
  name: 'pdf',
  initialState,
  reducers: {
    setContent: (state, action) => {
      state.content = action.payload;
      // Update active document content
      if (state.activeDocumentId) {
        const doc = state.documents.find(d => d.id === state.activeDocumentId);
        if (doc) {
          doc.content = action.payload;
        }
      }
    },
    setSelectedFile: (state, action) => {
      state.selectedFile = action.payload;
    },
    setIsParsing: (state, action) => {
      state.isParsing = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetPdf: (state) => {
      return initialState;
    },
    
    // New multi-document features
    addDocument: (state, action) => {
      const doc = {
        id: action.payload.id || `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: action.payload.file,
        content: action.payload.content || '',
        metadata: action.payload.metadata || {},
        summary: action.payload.summary || null,
        uploadedAt: new Date().toISOString(),
        tags: action.payload.tags || [],
        category: action.payload.category || 'general',
      };
      state.documents.push(doc);
      
      // Set as active if first document
      if (state.documents.length === 1) {
        state.activeDocumentId = doc.id;
        state.content = doc.content;
        state.selectedFile = doc.file;
      }
    },
    
    setActiveDocument: (state, action) => {
      const docId = action.payload;
      state.activeDocumentId = docId;
      const doc = state.documents.find(d => d.id === docId);
      if (doc) {
        state.content = doc.content;
        state.selectedFile = doc.file;
      }
    },
    
    removeDocument: (state, action) => {
      const docId = action.payload;
      state.documents = state.documents.filter(d => d.id !== docId);
      state.selectedForComparison = state.selectedForComparison.filter(id => id !== docId);
      
      // Update active document if removed
      if (state.activeDocumentId === docId) {
        if (state.documents.length > 0) {
          const newActive = state.documents[0];
          state.activeDocumentId = newActive.id;
          state.content = newActive.content;
          state.selectedFile = newActive.file;
        } else {
          state.activeDocumentId = null;
          state.content = DEFAULTS.EMPTY_CONTENT;
          state.selectedFile = null;
        }
      }
    },
    
    updateDocumentSummary: (state, action) => {
      const { documentId, summary } = action.payload;
      const doc = state.documents.find(d => d.id === documentId);
      if (doc) {
        doc.summary = summary;
      }
    },
    
    updateDocumentMetadata: (state, action) => {
      const { documentId, metadata } = action.payload;
      const doc = state.documents.find(d => d.id === documentId);
      if (doc) {
        doc.metadata = { ...doc.metadata, ...metadata };
      }
    },
    
    setDocumentStats: (state, action) => {
      const { documentId, stats } = action.payload;
      state.documentStats[documentId] = stats;
    },
    
    toggleComparisonMode: (state) => {
      state.comparisonMode = !state.comparisonMode;
      if (!state.comparisonMode) {
        state.selectedForComparison = [];
      }
    },
    
    toggleDocumentForComparison: (state, action) => {
      const docId = action.payload;
      const index = state.selectedForComparison.indexOf(docId);
      if (index >= 0) {
        state.selectedForComparison.splice(index, 1);
      } else {
        // Limit to max documents for comparison
        if (state.selectedForComparison.length < UI_LIMITS.MAX_DOCUMENTS) {
          state.selectedForComparison.push(docId);
        }
      }
    },
    
    clearAllDocuments: (state) => {
      state.documents = [];
      state.activeDocumentId = null;
      state.content = DEFAULTS.EMPTY_CONTENT;
      state.selectedFile = null;
      state.documentStats = {};
      state.selectedForComparison = [];
      state.comparisonMode = false;
    },
    
    updateDocumentTags: (state, action) => {
      const { documentId, tags } = action.payload;
      const doc = state.documents.find(d => d.id === documentId);
      if (doc) {
        doc.tags = tags;
      }
    },
  },
});

export const { setContent, setSelectedFile, setIsParsing, setError, resetPdf,
  addDocument,
  setActiveDocument,
  removeDocument,
  updateDocumentSummary,
  updateDocumentMetadata,
  setDocumentStats,
  toggleComparisonMode,
  toggleDocumentForComparison,
  clearAllDocuments,
  updateDocumentTags,
 } = pdfSlice.actions;
export default pdfSlice.reducer;
