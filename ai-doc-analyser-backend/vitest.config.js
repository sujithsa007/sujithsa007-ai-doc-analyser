/**
 * Vitest Configuration for Backend API Testing
 * 
 * Optimized testing configuration for Node.js/Express API tests
 * Features:
 * - Node.js environment simulation
 * - Extended timeouts for AI API calls
 * - Code coverage reporting
 * - Integration test support
 * - Performance monitoring
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Global test utilities available in all test files
    globals: true,
    
    // Node.js environment for backend testing
    environment: 'node',
    
    // Test file patterns
    include: [
      'test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      '*.config.js',
    ],
    
    // Timeout settings for AI API calls
    testTimeout: 30000,  // 30 seconds for AI responses
    hookTimeout: 10000,  // 10 seconds for setup/teardown
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: [
        'text',         // Console output
        'text-summary', // Brief summary
        'json',         // JSON report
        'html',         // HTML report
        'lcov',         // LCOV format for CI
      ],
      
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 75,    // Lower threshold for API tests
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      
      // Files to include in coverage
      include: [
        'app.js',
        'index.js',
        'src/**/*.{js,mjs,cjs,ts,mts,cts}',
      ],
      
      // Files to exclude from coverage
      exclude: [
        'node_modules/**',
        'test/**',
        '**/*.test.{js,mjs,cjs,ts,mts,cts}',
        '**/*.spec.{js,mjs,cjs,ts,mts,cts}',
        '**/*.config.{js,ts}',
        'coverage/**',
      ],
      
      // Coverage output directory
      reportsDirectory: './coverage',
    },
    
    // Watch mode settings
    watch: {
      ignore: [
        'node_modules/**',
        'coverage/**',
        '.env*',
      ],
    },
    
    // Reporter configuration
    reporter: [
      'default',
      'verbose',
      'json',
    ],
    
    // Output configuration
    outputFile: {
      json: './test-results/api-results.json',
    },
    
    // Environment variables for testing
    env: {
      NODE_ENV: 'test',
      // Ensure test environment doesn't interfere with development
      PORT: '5001',
    },
    
    // Sequential test execution for API tests
    // (prevents port conflicts and database race conditions)
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Run tests sequentially
      },
    },
    
    // Setup and teardown
    globalSetup: [],
    globalTeardown: [],
    
    // Retry configuration for flaky network tests
    retry: {
      // Retry failed tests up to 2 times
      max: 2,
    },
  },
  
  // Define test environment variables
  define: {
    __TEST_ENV__: true,
    __API_VERSION__: JSON.stringify('1.0.0'),
  },
});
