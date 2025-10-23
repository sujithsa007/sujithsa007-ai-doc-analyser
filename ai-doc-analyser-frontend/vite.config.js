/**
 * Vite Configuration
 * 
 * Optimized build configuration for the LangChain PDF Chat Frontend
 * Features:
 * - React fast refresh for development
 * - PDF.js optimization for large PDF handling
 * - Code splitting and chunk optimization
 * - Development server configuration
 * - Production build optimizations
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  // React plugin with fast refresh
  plugins: [
    react({
      // Enable fast refresh for better development experience
      fastRefresh: true,
    }),
  ],
  
  // Dependency optimization for faster development builds
  optimizeDeps: {
    include: [
      // Pre-bundle PDF.js for faster loading
      'pdfjs-dist',
      'pdfjs-dist/build/pdf.worker.min.mjs',
      // Pre-bundle Redux toolkit for better performance
      '@reduxjs/toolkit',
      'react-redux',
      // Pre-bundle axios for API calls
      'axios',
    ],
    // Force re-optimization on dependency changes
    force: false,
  },
  
  // Build configuration for production
  build: {
    // Output directory
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: true,
    // Minimize output
    minify: 'terser',
    // Target modern browsers for better optimization
    target: 'es2020',
    
    // Rollup options for advanced bundling
    rollupOptions: {
      // Code splitting configuration
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['react', 'react-dom'],
          // Redux chunk for state management
          redux: ['@reduxjs/toolkit', 'react-redux'],
          // PDF chunk for PDF processing
          pdf: ['pdfjs-dist'],
          // Utils chunk for utilities
          utils: ['axios'],
        },
        // Chunk file naming
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
        assetFileNames: 'assets/[ext]/[name].[hash].[ext]',
      },
    },
    
    // Terser options for minification
    terserOptions: {
      compress: {
        // Remove console logs in production
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    open: true, // Auto-open browser
    cors: true, // Enable CORS
    
    // File system configuration
    fs: {
      allow: ['..'], // Allow access to parent directories
    },
    
    // Proxy API requests to backend (optional)
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:5000',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // },
  },
  
  // Preview server configuration (for production build testing)
  preview: {
    port: 4173,
    host: true,
    open: true,
  },
  
  // Path resolution
  resolve: {
    alias: {
      // Convenience aliases for imports
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@assets': resolve(__dirname, 'src/assets'),
    },
  },
  
  // CSS configuration
  css: {
    // Enable CSS modules if needed
    modules: false,
    // PostCSS configuration
    postcss: {},
    // CSS preprocessing options
    preprocessorOptions: {},
  },
  
  // Environment variables
  define: {
    // Custom environment variables
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
});
