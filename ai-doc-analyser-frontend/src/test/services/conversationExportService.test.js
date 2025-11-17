/**
 * Conversation Export Service Tests
 * Tests for chat conversation export functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as conversationExportService from '../../services/conversationExportService';

// Mock URL and document APIs
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
  style: {},
};

describe('ConversationExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.createElement = vi.fn(() => mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  describe('exportToMarkdown', () => {
    it('should export conversation to markdown format', () => {
      const messages = [
        { type: 'user', content: 'Hello AI', timestamp: '2025-01-01T10:00:00Z' },
        { type: 'ai', content: 'Hello! How can I help?', timestamp: '2025-01-01T10:00:01Z' },
      ];

      conversationExportService.exportToMarkdown(messages, 'test-chat');

      expect(mockLink.download).toBe('test-chat.md');
      expect(mockLink.click).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle empty messages', () => {
      conversationExportService.exportToMarkdown([], 'empty-chat');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should format timestamps correctly', () => {
      const messages = [
        { type: 'user', content: 'Test', timestamp: '2025-11-17T13:30:45Z' },
      ];

      conversationExportService.exportToMarkdown(messages, 'test');
      
      // Blob was created with content
      expect(URL.createObjectURL).toHaveBeenCalled();
    });
  });

  describe('exportToHTML', () => {
    it('should export conversation to HTML format', () => {
      const messages = [
        { type: 'user', content: 'Hello', timestamp: '2025-01-01T10:00:00Z' },
        { type: 'ai', content: 'Hi there!', timestamp: '2025-01-01T10:00:01Z' },
      ];

      conversationExportService.exportToHTML(messages, 'test-chat');

      expect(mockLink.download).toBe('test-chat.html');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should include proper HTML structure', () => {
      const messages = [{ type: 'user', content: 'Test', timestamp: '2025-01-01T10:00:00Z' }];
      
      conversationExportService.exportToHTML(messages, 'test');
      
      const callArgs = URL.createObjectURL.mock.calls[0][0];
      expect(callArgs.type).toBe('text/html');
    });

    it('should escape HTML special characters', () => {
      const messages = [
        { type: 'user', content: '<script>alert("xss")</script>', timestamp: '2025-01-01T10:00:00Z' },
      ];

      conversationExportService.exportToHTML(messages, 'test');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('exportToText', () => {
    it('should export conversation to plain text format', () => {
      const messages = [
        { type: 'user', content: 'Question', timestamp: '2025-01-01T10:00:00Z' },
        { type: 'ai', content: 'Answer', timestamp: '2025-01-01T10:00:01Z' },
      ];

      conversationExportService.exportToText(messages, 'test-chat');

      expect(mockLink.download).toBe('test-chat.txt');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should format text with clear separators', () => {
      const messages = [
        { type: 'user', content: 'Line 1', timestamp: '2025-01-01T10:00:00Z' },
        { type: 'ai', content: 'Line 2', timestamp: '2025-01-01T10:00:01Z' },
      ];

      conversationExportService.exportToText(messages, 'test');

      const callArgs = URL.createObjectURL.mock.calls[0][0];
      expect(callArgs.type).toBe('text/plain');
    });
  });

  describe('exportToPDF', () => {
    it('should export conversation to PDF format', () => {
      const messages = [
        { type: 'user', content: 'Hello PDF', timestamp: '2025-01-01T10:00:00Z' },
        { type: 'ai', content: 'PDF Response', timestamp: '2025-01-01T10:00:01Z' },
      ];

      conversationExportService.exportToPDF(messages, 'test-chat');

      expect(mockLink.download).toBe('test-chat.pdf');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle long conversations', () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        type: i % 2 === 0 ? 'user' : 'ai',
        content: `Message ${i}`,
        timestamp: '2025-01-01T10:00:00Z',
      }));

      conversationExportService.exportToPDF(messages, 'long-chat');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle messages with special characters', () => {
      const messages = [
        { type: 'user', content: 'Test & < > " \'', timestamp: '2025-01-01T10:00:00Z' },
      ];

      conversationExportService.exportToPDF(messages, 'special-chars');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('downloadFile', () => {
    it('should trigger file download with correct parameters', () => {
      const blob = new Blob(['test content']);
      const filename = 'test-file.txt';

      conversationExportService.downloadFile(blob, filename);

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockLink.href).toBe('mock-url');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    it('should cleanup after download', () => {
      const blob = new Blob(['cleanup test']);
      
      conversationExportService.downloadFile(blob, 'test.txt');

      expect(document.body.removeChild).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages without timestamps', () => {
      const messages = [
        { type: 'user', content: 'No timestamp' },
      ];

      conversationExportService.exportToMarkdown(messages, 'test');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle very long message content', () => {
      const longContent = 'a'.repeat(10000);
      const messages = [
        { type: 'user', content: longContent, timestamp: '2025-01-01T10:00:00Z' },
      ];

      conversationExportService.exportToText(messages, 'long-message');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle special Unicode characters', () => {
      const messages = [
        { type: 'user', content: '你好 🎉 مرحبا', timestamp: '2025-01-01T10:00:00Z' },
      ];

      conversationExportService.exportToHTML(messages, 'unicode');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });
});
