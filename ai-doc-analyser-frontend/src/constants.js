/**
 * Application constants and enums
 */

// Message types for chat
export const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai',
  SYSTEM: 'system',
  ERROR: 'error',
};

// Message roles for LLM context
export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
};

// UI limits and constraints
export const UI_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_PAGES: 1000,
  MAX_MESSAGE_LENGTH: 5000,
  MAX_CONVERSATION_HISTORY: 50,
};

// Default values
export const DEFAULTS = {
  EMPTY_CONTENT: '',
  DEFAULT_PAGE: 1,
  DEFAULT_ZOOM: 1.0,
  MAX_ZOOM: 3.0,
  MIN_ZOOM: 0.5,
  ZOOM_STEP: 0.25,
};

// Analysis templates
export const ANALYSIS_TEMPLATES = {
  SUMMARY: 'summary',
  DETAILED: 'detailed',
  COMPARE: 'compare',
  EXTRACT: 'extract',
  SEARCH: 'search',
};

// Export formats
export const EXPORT_FORMATS = {
  EXCEL: 'excel',
  WORD: 'word',
  PDF: 'pdf',
  POWERPOINT: 'powerpoint',
  CSV: 'csv',
  JSON: 'json',
  MARKDOWN: 'markdown',
  HTML: 'html',
  TEXT: 'text',
};

// API endpoints
export const API_ENDPOINTS = {
  ASK: '/ask',
  UPLOAD: '/upload',
  ANALYZE: '/analyze',
  EXPORT: '/analyze/export',
  FORMATS: '/formats',
  HEALTH: '/health',
  AUTH: '/auth',
};

// Status codes
export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
  IDLE: 'idle',
};
