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

// File size constants
export const FILE_SIZE = {
  MAX: 50 * 1024 * 1024, // 50MB
  WARNING_THRESHOLD: 10 * 1024 * 1024, // 10MB
};

// File types
export const FILE_TYPES = {
  PDF: 'application/pdf',
  WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  IMAGE: 'image/*',
  TEXT: 'text/plain',
  JSON: 'application/json',
  CSV: 'text/csv',
};

// Animation constants
export const ANIMATION = {
  DURATION: 300,
  EASING: 'ease-in-out',
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

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  REQUEST_TIMEOUT: 120000, // 2 minutes
  HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds
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

// HTTP Headers
export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  JSON: 'application/json',
};

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  TIMEOUT: 'Request timed out. Please try again.',
  SERVER: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Unauthorized. Please login again.',
  NOT_FOUND: 'Resource not found.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit of 50MB.',
  INVALID_FILE_TYPE: 'Invalid file type.',
};

// Text analysis constants
export const TEXT_ANALYSIS = {
  MIN_WORD_LENGTH: 3,
  MAX_KEYWORDS: 10,
  STOP_WORDS_THRESHOLD: 0.7,
};

// Common stop words to filter out
export const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
]);

// Sentiment analysis keywords
export const SENTIMENT_KEYWORDS = {
  POSITIVE: ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect', 'best', 'love', 'like'],
  NEGATIVE: ['bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'dislike', 'disappoint', 'fail'],
  NEUTRAL: ['okay', 'fine', 'average', 'normal', 'standard', 'typical', 'usual', 'ordinary'],
};

// Sentiment values
export const SENTIMENT_VALUES = {
  POSITIVE: 1,
  NEGATIVE: -1,
  NEUTRAL: 0,
};

// Validation rules
export const VALIDATION = {
  MIN_QUESTION_LENGTH: 3,
  MAX_QUESTION_LENGTH: 1000,
  MIN_FILE_SIZE: 1, // 1 byte
  MAX_FILE_SIZE: FILE_SIZE.MAX,
};

// Status codes
export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  LOADING: 'loading',
  IDLE: 'idle',
};
