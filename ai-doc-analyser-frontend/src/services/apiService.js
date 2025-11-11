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
import { 
  API_CONFIG, 
  API_ENDPOINTS, 
  ERROR_CODES, 
  ERROR_MESSAGES,
  HEADERS 
} from '../constants';

// API Configuration
const API_BASE_URL = API_CONFIG.BASE_URL;
const REQUEST_TIMEOUT = API_CONFIG.REQUEST_TIMEOUT;
const HEALTH_CHECK_TIMEOUT = API_CONFIG.HEALTH_CHECK_TIMEOUT;

/**
 * Authentication Storage Keys
 */
const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user'
};

/**
 * Optimized Axios Instance
 * Pre-configured with timeouts, interceptors, and error handling
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': HEADERS.CONTENT_TYPE_JSON,
    'Accept': HEADERS.ACCEPT_JSON,
  },
});

// Request interceptor for authentication and logging
apiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    
    // Add JWT token to requests if available
    const token = localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging, error handling, and token refresh
apiClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(`✅ API Response: ${response.status} in ${duration}ms`);
    return response;
  },
  async (error) => {
    const duration = error.config?.metadata 
      ? Date.now() - error.config.metadata.startTime 
      : 0;
    
    console.error(`❌ API Error: ${error.response?.status || 'Network'} in ${duration}ms`);
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          console.log('🔄 Attempting to refresh access token...');
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Update stored tokens
          localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          
          // Retry original request with new token
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(error.config);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Clear auth data and redirect to login
        logout();
        throw new Error('Session expired. Please login again.');
      }
    }
    
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
    throw new Error(ERROR_MESSAGES.EMPTY_QUESTION);
  }
  
  const isMultiDoc = documents && Array.isArray(documents) && documents.length > 0;
  
  if (!isMultiDoc && !content?.trim()) {
    throw new Error(ERROR_MESSAGES.NO_CONTENT);
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

    const response = await apiClient.post(API_ENDPOINTS.ASK, requestBody);
    
    // Validate response structure
    if (!response.data?.answer) {
      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
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
    console.log('🔍 Error response:', error.response);
    console.log('🔍 Error response data:', error.response?.data);
    console.log('🔍 Error response status:', error.response?.status);
    
    if (error.response) {
      // Server responded with an error status
      const { status, data } = error.response;
      const errorMessage = data?.error || `Server error (${status})`;
      const errorCode = data?.code || 'SERVER_ERROR';
      
      console.log('🔍 Error details:', { status, errorCode, errorMessage, data });
      
      // Handle specific error codes - preserve full error message from backend
      switch (errorCode) {
        case ERROR_CODES.RATE_LIMIT_EXCEEDED:
        case ERROR_CODES.RATE_LIMIT_ERROR:
          console.log('🚫 Rate limit error detected in API service');
          // Preserve the full formatted message from backend
          throw new Error(errorMessage);
        
        case ERROR_CODES.TIMEOUT_ERROR:
          throw new Error(ERROR_MESSAGES.TIMEOUT);
        
        case ERROR_CODES.AUTH_ERROR:
          throw new Error('Authentication failed. The API key might be invalid or expired.');
        
        case ERROR_CODES.PAYLOAD_TOO_LARGE:
          throw new Error('Document(s) too large for processing. Please try with smaller files.');
        
        default:
          throw new Error(errorMessage);
      }
      
    } else if (error.request) {
      // Request made but no response received
      if (error.code === 'ECONNABORTED') {
        throw new Error(ERROR_MESSAGES.TIMEOUT);
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(`${ERROR_MESSAGES.CONNECTION_REFUSED} ${API_BASE_URL}`);
      } else {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
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
    const response = await apiClient.get(API_ENDPOINTS.HEALTH, { 
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
 * Get API Quota Status
 * 
 * Fetches current Groq API quota usage and remaining limits
 * 
 * @returns {Promise<Object>} Quota statistics
 */
export const getApiQuota = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.QUOTA, {
      timeout: API_CONFIG.QUOTA_CHECK_TIMEOUT
    });
    
    console.log('📊 API Quota Status:', response.data.quota);
    return {
      success: true,
      quota: response.data.quota,
      message: response.data.message
    };
    
  } catch (error) {
    console.warn('⚠️ Failed to fetch quota status:', error.message);
    return {
      success: false,
      quota: null,
      error: error.message
    };
  }
};

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
    throw new Error(ERROR_MESSAGES.NO_FILE);
  }

  console.log('📤 Uploading document:', {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    fileType: file.type
  });

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post(API_ENDPOINTS.UPLOAD, formData, {
      headers: {
        'Content-Type': HEADERS.CONTENT_TYPE_FORM,
      },
      timeout: API_CONFIG.UPLOAD_TIMEOUT,
    });

    if (!response.data?.success) {
      throw new Error(ERROR_MESSAGES.UPLOAD_FAILED);
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
      throw new Error(ERROR_MESSAGES.SERVER_UNAVAILABLE);
    } else {
      throw new Error(error.message || ERROR_MESSAGES.PROCESSING_ERROR);
    }
  }
};

/**
 * Authentication Functions
 */

/**
 * Login user
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and tokens
 */
export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    
    const { accessToken, refreshToken, user } = response.data;
    
    // Store auth data
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    
    console.log('✅ Login successful:', user.email);
    
    return response.data;
  } catch (error) {
    console.error('❌ Login failed:', error);
    throw new Error(error.response?.data?.error || 'Login failed');
  }
};

/**
 * Register new user
 * 
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User data and tokens
 */
export const register = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    
    const { accessToken, refreshToken, user } = response.data;
    
    // Store auth data
    localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
    
    console.log('✅ Registration successful:', user.email);
    
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error);
    throw new Error(error.response?.data?.error || 'Registration failed');
  }
};

/**
 * Logout user
 */
export const logout = () => {
  const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  
  // Attempt to logout on server
  if (refreshToken) {
    apiClient.post('/auth/logout', { refreshToken }).catch(err => {
      console.warn('Server logout failed:', err);
    });
  }
  
  // Clear local storage
  localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  
  console.log('✅ Logged out successfully');
};

/**
 * Get current user
 * 
 * @returns {Object|null} Current user or null if not authenticated
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user is authenticated
 * 
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Auto-login with default admin credentials (temporary for testing)
 * This should be removed in production
 */
export const autoLoginAdmin = async () => {
  try {
    console.log('🔐 Auto-logging in with default admin...');
    await login('admin@aidoc.local', 'Machten@007');
    return true;
  } catch (error) {
    console.error('❌ Auto-login failed:', error);
    return false;
  }
};

// Export the configured client for testing and advanced usage (e.g., custom stubbing)
export { apiClient };
