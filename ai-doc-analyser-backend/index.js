/**
 * LangChain Backend Server Entry Point
 * 
 * This file serves as the main entry point for the LangChain backend server.
 * It imports the configured Express app and starts the server with proper
 * environment configuration and error handling.
 */

import app from './app.js';

// Debug Railway environment
console.log('\n🔍 ===== RAILWAY ENVIRONMENT DEBUG =====');
console.log('PORT from env:', process.env.PORT);
console.log('HOST from env:', process.env.HOST);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GROQ_API_KEY present?', !!process.env.GROQ_API_KEY);
console.log('========================================\n');

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';  // Changed to 0.0.0.0 for Railway/cloud deployments

// Start server with enhanced error handling
try {
  const server = app.listen(PORT, HOST, () => {
    console.log("\n🚀 ===== LANGCHAIN BACKEND STARTED =====");
    console.log(`✅ Server running on ${HOST}:${PORT}`);
    console.log(`🌐 URL: http://${HOST}:${PORT}`);
    console.log(`🤖 AI Model: Groq LLaMA-3.3-70B`);
    console.log(`📡 API Endpoint: http://${HOST}:${PORT}/ask`);
    console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
    console.log(`⚡ Expected response time: 2-5 seconds`);
    console.log("=========================================\n");
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
