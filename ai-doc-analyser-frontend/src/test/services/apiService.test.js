import { describe, it, expect, vi, beforeEach } from 'vitest';
import { askQuestion, checkBackendHealth, uploadDocument, getApiConfig, testApiConnection, apiClient } from '../../services/apiService';

describe('apiService', () => {
  beforeEach(() => {
    // Reset implementations but keep spies intact; we directly spy on apiClient
    vi.restoreAllMocks();
  });

  describe('askQuestion', () => {
    it('should send question and return answer', async () => {
      const mockResponse = {
        data: {
          answer: 'This is the AI response',
          metadata: {
            processingTime: '2.5',
            aiResponseTime: '2.1',
            contentLength: 1000
          }
        },
        config: { metadata: { startTime: Date.now() } }
      };
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);
      const result = await askQuestion('What is this about?', 'Test document content');
      expect(postSpy).toHaveBeenCalledWith('/ask', { question: 'What is this about?', content: 'Test document content' });
      expect(result).toBe('This is the AI response');
    });

    it('should throw error for empty question', async () => {
      await expect(askQuestion('', 'content')).rejects.toThrow('Question cannot be empty');
    });

    it('should throw error for empty content', async () => {
      await expect(askQuestion('question', '')).rejects.toThrow('Document content is required');
    });

    it('should handle network errors', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue({ request: {}, code: 'ECONNREFUSED' });
      await expect(askQuestion('question', 'content')).rejects.toThrow('Cannot connect to the backend server');
    });

    it('should handle timeout errors', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue({ request: {}, code: 'ECONNABORTED' });
      await expect(askQuestion('question', 'content')).rejects.toThrow('Request timed out');
    });

    it('should handle server errors with error codes', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue({
        response: { status: 429, data: { error: 'Rate limit exceeded', code: 'RATE_LIMIT_ERROR' } }
      });
      await expect(askQuestion('question', 'content')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('checkBackendHealth', () => {
    it('should return healthy status when server responds', async () => {
      const mockResponse = { data: { status: 'ok', message: 'Server is running' } };
      vi.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);
      const result = await checkBackendHealth();
      expect(result.status).toBe('healthy');
      expect(result.data).toEqual(mockResponse.data);
    });

    it('should return unhealthy status when server fails', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Connection failed'));
      const result = await checkBackendHealth();
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = { data: { success: true, content: 'Extracted text content', metadata: { fileName: 'test.pdf', fileSize: 1024, processingTime: 500 } } };
      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);
      const result = await uploadDocument(mockFile);
      expect(result.text).toBe('Extracted text content');
      expect(result.metadata).toEqual(mockResponse.data.metadata);
    });

    it('should throw error for no file', async () => {
      await expect(uploadDocument(null)).rejects.toThrow('No file provided for upload');
    });

    it('should handle upload failure', async () => {
      const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      vi.spyOn(apiClient, 'post').mockRejectedValue({ response: { status: 400, data: { error: 'Invalid file format' } } });
      await expect(uploadDocument(mockFile)).rejects.toThrow('Invalid file format');
    });
  });

  describe('getApiConfig', () => {
    it('should return API configuration', () => {
      const config = getApiConfig();
      
      expect(config).toHaveProperty('baseURL');
      expect(config).toHaveProperty('timeout');
      expect(config).toHaveProperty('healthCheckTimeout');
      expect(config).toHaveProperty('version');
    });
  });

  describe('testApiConnection', () => {
    it('should test API connection successfully', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValue({ data: { status: 'ok' } });
      const result = await testApiConnection();
      expect(result.connectivity).toBe('success');
      expect(result.health.status).toBe('healthy');
    });

    it('should handle connection failure', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValue(new Error('Connection failed'));
      const result = await testApiConnection();
      expect(result.connectivity).toBe('failed');
      // When health check fails, results.health will have status 'unhealthy' and error message
      expect(result.health.status).toBe('unhealthy');
      expect(result.health.error).toBe('Connection failed');
    });
  });
});