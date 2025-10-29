/**
 * Analysis Slice
 * Manages document analysis, templates, insights, and advanced features
 */
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Auto-generated summaries
  summaries: {}, // {documentId: {summary, keyPoints, entities, actionItems}}
  
  // Question templates
  templates: {
    legal: {
      name: 'Legal Document Review',
      icon: '⚖️',
      questions: [
        'What are the key terms and conditions?',
        'What are the parties involved and their obligations?',
        'What are the important dates and deadlines?',
        'Are there any liability clauses or limitations?',
        'What are the termination conditions?',
      ],
    },
    academic: {
      name: 'Research Paper Analysis',
      icon: '🎓',
      questions: [
        'What is the main research question or hypothesis?',
        'What methodology was used in this study?',
        'What are the key findings and conclusions?',
        'What are the limitations mentioned?',
        'What future research directions are suggested?',
      ],
    },
    business: {
      name: 'Business Report Review',
      icon: '💼',
      questions: [
        'What are the key performance metrics?',
        'What are the main recommendations?',
        'What are the identified risks and opportunities?',
        'What action items are mentioned?',
        'What is the financial impact or budget?',
      ],
    },
    hr: {
      name: 'Resume Screening',
      icon: '👤',
      questions: [
        'What is the candidate\'s work experience?',
        'What are the key skills and qualifications?',
        'What is their educational background?',
        'Are there any notable achievements or certifications?',
        'Does the candidate meet our requirements?',
      ],
    },
    financial: {
      name: 'Financial Document Analysis',
      icon: '💰',
      questions: [
        'What are the key financial figures?',
        'What is the revenue and profit trend?',
        'What are the major expenses?',
        'Are there any red flags or concerns?',
        'What is the overall financial health?',
      ],
    },
  },
  
  customTemplates: [], // User-created templates
  
  // Document intelligence
  insights: {}, // {documentId: {sentiment, topics, complexity, readingTime}}
  
  // Search and filtering
  searchHistory: [],
  savedSearches: {},
  
  // Comparison results
  comparisons: [], // {id, documentIds, results, timestamp}
  
  // Export history
  exports: [], // {id, type, timestamp, filename}
  
  // Active analysis state
  activeTemplate: null,
  isAnalyzing: false,
  analysisProgress: 0,
};

const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    // Summary management
    setSummary: (state, action) => {
      const { documentId, summary } = action.payload;
      state.summaries[documentId] = summary;
    },
    
    // Template management
    setActiveTemplate: (state, action) => {
      state.activeTemplate = action.payload;
    },
    
    addCustomTemplate: (state, action) => {
      state.customTemplates.push({
        id: `template-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString(),
      });
    },
    
    removeCustomTemplate: (state, action) => {
      state.customTemplates = state.customTemplates.filter(
        t => t.id !== action.payload
      );
    },
    
    updateCustomTemplate: (state, action) => {
      const { id, updates } = action.payload;
      const template = state.customTemplates.find(t => t.id === id);
      if (template) {
        Object.assign(template, updates);
      }
    },
    
    // Insights management
    setInsights: (state, action) => {
      const { documentId, insights } = action.payload;
      state.insights[documentId] = insights;
    },
    
    // Search management
    addSearchHistory: (state, action) => {
      state.searchHistory.unshift({
        query: action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 searches
      if (state.searchHistory.length > 50) {
        state.searchHistory = state.searchHistory.slice(0, 50);
      }
    },
    
    saveSearch: (state, action) => {
      const { name, query, filters } = action.payload;
      const id = `search-${Date.now()}`;
      state.savedSearches[id] = {
        id,
        name,
        query,
        filters,
        createdAt: new Date().toISOString(),
      };
    },
    
    removeSavedSearch: (state, action) => {
      delete state.savedSearches[action.payload];
    },
    
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    
    // Comparison management
    addComparison: (state, action) => {
      state.comparisons.unshift({
        id: `comparison-${Date.now()}`,
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 20 comparisons
      if (state.comparisons.length > 20) {
        state.comparisons = state.comparisons.slice(0, 20);
      }
    },
    
    removeComparison: (state, action) => {
      state.comparisons = state.comparisons.filter(
        c => c.id !== action.payload
      );
    },
    
    // Export management
    addExport: (state, action) => {
      state.exports.unshift({
        id: `export-${Date.now()}`,
        ...action.payload,
        timestamp: new Date().toISOString(),
      });
      // Keep only last 50 exports
      if (state.exports.length > 50) {
        state.exports = state.exports.slice(0, 50);
      }
    },
    
    // Analysis state
    setAnalyzing: (state, action) => {
      state.isAnalyzing = action.payload;
    },
    
    setAnalysisProgress: (state, action) => {
      state.analysisProgress = action.payload;
    },
    
    // Batch operations
    clearAllAnalysis: (state) => {
      state.summaries = {};
      state.insights = {};
      state.comparisons = [];
    },
  },
});

export const {
  setSummary,
  setActiveTemplate,
  addCustomTemplate,
  removeCustomTemplate,
  updateCustomTemplate,
  setInsights,
  addSearchHistory,
  saveSearch,
  removeSavedSearch,
  clearSearchHistory,
  addComparison,
  removeComparison,
  addExport,
  setAnalyzing,
  setAnalysisProgress,
  clearAllAnalysis,
} = analysisSlice.actions;

export default analysisSlice.reducer;
