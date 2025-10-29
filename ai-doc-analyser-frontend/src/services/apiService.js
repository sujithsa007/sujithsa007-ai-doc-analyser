/**
 * API Service Module
 * 
 * Handles all communication with the LangChain backend server.
 * Features:
 * - Optimized axios configuration
 * - Comprehensive error handling
 * - Request/response interceptors
 * - Health check monitoring
 * - Retry logic for failed requests
 * - Performance tracking
 */

import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const REQUEST_TIMEOUT = 120000; // 2 minutes for AI processing
const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds for health checks

/**
 * Optimized Axios Instance
 * Pre-configured with timeouts, interceptors, and error handling
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for logging and performance tracking
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.status} in ${duration}ms`);
    return response;
  },
  (error) => {
    const duration = error.config?.metadata 
      ? Date.now() - error.config.metadata.startTime 
      : 0;
    
    console.error(`❌ API Error: ${error.response?.status || 'Network'} in ${duration}ms`);
    return Promise.reject(error);
  }
);

/**
 * Ask a question about document(s) using AI
 * 
 * Sends the document content(s) and user question to the AI backend
 * for intelligent analysis and response generation. Supports both single
 * and multi-document analysis with cross-document verification.
 * 
 * @param {string} question - User's question about the document(s)
 * @param {string} content - Full document text content (for single doc - backward compatibility)
 * @param {Array} documents - Array of document objects for multi-document analysis (optional)
 * @returns {Promise<string>} AI-generated answer
 * @throws {Error} Detailed error message for different failure scenarios
 */
export const askQuestion = async (question, content, documents = null) => {
  // Input validation
  if (!question?.trim()) {
    throw new Error('Question cannot be empty');
  }
  
  const isMultiDoc = documents && Array.isArray(documents) && documents.length > 0;
  
  if (!isMultiDoc && !content?.trim()) {
    throw new Error('Document content or documents array is required');
  }

  // Log request details
  console.log('🤖 Sending AI request:', {
    questionLength: question.length,
    mode: isMultiDoc ? 'multi-document' : 'single-document',
    documentCount: isMultiDoc ? documents.length : 1,
    timestamp: new Date().toISOString()
  });

  if (isMultiDoc) {
    console.log('📚 Documents:', documents.map((d, i) => ({
      index: i + 1,
      fileName: d.fileName,
      contentLength: d.content?.length || 0
    })));
  } else {
    console.log('📄 Single document content length:', content.length);
  }

  try {
    const requestBody = {
      question: question.trim(),
    };

    // Add either single content or multiple documents
    if (isMultiDoc) {
      requestBody.documents = documents;
    } else {
      requestBody.content = content.trim();
    }

    const response = await apiClient.post('/ask', requestBody);
    
    // Validate response structure
    if (!response.data?.answer) {
      throw new Error('Invalid response format from server');
    }
    
    // Log success metrics
    const metadata = response.data.metadata;
    if (metadata) {
      console.log('📊 AI Response Metrics:', {
        processingTime: metadata.processingTime,
        aiResponseTime: metadata.aiResponseTime,
        documentCount: metadata.documentCount,
        analysisMode: metadata.analysisMode
      });
    }
    
    return response.data.answer;
    
  } catch (error) {
    // Enhanced error handling with specific error types
    console.error('❌ AI Request Failed:', error);
    
    if (error.response) {
      // Server responded with an error status
      const { status, data } = error.response;
      const errorMessage = data?.error || `Server error (${status})`;
      const errorCode = data?.code || 'SERVER_ERROR';
      
      // Handle specific error codes
      switch (errorCode) {
        case 'TIMEOUT_ERROR':
          throw new Error('Request timed out. The document(s) might be too large or the server is busy. Please try again with smaller documents.');
        
        case 'AUTH_ERROR':
          throw new Error('Authentication failed. The API key might be invalid or expired.');
        
        case 'RATE_LIMIT_ERROR':
          throw new Error('Rate limit exceeded. Please wait a moment before making another request.');
        
        case 'PAYLOAD_TOO_LARGE':
          throw new Error('Document(s) too large for processing. Please try with smaller files.');
        
        default:
          throw new Error(errorMessage);
      }
      
    } else if (error.request) {
      // Request made but no response received
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. The AI is taking longer than expected. Please try again.');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to the backend server. Please ensure the server is running on ' + API_BASE_URL);
      } else {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
    } else {
      // Request setup error
      throw new Error(error.message || 'Failed to send request to AI service');
    }
  }
};

/**
 * Health Check Service
 * 
 * Verifies if the backend server is running and responsive.
 * Used for monitoring and user feedback.
 * 
 * @returns {Promise<Object>} Health status with server info
 * @throws {Error} If health check fails
 */
export const checkBackendHealth = async () => {
  try {
    const response = await apiClient.get('/health', { 
      timeout: HEALTH_CHECK_TIMEOUT 
    });
    
    console.log('💚 Backend Health Check: OK');
    return {
      status: 'healthy',
      data: response.data,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.warn('💔 Backend Health Check: Failed');
    
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Get API Configuration
 * 
 * Returns current API configuration for debugging and monitoring
 * 
 * @returns {Object} API configuration details
 */
export const getApiConfig = () => ({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  healthCheckTimeout: HEALTH_CHECK_TIMEOUT,
  version: '1.0.0'
});

/**
 * Test API Connection
 * 
 * Performs a comprehensive test of API connectivity and functionality
 * 
 * @returns {Promise<Object>} Test results
 */
export const testApiConnection = async () => {
  const results = {
    health: null,
    connectivity: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test health endpoint
    results.health = await checkBackendHealth();
    results.connectivity = results.health.status === 'healthy' ? 'success' : 'failed';
    
  } catch (error) {
    results.connectivity = 'failed';
    results.error = error.message;
  }
  
  return results;
};

/**
 * Upload and Process Document
 * 
 * Uploads a document to the backend for processing (supports multiple formats)
 * 
 * @param {File} file - Document file to upload
 * @returns {Promise<Object>} Processed document with text and metadata
 * @throws {Error} If upload or processing fails
 */
export const uploadDocument = async (file) => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  console.log('📤 Uploading document:', {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    fileType: file.type
  });

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes for large files and OCR processing
    });

    if (!response.data?.success) {
      throw new Error('Upload failed - invalid response from server');
    }

    console.log('✅ Document uploaded successfully:', response.data.metadata);

    return {
      text: response.data.content,  // Backend returns 'content', not 'text'
      metadata: response.data.metadata
    };

  } catch (error) {
    console.error('❌ Document upload failed:', error);

    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.error || `Upload failed (${status})`;
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error('Cannot connect to server. Please ensure the backend is running.');
    } else {
      throw new Error(error.message || 'Failed to upload document');
    }
  }
};

// Export the configured client for testing and advanced usage (e.g., custom stubbing)
export { apiClient };
