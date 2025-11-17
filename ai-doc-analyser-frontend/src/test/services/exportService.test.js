/**
 * Export Service Tests
 * Simplified tests for export functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as exportService from '../../services/exportService';

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('ExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectExportFormat', () => {
    it('should detect Excel format', () => {
      expect(exportService.detectExportFormat('export to excel')).toBe('excel');
      expect(exportService.detectExportFormat('download as xlsx')).toBe('excel');
    });

    it('should detect Word format', () => {
      expect(exportService.detectExportFormat('export to word document')).toBe('word');
      expect(exportService.detectExportFormat('create a word file')).toBe('word');
    });

    it('should detect PDF format', () => {
      expect(exportService.detectExportFormat('export to pdf')).toBe('pdf');
    });

    it('should detect PowerPoint format', () => {
      expect(exportService.detectExportFormat('create powerpoint')).toBe('powerpoint');
      expect(exportService.detectExportFormat('pptx presentation')).toBe('powerpoint');
    });

    it('should detect CSV format', () => {
      expect(exportService.detectExportFormat('export to csv')).toBe('csv');
    });

    it('should detect JSON format', () => {
      expect(exportService.detectExportFormat('export to json')).toBe('json');
    });

    it('should default to excel', () => {
      expect(exportService.detectExportFormat('export the data')).toBe('excel');
    });
  });

  describe('extractMergedDataFromResponse', () => {
    it('should extract data with mergedRecords', () => {
      const response = '{"mergedRecords":[{"name":"John"}],"keyField":"name"}';
      const result = exportService.extractMergedDataFromResponse(response);
      expect(result).not.toBeNull();
    });

    it('should handle markdown code blocks', () => {
      const response = '```json\n{"mergedRecords":[{"id":1}],"keyField":"id"}\n```';
      const result = exportService.extractMergedDataFromResponse(response);
      expect(result).not.toBeNull();
    });

    it('should return null for invalid data', () => {
      const response = 'No structured data here';
      const result = exportService.extractMergedDataFromResponse(response);
      expect(result).toBeNull();
    });

    it('should return null for empty response', () => {
      const result = exportService.extractMergedDataFromResponse('');
      expect(result).toBeNull();
    });
  });
});
