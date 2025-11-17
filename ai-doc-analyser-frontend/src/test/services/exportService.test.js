/**
 * Export Service Tests
 * Tests for multi-format export functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as exportService from '../../services/exportService';
import { apiClient } from '../../services/apiService';

// Mock apiClient
vi.mock('../../services/apiService', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document createElement
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
  style: {},
};

describe('ExportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.createElement = vi.fn(() => mockLink);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectExportFormat', () => {
    it('should detect Excel format from keywords', () => {
      expect(exportService.detectExportFormat('export to excel')).toBe('excel');
      expect(exportService.detectExportFormat('download as xlsx')).toBe('excel');
      expect(exportService.detectExportFormat('create spreadsheet')).toBe('excel');
    });

    it('should detect Word format from keywords', () => {
      expect(exportService.detectExportFormat('export to word')).toBe('word');
      expect(exportService.detectExportFormat('download as doc')).toBe('word');
      expect(exportService.detectExportFormat('create docx file')).toBe('word');
    });

    it('should detect PDF format from keywords', () => {
      expect(exportService.detectExportFormat('export to pdf')).toBe('pdf');
      expect(exportService.detectExportFormat('generate pdf document')).toBe('pdf');
    });

    it('should detect PowerPoint format from keywords', () => {
      expect(exportService.detectExportFormat('create powerpoint')).toBe('powerpoint');
      expect(exportService.detectExportFormat('export to ppt')).toBe('powerpoint');
      expect(exportService.detectExportFormat('generate pptx')).toBe('powerpoint');
    });

    it('should detect CSV format from keywords', () => {
      expect(exportService.detectExportFormat('export to csv')).toBe('csv');
      expect(exportService.detectExportFormat('download csv file')).toBe('csv');
    });

    it('should detect JSON format from keywords', () => {
      expect(exportService.detectExportFormat('export to json')).toBe('json');
      expect(exportService.detectExportFormat('download json data')).toBe('json');
    });

    it('should default to excel for ambiguous requests', () => {
      expect(exportService.detectExportFormat('export the data')).toBe('excel');
      expect(exportService.detectExportFormat('download file')).toBe('excel');
      expect(exportService.detectExportFormat('')).toBe('excel');
    });

    it('should be case insensitive', () => {
      expect(exportService.detectExportFormat('EXPORT TO EXCEL')).toBe('excel');
      expect(exportService.detectExportFormat('Export To Word')).toBe('word');
    });
  });

  describe('extractMergedDataFromResponse', () => {
    it('should extract JSON array from response', () => {
      const response = 'Here is the data: [{"name":"John","age":30},{"name":"Jane","age":25}]';
      const result = exportService.extractMergedDataFromResponse(response);
      expect(result).toEqual([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]);
    });

    it('should extract JSON object from response', () => {
      const response = 'The merged data is: {"summary":"test","count":5}';
      const result = exportService.extractMergedDataFromResponse(response);
      expect(result).toEqual([{ summary: 'test', count: 5 }]);
    });

    it('should handle response with markdown code blocks', () => {
      const response = '```json\n[{"name":"John"}]\n```';
      const result = exportService.extractMergedDataFromResponse(response);
      expect(result).toEqual([{ name: 'John' }]);
    });

    it('should return null for invalid JSON', () => {
      const response = 'This is not JSON data';
      const result = exportService.extractMergedDataFromResponse(response);
      expect(result).toBeNull();
    });

    it('should handle empty response', () => {
      const result = exportService.extractMergedDataFromResponse('');
      expect(result).toBeNull();
    });
  });

  describe('downloadMergedExcel', () => {
    it('should download Excel file with correct format', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const filename = 'test-export';

      apiClient.post.mockResolvedValue({
        data: new Blob(['mock-excel-data']),
        headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      });

      await exportService.downloadMergedExcel(data, filename);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/analyze/export',
        { mergedData: data, format: 'excel' },
        { responseType: 'blob' }
      );
      expect(mockLink.download).toBe('test-export.xlsx');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle download errors gracefully', async () => {
      const data = [{ name: 'Test' }];
      apiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(exportService.downloadMergedExcel(data, 'test')).rejects.toThrow('Network error');
    });
  });

  describe('downloadFromResponse', () => {
    it('should detect format and download Excel', async () => {
      const response = 'Export to excel: [{"name":"John"}]';
      const filename = 'data-export';

      apiClient.post.mockResolvedValue({
        data: new Blob(['mock-data']),
        headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      });

      const result = await exportService.downloadFromResponse(response, filename);

      expect(result.format).toBe('excel');
      expect(apiClient.post).toHaveBeenCalledWith(
        '/analyze/export',
        expect.objectContaining({ format: 'excel' }),
        { responseType: 'blob' }
      );
    });

    it('should detect format and download PDF', async () => {
      const response = 'Export to PDF: [{"name":"John"}]';
      const filename = 'data-export';

      apiClient.post.mockResolvedValue({
        data: new Blob(['mock-pdf']),
        headers: { 'content-type': 'application/pdf' },
      });

      const result = await exportService.downloadFromResponse(response, filename);

      expect(result.format).toBe('pdf');
      expect(mockLink.download).toBe('data-export.pdf');
    });

    it('should return null if no data found in response', async () => {
      const response = 'No data available';
      const result = await exportService.downloadFromResponse(response, 'test');
      expect(result).toBeNull();
    });

    it('should handle various formats correctly', async () => {
      const formats = [
        { text: 'export to word', format: 'word', ext: '.docx' },
        { text: 'export to powerpoint', format: 'powerpoint', ext: '.pptx' },
        { text: 'export to csv', format: 'csv', ext: '.csv' },
        { text: 'export to json', format: 'json', ext: '.json' },
      ];

      for (const { text, format, ext } of formats) {
        vi.clearAllMocks();
        const response = `${text}: [{"name":"Test"}]`;
        
        apiClient.post.mockResolvedValue({
          data: new Blob(['mock-data']),
          headers: { 'content-type': 'application/octet-stream' },
        });

        await exportService.downloadFromResponse(response, 'test');
        
        expect(apiClient.post).toHaveBeenCalledWith(
          '/analyze/export',
          expect.objectContaining({ format }),
          { responseType: 'blob' }
        );
        expect(mockLink.download).toBe(`test${ext}`);
      }
    });
  });

  describe('downloadFile', () => {
    it('should download file with correct extension', () => {
      const blob = new Blob(['test data']);
      const filename = 'test-file';
      const format = 'excel';

      exportService.downloadFile(blob, filename, format);

      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockLink.href).toBe('mock-url');
      expect(mockLink.download).toBe('test-file.xlsx');
      expect(mockLink.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    it('should handle different file formats', () => {
      const formats = [
        { format: 'word', ext: '.docx' },
        { format: 'pdf', ext: '.pdf' },
        { format: 'powerpoint', ext: '.pptx' },
        { format: 'csv', ext: '.csv' },
        { format: 'json', ext: '.json' },
      ];

      formats.forEach(({ format, ext }) => {
        vi.clearAllMocks();
        const blob = new Blob(['data']);
        exportService.downloadFile(blob, 'test', format);
        expect(mockLink.download).toBe(`test${ext}`);
      });
    });
  });
});
