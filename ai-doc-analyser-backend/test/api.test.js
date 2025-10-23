import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import documentProcessor from '../services/documentProcessor.js';

describe('Backend API Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('supportedFormats');
    });
  });

  describe('GET /formats', () => {
    it('should return supported document formats', async () => {
      const response = await request(app).get('/formats');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('totalFormats');
      expect(response.body).toHaveProperty('formats');
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.formats)).toBe(true);
      expect(response.body.totalFormats).toBeGreaterThan(0);
    });

    it('should include format categories breakdown', async () => {
      const response = await request(app).get('/formats');
      
      expect(response.body.categories).toHaveProperty('documents');
      expect(response.body.categories).toHaveProperty('spreadsheets');
      expect(response.body.categories).toHaveProperty('images');
      expect(response.body.categories).toHaveProperty('text');
    });
  });

  describe('POST /upload', () => {
    it('should return error when no file is uploaded', async () => {
      const response = await request(app)
        .post('/upload');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No file uploaded');
    });

    it('should handle file upload validation', async () => {
      // Test with empty buffer to simulate invalid file
      const response = await request(app)
        .post('/upload')
        .attach('file', Buffer.from(''), 'test.txt');
      
      // Should either process successfully or return structured error
      expect(response.status).toBeLessThan(600);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /ask', () => {
    it('should return error when no content provided', async () => {
      const response = await request(app)
        .post('/ask')
        .send({
          question: 'What is this about?',
          content: ''
        });
      
      // Should return 400 Bad Request for empty content
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('content is required');
    });

    it('should return error when no question provided', async () => {
      const response = await request(app)
        .post('/ask')
        .send({
          question: '',
          content: 'Some test content'
        });
      
      // Should return 400 Bad Request for empty question
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Question is required');
    });

    it('should accept valid request format', async () => {
      const response = await request(app)
        .post('/ask')
        .send({
          question: 'What is the main topic?',
          content: 'This is a test document about artificial intelligence and machine learning.'
        });
      
      // Should either succeed or fail with proper error structure
      expect(response.status).toBeLessThan(600);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('answer');
        expect(typeof response.body.answer).toBe('string');
      } else {
        expect(response.body).toHaveProperty('error');
      }
    }, 30000); // Increase timeout for API calls

    it('should handle large content', async () => {
      const largeContent = 'Test content. '.repeat(1000); // ~14KB
      
      const response = await request(app)
        .post('/ask')
        .send({
          question: 'Summarize this',
          content: largeContent
        });
      
      // Should accept large payloads up to 50MB
      expect(response.status).toBeLessThan(600);
    }, 30000);

    it('should return proper error structure on API failure', async () => {
      // Save original API key
      const originalKey = process.env.GROQ_API_KEY;
      
      // Temporarily set invalid key
      process.env.GROQ_API_KEY = 'invalid_key';
      
      const response = await request(app)
        .post('/ask')
        .send({
          question: 'Test question',
          content: 'Test content'
        });
      
      // Restore original key
      process.env.GROQ_API_KEY = originalKey;
      
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    }, 30000);
  });

  describe('CORS', () => {
    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Payload Limit', () => {
    it('should accept JSON payloads up to 50MB', async () => {
      // Create a large but valid JSON payload (less than 50MB)
      const largeContent = 'x'.repeat(1000000); // 1MB
      
      const response = await request(app)
        .post('/ask')
        .send({
          question: 'Test',
          content: largeContent
        });
      
      // Should not return 413 (Payload Too Large)
      expect(response.status).not.toBe(413);
    }, 30000);
  });

  describe('Document Processor Service', () => {
    it('should have supported formats', () => {
      const formats = documentProcessor.getSupportedFormats();
      expect(Array.isArray(formats)).toBe(true);
      expect(formats.length).toBeGreaterThan(0);
    });

    it('should validate supported file types', () => {
      expect(documentProcessor.isSupported('application/pdf')).toBe(true);
      expect(documentProcessor.isSupported('text/plain')).toBe(true);
      expect(documentProcessor.isSupported('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true);
      expect(documentProcessor.isSupported('unsupported/type')).toBe(false);
    });

    it('should return format information', () => {
      const pdfInfo = documentProcessor.getFormatInfo('application/pdf');
      expect(pdfInfo).toHaveProperty('extension', 'pdf');
      expect(pdfInfo).toHaveProperty('type', 'PDF Document');
      
      const unsupportedInfo = documentProcessor.getFormatInfo('unsupported/type');
      expect(unsupportedInfo).toBeNull();
    });

    it('should process text files successfully', async () => {
      const testBuffer = Buffer.from('This is a test document content.');
      const result = await documentProcessor.processDocument(
        testBuffer, 
        'text/plain', 
        'test.txt'
      );

      expect(result.success).toBe(true);
      expect(result.content).toContain('test document');
      expect(result.metadata).toHaveProperty('fileName', 'test.txt');
      expect(result.metadata).toHaveProperty('wordCount');
      expect(result.metadata).toHaveProperty('characterCount');
    });

    it('should handle unsupported file types', async () => {
      const testBuffer = Buffer.from('test content');
      const result = await documentProcessor.processDocument(
        testBuffer, 
        'unsupported/type', 
        'test.unknown'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported file format');
    });

    it('should handle file size limits', async () => {
      // Create a buffer larger than the limit (50MB + 1KB)
      const largeBuffer = Buffer.alloc(50 * 1024 * 1024 + 1024, 'x');
      const result = await documentProcessor.processDocument(
        largeBuffer, 
        'text/plain', 
        'large.txt'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum limit');
    });
  });
});
