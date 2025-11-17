/**
 * Constants Tests
 * Validates all application constants and configurations
 */

import { describe, it, expect } from 'vitest';
import * as constants from '../../constants';

describe('Constants', () => {
  describe('MESSAGE_TYPES', () => {
    it('should have all required message types', () => {
      expect(constants.MESSAGE_TYPES).toHaveProperty('USER');
      expect(constants.MESSAGE_TYPES).toHaveProperty('AI');
      expect(constants.MESSAGE_TYPES).toHaveProperty('SYSTEM');
      expect(constants.MESSAGE_TYPES).toHaveProperty('ERROR');
    });

    it('should have correct string values', () => {
      expect(constants.MESSAGE_TYPES.USER).toBe('user');
      expect(constants.MESSAGE_TYPES.AI).toBe('ai');
      expect(constants.MESSAGE_TYPES.SYSTEM).toBe('system');
      expect(constants.MESSAGE_TYPES.ERROR).toBe('error');
    });
  });

  describe('MESSAGE_ROLES', () => {
    it('should have all required roles', () => {
      expect(constants.MESSAGE_ROLES).toHaveProperty('USER');
      expect(constants.MESSAGE_ROLES).toHaveProperty('ASSISTANT');
      expect(constants.MESSAGE_ROLES).toHaveProperty('SYSTEM');
    });

    it('should match LLM role conventions', () => {
      expect(constants.MESSAGE_ROLES.USER).toBe('user');
      expect(constants.MESSAGE_ROLES.ASSISTANT).toBe('assistant');
      expect(constants.MESSAGE_ROLES.SYSTEM).toBe('system');
    });
  });

  describe('FILE_SIZE', () => {
    it('should have reasonable max file size', () => {
      expect(constants.FILE_SIZE.MAX).toBe(50 * 1024 * 1024); // 50MB
      expect(constants.FILE_SIZE.MAX).toBeGreaterThan(0);
    });

    it('should have warning threshold less than max', () => {
      expect(constants.FILE_SIZE.WARNING_THRESHOLD).toBeLessThan(constants.FILE_SIZE.MAX);
      expect(constants.FILE_SIZE.WARNING_THRESHOLD).toBe(10 * 1024 * 1024); // 10MB
    });
  });

  describe('FILE_TYPES', () => {
    it('should have all supported file types', () => {
      expect(constants.FILE_TYPES).toHaveProperty('PDF');
      expect(constants.FILE_TYPES).toHaveProperty('WORD');
      expect(constants.FILE_TYPES).toHaveProperty('EXCEL');
      expect(constants.FILE_TYPES).toHaveProperty('IMAGE');
      expect(constants.FILE_TYPES).toHaveProperty('TEXT');
    });

    it('should have valid MIME types', () => {
      expect(constants.FILE_TYPES.PDF).toBe('application/pdf');
      expect(constants.FILE_TYPES.WORD).toContain('wordprocessingml');
      expect(constants.FILE_TYPES.EXCEL).toContain('spreadsheetml');
      expect(constants.FILE_TYPES.IMAGE).toBe('image/*');
    });
  });

  describe('EXPORT_FORMATS', () => {
    it('should have all export formats', () => {
      const expectedFormats = ['EXCEL', 'WORD', 'PDF', 'POWERPOINT', 'CSV', 'JSON', 'MARKDOWN', 'HTML', 'TEXT'];
      expectedFormats.forEach(format => {
        expect(constants.EXPORT_FORMATS).toHaveProperty(format);
      });
    });

    it('should have lowercase format values', () => {
      Object.values(constants.EXPORT_FORMATS).forEach(value => {
        expect(value).toBe(value.toLowerCase());
      });
    });
  });

  describe('API_CONFIG', () => {
    it('should have base URL configured', () => {
      expect(constants.API_CONFIG).toHaveProperty('BASE_URL');
      expect(typeof constants.API_CONFIG.BASE_URL).toBe('string');
    });

    it('should have reasonable timeout values', () => {
      expect(constants.API_CONFIG.REQUEST_TIMEOUT).toBeGreaterThan(0);
      expect(constants.API_CONFIG.HEALTH_CHECK_TIMEOUT).toBeGreaterThan(0);
      expect(constants.API_CONFIG.REQUEST_TIMEOUT).toBeGreaterThan(
        constants.API_CONFIG.HEALTH_CHECK_TIMEOUT
      );
    });
  });

  describe('API_ENDPOINTS', () => {
    it('should have all required endpoints', () => {
      expect(constants.API_ENDPOINTS).toHaveProperty('ASK');
      expect(constants.API_ENDPOINTS).toHaveProperty('UPLOAD');
      expect(constants.API_ENDPOINTS).toHaveProperty('ANALYZE');
      expect(constants.API_ENDPOINTS).toHaveProperty('EXPORT');
      expect(constants.API_ENDPOINTS).toHaveProperty('HEALTH');
    });

    it('should have valid endpoint paths', () => {
      Object.values(constants.API_ENDPOINTS).forEach(endpoint => {
        expect(endpoint).toMatch(/^\//);
      });
    });
  });

  describe('ERROR_CODES', () => {
    it('should have all error codes', () => {
      const expectedCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR', 'UNAUTHORIZED', 'NOT_FOUND'];
      expectedCodes.forEach(code => {
        expect(constants.ERROR_CODES).toHaveProperty(code);
      });
    });

    it('should have uppercase error code values', () => {
      Object.values(constants.ERROR_CODES).forEach(code => {
        expect(code).toBe(code.toUpperCase());
      });
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have messages for all error scenarios', () => {
      expect(constants.ERROR_MESSAGES).toHaveProperty('NETWORK');
      expect(constants.ERROR_MESSAGES).toHaveProperty('TIMEOUT');
      expect(constants.ERROR_MESSAGES).toHaveProperty('SERVER');
      expect(constants.ERROR_MESSAGES).toHaveProperty('FILE_TOO_LARGE');
    });

    it('should have non-empty error messages', () => {
      Object.values(constants.ERROR_MESSAGES).forEach(message => {
        expect(message.length).toBeGreaterThan(0);
        expect(typeof message).toBe('string');
      });
    });
  });

  describe('DEFAULTS', () => {
    it('should have sensible default values', () => {
      expect(constants.DEFAULTS.EMPTY_CONTENT).toBe('');
      expect(constants.DEFAULTS.DEFAULT_PAGE).toBe(1);
      expect(constants.DEFAULTS.DEFAULT_ZOOM).toBe(1.0);
    });

    it('should have valid zoom constraints', () => {
      expect(constants.DEFAULTS.MIN_ZOOM).toBeLessThan(constants.DEFAULTS.DEFAULT_ZOOM);
      expect(constants.DEFAULTS.MAX_ZOOM).toBeGreaterThan(constants.DEFAULTS.DEFAULT_ZOOM);
      expect(constants.DEFAULTS.ZOOM_STEP).toBeGreaterThan(0);
    });
  });

  describe('VALIDATION', () => {
    it('should have validation rules', () => {
      expect(constants.VALIDATION).toHaveProperty('MIN_QUESTION_LENGTH');
      expect(constants.VALIDATION).toHaveProperty('MAX_QUESTION_LENGTH');
      expect(constants.VALIDATION).toHaveProperty('MIN_FILE_SIZE');
      expect(constants.VALIDATION).toHaveProperty('MAX_FILE_SIZE');
    });

    it('should have reasonable validation limits', () => {
      expect(constants.VALIDATION.MIN_QUESTION_LENGTH).toBeGreaterThan(0);
      expect(constants.VALIDATION.MAX_QUESTION_LENGTH).toBeGreaterThan(
        constants.VALIDATION.MIN_QUESTION_LENGTH
      );
      expect(constants.VALIDATION.MAX_FILE_SIZE).toBe(constants.FILE_SIZE.MAX);
    });
  });

  describe('TEXT_ANALYSIS', () => {
    it('should have text analysis configuration', () => {
      expect(constants.TEXT_ANALYSIS).toHaveProperty('MIN_WORD_LENGTH');
      expect(constants.TEXT_ANALYSIS).toHaveProperty('MAX_KEYWORDS');
      expect(constants.TEXT_ANALYSIS).toHaveProperty('STOP_WORDS_THRESHOLD');
    });

    it('should have valid analysis parameters', () => {
      expect(constants.TEXT_ANALYSIS.MIN_WORD_LENGTH).toBeGreaterThan(0);
      expect(constants.TEXT_ANALYSIS.MAX_KEYWORDS).toBeGreaterThan(0);
      expect(constants.TEXT_ANALYSIS.STOP_WORDS_THRESHOLD).toBeGreaterThan(0);
      expect(constants.TEXT_ANALYSIS.STOP_WORDS_THRESHOLD).toBeLessThanOrEqual(1);
    });
  });

  describe('COMMON_WORDS', () => {
    it('should be a Set', () => {
      expect(constants.COMMON_WORDS).toBeInstanceOf(Set);
    });

    it('should contain common stop words', () => {
      expect(constants.COMMON_WORDS.has('the')).toBe(true);
      expect(constants.COMMON_WORDS.has('and')).toBe(true);
      expect(constants.COMMON_WORDS.has('a')).toBe(true);
    });

    it('should have reasonable number of words', () => {
      expect(constants.COMMON_WORDS.size).toBeGreaterThan(20);
      expect(constants.COMMON_WORDS.size).toBeLessThan(200);
    });
  });

  describe('SENTIMENT_KEYWORDS', () => {
    it('should have all sentiment categories', () => {
      expect(constants.SENTIMENT_KEYWORDS).toHaveProperty('POSITIVE');
      expect(constants.SENTIMENT_KEYWORDS).toHaveProperty('NEGATIVE');
      expect(constants.SENTIMENT_KEYWORDS).toHaveProperty('NEUTRAL');
    });

    it('should have arrays of keywords', () => {
      expect(Array.isArray(constants.SENTIMENT_KEYWORDS.POSITIVE)).toBe(true);
      expect(Array.isArray(constants.SENTIMENT_KEYWORDS.NEGATIVE)).toBe(true);
      expect(Array.isArray(constants.SENTIMENT_KEYWORDS.NEUTRAL)).toBe(true);
    });

    it('should have non-empty keyword arrays', () => {
      expect(constants.SENTIMENT_KEYWORDS.POSITIVE.length).toBeGreaterThan(0);
      expect(constants.SENTIMENT_KEYWORDS.NEGATIVE.length).toBeGreaterThan(0);
      expect(constants.SENTIMENT_KEYWORDS.NEUTRAL.length).toBeGreaterThan(0);
    });
  });

  describe('SENTIMENT_VALUES', () => {
    it('should have numeric sentiment values', () => {
      expect(constants.SENTIMENT_VALUES.POSITIVE).toBe(1);
      expect(constants.SENTIMENT_VALUES.NEGATIVE).toBe(-1);
      expect(constants.SENTIMENT_VALUES.NEUTRAL).toBe(0);
    });
  });

  describe('STATUS', () => {
    it('should have all status states', () => {
      expect(constants.STATUS).toHaveProperty('SUCCESS');
      expect(constants.STATUS).toHaveProperty('ERROR');
      expect(constants.STATUS).toHaveProperty('LOADING');
      expect(constants.STATUS).toHaveProperty('IDLE');
    });

    it('should have lowercase status values', () => {
      Object.values(constants.STATUS).forEach(status => {
        expect(status).toBe(status.toLowerCase());
      });
    });
  });

  describe('HEADERS', () => {
    it('should have HTTP header constants', () => {
      expect(constants.HEADERS).toHaveProperty('CONTENT_TYPE');
      expect(constants.HEADERS).toHaveProperty('AUTHORIZATION');
      expect(constants.HEADERS).toHaveProperty('JSON');
    });

    it('should have valid header values', () => {
      expect(constants.HEADERS.CONTENT_TYPE).toBe('Content-Type');
      expect(constants.HEADERS.AUTHORIZATION).toBe('Authorization');
      expect(constants.HEADERS.JSON).toBe('application/json');
    });
  });
});
