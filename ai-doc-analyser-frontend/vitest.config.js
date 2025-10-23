/**
 * Vitest Configuration for Frontend Testing
 * 
 * Optimized testing configuration for React components and utilities
 * Features:
 * - Happy DOM for fast DOM simulation
 * - React Testing Library integration
 * - Code coverage reporting
 * - Performance optimizations
 * - Comprehensive test environment setup
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  // React plugin for JSX transformation
  plugins: [react()],
  
  // Test configuration
  test: {
    // Global test utilities (describe, it, expect, etc.)
    globals: true,
    
    // Use Happy DOM for faster tests than jsdom
    environment: 'happy-dom',
    
    // Setup files run before each test file
    setupFiles: ['./src/test/setup.js'],
    
    // Include patterns for test files
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.config.js',
    ],
    
    // Test timeout settings
    testTimeout: 10000, // 10 seconds for component tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    
    // Coverage configuration
    coverage: {
      provider: 'v8', // Fast V8 coverage
      reporter: [
        'text',        // Console output
        'text-summary', // Brief summary
        'json',        // JSON report
        'html',        // HTML report
        'lcov',        // LCOV format for CI
      ],
      
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      
      // Files to include in coverage
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
      ],
      
      // Files to exclude from coverage
      exclude: [
        'node_modules/**',
        'src/test/**',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/main.jsx',           // Entry point
        'src/vite-env.d.ts',      // Type definitions
        '**/*.config.{js,ts}',    // Configuration files
        '**/index.{js,jsx,ts,tsx}', // Index files
      ],
      
      // Coverage output directory
      reportsDirectory: './coverage',
    },
    
    // Watch mode settings
    watch: {
      // Ignore file changes in these directories
      ignore: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
      ],
    },
    
    // Reporter configuration
    reporter: [
      'default',    // Default console reporter
      'verbose',    // Detailed output
      'json',       // JSON output for CI
    ],
    
    // Output directory for test results
    outputFile: {
      json: './test-results/results.json',
    },
  },
  
  // Path resolution (same as main vite config)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@test': resolve(__dirname, 'src/test'),
    },
  },
  
  // Define environment variables for tests
  define: {
    __TEST_ENV__: true,
    __APP_VERSION__: JSON.stringify('test'),
  },
});
