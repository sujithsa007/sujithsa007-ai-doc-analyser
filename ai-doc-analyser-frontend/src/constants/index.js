/**
 * Application Constants
 * 
 * Central location for all constant values used throughout the application.
 * This helps maintain consistency and makes it easier to update values.
 */

// ============================================================================
// API Configuration
// ============================================================================

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  REQUEST_TIMEOUT: 120000, // 2 minutes for AI processing
  HEALTH_CHECK_TIMEOUT: 5000, // 5 seconds for health checks
  UPLOAD_TIMEOUT: 300000, // 5 minutes for large file uploads with OCR
  QUOTA_CHECK_TIMEOUT: 5000, // 5 seconds for quota checks
};

export const API_ENDPOINTS = {
  ASK: '/ask',
  HEALTH: '/health',
  QUOTA: '/quota',
  UPLOAD: '/upload',
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMIT: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
};

// ============================================================================
// UI Configuration
// ============================================================================

export const UI_LIMITS = {
  MAX_DOCUMENTS: 4, // Maximum documents for comparison
  MAX_SUGGESTIONS: 6, // Maximum autocomplete suggestions
  MIN_QUERY_LENGTH: 2, // Minimum query length for suggestions
  SUGGESTION_DELAY: 300, // Debounce delay for suggestions (ms)
};

export const ANIMATION = {
  DELAY_BETWEEN_QUESTIONS: 1000, // Delay between template questions (ms)
  PROGRESS_UPDATE_INTERVAL: 100, // Progress bar update interval (ms)
};

// ============================================================================
// Document Processing
// ============================================================================

export const DOCUMENT_TYPES = {
  GENERAL: 'general',
  CONTRACT: 'contract',
  LEGAL: 'legal',
  TECHNICAL: 'technical',
  FINANCIAL: 'financial',
  MEDICAL: 'medical',
  ACADEMIC: 'academic',
};

export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  TXT: 'text/plain',
};

export const FILE_SIZE = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  MAX_SIZE_MB: 10,
};

// ============================================================================
// Text Analysis
// ============================================================================

export const TEXT_ANALYSIS = {
  WORDS_PER_MINUTE: 200, // Average reading speed
  AVG_SYLLABLES_PER_WORD: 1.5, // For readability calculation
  SENTIMENT_THRESHOLD: 2, // Difference needed for positive/negative sentiment
};

export const SENTIMENT_VALUES = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral',
};

// ============================================================================
// Chat & Messages
// ============================================================================

export const MESSAGE_TYPES = {
  USER: 'user',
  AI: 'ai',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  ERROR: 'error',
};

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
};

// ============================================================================
// Template Categories
// ============================================================================

export const TEMPLATE_CATEGORIES = {
  ALL: 'All',
  LEGAL: 'Legal',
  BUSINESS: 'Business',
  TECHNICAL: 'Technical',
  ACADEMIC: 'Academic',
  FINANCIAL: 'Financial',
  MEDICAL: 'Medical',
  OTHER: 'Other',
};

export const TEMPLATE_TYPES = {
  BUILT_IN: 'built-in',
  CUSTOM: 'custom',
};

// ============================================================================
// Common Words (for analysis filtering)
// ============================================================================

export const COMMON_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having',
  'may', 'should', 'am'
]);

// ============================================================================
// Sentiment Keywords
// ============================================================================

export const SENTIMENT_KEYWORDS = {
  POSITIVE: [
    'good', 'great', 'excellent', 'best', 'better', 'positive', 'success', 'successful',
    'benefit', 'advantage', 'improve', 'effective', 'efficient', 'valuable', 'important',
    'significant', 'strong', 'high', 'increase', 'growth', 'opportunity', 'innovation',
    'innovative', 'reliable', 'quality', 'outstanding', 'remarkable', 'impressive',
    'exceptional', 'superior', 'premier', 'leading', 'advanced', 'modern', 'new',
    'enhanced', 'optimized', 'streamlined', 'breakthrough', 'achievement', 'accomplish'
  ],
  NEGATIVE: [
    'bad', 'poor', 'worst', 'worse', 'negative', 'fail', 'failure', 'failed',
    'problem', 'issue', 'risk', 'concern', 'difficult', 'challenge', 'weak', 'low',
    'decrease', 'decline', 'loss', 'error', 'mistake', 'flaw', 'defect', 'limitation',
    'limited', 'inadequate', 'insufficient', 'substandard', 'inferior', 'outdated',
    'obsolete', 'unreliable', 'unstable', 'vulnerable', 'critical', 'severe', 'serious'
  ]
};

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULTS = {
  FILE_NAME: 'Untitled',
  EMPTY_CONTENT: '',
  INITIAL_PROGRESS: 0,
  MAX_PROGRESS: 100,
  DEFAULT_CATEGORY: 'All',
  DEFAULT_SEARCH_QUERY: '',
  DOCUMENT_TYPE: 'general',
};

// ============================================================================
// Local Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  CHAT_HISTORY: 'ai-doc-analyser-chat-history',
  USER_PREFERENCES: 'ai-doc-analyser-preferences',
  RECENT_DOCUMENTS: 'ai-doc-analyser-recent-docs',
  CUSTOM_TEMPLATES: 'ai-doc-analyser-custom-templates',
};

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  NO_FILE: 'No file provided for upload',
  NO_DOCUMENT: 'Please upload a document first',
  NO_QUESTIONS: 'This template has no questions',
  EMPTY_QUESTION: 'Question cannot be empty',
  NO_CONTENT: 'Document content or documents array is required',
  UPLOAD_FAILED: 'Upload failed - invalid response from server',
  SERVER_UNAVAILABLE: 'Cannot connect to server. Please ensure the backend is running.',
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  TIMEOUT: 'Request timed out. The AI is taking longer than expected. Please try again.',
  CONNECTION_REFUSED: 'Cannot connect to the backend server. Please ensure the server is running on',
  RATE_LIMIT: 'Rate limit exceeded. Please try again later.',
  INVALID_RESPONSE: 'Invalid response format from server',
  PROCESSING_ERROR: 'Failed to process document',
};

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  DOCUMENT_UPLOADED: 'Document uploaded successfully',
  ANALYSIS_COMPLETE: 'Analysis completed',
  TEMPLATE_EXECUTED: 'Template executed successfully',
  FILE_EXPORTED: 'File exported successfully',
};

// ============================================================================
// Icons & Emojis
// ============================================================================

export const ICONS = {
  DOCUMENT: '📄',
  TEMPLATE: '📋',
  SEARCH: '🔍',
  UPLOAD: '📤',
  DOWNLOAD: '📥',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  PLAY: '▶️',
  STOP: '⏹️',
  HEALTH_OK: '💚',
  HEALTH_FAIL: '💔',
  AI: '🤖',
  ROCKET: '🚀',
  CHART: '📊',
  BOOK: '📚',
};

// ============================================================================
// HTTP Headers
// ============================================================================

export const HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_FORM: 'multipart/form-data',
  ACCEPT_JSON: 'application/json',
};

// ============================================================================
// Validation Rules
// ============================================================================

export const VALIDATION = {
  MIN_QUESTION_LENGTH: 1,
  MAX_QUESTION_LENGTH: 1000,
  MIN_CONTENT_LENGTH: 10,
  MIN_WORD_LENGTH_FOR_ANALYSIS: 2,
};

// ============================================================================
// Export All Constants
// ============================================================================

export default {
  API_CONFIG,
  API_ENDPOINTS,
  HTTP_STATUS,
  ERROR_CODES,
  UI_LIMITS,
  ANIMATION,
  DOCUMENT_TYPES,
  FILE_TYPES,
  FILE_SIZE,
  TEXT_ANALYSIS,
  SENTIMENT_VALUES,
  MESSAGE_TYPES,
  MESSAGE_ROLES,
  TEMPLATE_CATEGORIES,
  TEMPLATE_TYPES,
  COMMON_WORDS,
  SENTIMENT_KEYWORDS,
  DEFAULTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  ICONS,
  HEADERS,
  VALIDATION,
};
