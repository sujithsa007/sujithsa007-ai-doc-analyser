# ⚛️ PDF AI Assistant Frontend - Powered by LangChain

[![React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-purple.svg)](https://vitejs.dev/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.5.0-red.svg)](https://redux-toolkit.js.org/)
[![PDF.js](https://img.shields.io/badge/PDF.js-4.8.69-orange.svg)](https://mozilla.github.io/pdf.js/)
[![Tests](https://img.shields.io/badge/Tests-19%2F22%20Passing-green.svg)](./src/test/)

> **Modern React frontend for AI-powered PDF document analysis with lightning-fast performance**

A sophisticated React application for PDF AI Assistant built with the latest technologies, providing an intuitive interface for PDF document upload, AI-powered analysis, and interactive chat functionality. Optimized for performance with comprehensive state management and real-time document processing.

## ✨ Features

- 📋 **Drag & Drop PDF Upload** - Intuitive file handling with visual feedback
- 🤖 **AI-Powered Document Analysis** - Integration with LangChain backend API
- 💬 **Interactive Chat Interface** - Real-time Q&A about uploaded documents
- 👀 **PDF Preview** - Built-in PDF viewer with text extraction
- 🎯 **Smart State Management** - Redux Toolkit for predictable state updates
- ⚡ **Performance Optimized** - React.memo, useMemo, useCallback throughout
- 🎨 **Modern UI/UX** - Clean, responsive design with accessibility features
- 🧪 **Comprehensive Testing** - 22 test suites with Jest and React Testing Library
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 🏗️ Architecture

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   React App     │───▶│ Redux Store  │───▶│   Backend   │
│   Components    │    │ State Mgmt   │    │   API       │
└─────────────────┘    └──────────────┘    └─────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────┐
│   PDF.js        │    │  Service     │
│   Renderer      │    │   Layer      │
└─────────────────┘    └──────────────┘
```

## 📁 Project Structure

```
pdf-ai-frontend/
├── index.html              # Entry HTML template
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite build configuration
├── vitest.config.js        # Test configuration
├── eslint.config.js        # Code linting rules
├── public/                 # Static assets
├── src/
│   ├── main.jsx            # Application entry point
│   ├── App.jsx             # Root component
│   ├── index.css           # Global styles
│   ├── App.css             # Component styles
│   ├── components/         # Reusable UI components
│   │   ├── Header.jsx      # Application header
│   │   ├── Sidebar.jsx     # File upload sidebar
│   │   ├── ChatMessages.jsx # Chat message display
│   │   ├── MessageInput.jsx # Message input form
│   │   └── PDFPreview.jsx  # PDF document viewer
│   ├── store/              # Redux state management
│   │   ├── index.js        # Store configuration
│   │   └── slices/         # Redux slices
│   │       ├── chatSlice.js    # Chat state management
│   │       ├── pdfSlice.js     # PDF state management
│   │       └── uiSlice.js      # UI state management
│   ├── services/           # External API integration
│   │   ├── apiService.js   # Backend API communication
│   │   └── pdfService.js   # PDF processing utilities
│   └── test/               # Test suites
│       ├── setup.js        # Test environment setup
│       ├── components/     # Component tests
│       └── slices/         # State management tests
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20.19+ and npm 10+
- **Backend API** running on port 5000 (see [backend setup](../langchain-backend/))

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Development Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🎯 Component Overview

### Core Components

#### 1. **App.jsx** - Root Application Component
```javascript
/**
 * Main application component providing Redux store context
 * and global layout structure with semantic HTML5 elements
 * @returns {JSX.Element} Complete application UI
 */
```

**Features:**
- Redux Provider setup
- Global error boundaries
- Semantic HTML structure
- CSS Grid layout system

#### 2. **Header.jsx** - Application Header
```javascript
/**
 * Application header with branding and status indicators
 * Optimized with React.memo for performance
 * @returns {JSX.Element} Header component with accessibility features
 */
```

**Features:**
- Responsive branding
- Status indicators
- Accessibility compliance (ARIA labels)
- Performance optimization

#### 3. **Sidebar.jsx** - File Management Panel
```javascript
/**
 * PDF file upload and management interface with drag & drop
 * Real-time processing status and comprehensive error handling
 * @returns {JSX.Element} File management sidebar
 */
```

**Features:**
- Drag & drop file upload
- File type validation (PDF only)
- Processing status indicators
- Error handling and user feedback
- File size validation

#### 4. **ChatMessages.jsx** - Message Display
```javascript
/**
 * Optimized chat message display with virtual scrolling
 * Memoized for performance with large message histories
 * @returns {JSX.Element} Chat message list
 */
```

**Features:**
- Auto-scrolling to latest messages
- Message timestamps
- AI response indicators
- Performance optimization with React.memo
- Accessibility features

#### 5. **MessageInput.jsx** - Chat Input Form
```javascript
/**
 * Message input form with real-time validation
 * Handles user questions and API communication
 * @returns {JSX.Element} Message input interface
 */
```

**Features:**
- Real-time input validation
- Auto-focus management
- Loading states
- Keyboard shortcuts (Enter to send)
- Character count display

#### 6. **PDFPreview.jsx** - Document Viewer
```javascript
/**
 * PDF.js powered document viewer with text extraction
 * Advanced rendering with zoom and navigation controls
 * @returns {JSX.Element} PDF viewer component
 */
```

**Features:**
- Full PDF rendering with PDF.js
- Text extraction for AI processing
- Zoom and navigation controls
- Page thumbnails
- Document metadata display

## 🗂️ State Management Architecture

### Redux Store Structure

```javascript
store: {
  pdf: {
    file: null,           // Current PDF file
    content: "",          // Extracted text content
    isProcessing: false,  // Processing status
    error: null,          // Error messages
    metadata: {}          // File information
  },
  chat: {
    messages: [],         // Chat history
    isLoading: false,     // API request status
    error: null           // Error messages
  },
  ui: {
    sidebarOpen: true,    // Sidebar visibility
    darkMode: false,      // Theme preference
    notifications: []     // User notifications
  }
}
```

### State Slices

#### PDF Slice (`pdfSlice.js`)
- File upload management
- Text extraction coordination
- Processing status tracking
- Error state handling

#### Chat Slice (`chatSlice.js`)
- Message history management
- API communication status
- Response handling
- Error management

#### UI Slice (`uiSlice.js`)
- Interface state management
- Theme preferences
- Notification system
- Layout control

## 🌐 API Integration

### Backend Communication (`apiService.js`)

#### Service Configuration
```javascript
/**
 * Axios instance with interceptors for request/response handling
 * Comprehensive error handling and retry logic
 * Performance monitoring and timeout management
 */
```

**Features:**
- Axios interceptors for global error handling
- Request/response logging
- Timeout configuration
- Retry logic for failed requests
- Performance metrics collection

#### API Methods
```javascript
// Send question with document content
askQuestion(question, content)

// Health check endpoint
checkHealth()

// Get processing status
getStatus()
```

### PDF Processing (`pdfService.js`)

#### Text Extraction Engine
```javascript
/**
 * Advanced PDF.js integration with intelligent text extraction
 * Optimized algorithms for accurate content parsing
 * Support for complex document layouts
 */
```

**Features:**
- Multi-page text extraction
- Layout-aware text positioning
- Font and styling detection
- Image and table handling
- Metadata extraction

#### Processing Pipeline
1. **File Validation** - Type and size checks
2. **PDF Parsing** - Document structure analysis
3. **Text Extraction** - Content parsing with positioning
4. **Quality Assurance** - Content validation and cleanup
5. **Store Integration** - Redux state updates

## 🧪 Testing Strategy

### Test Coverage
- **19/22 tests passing** ✅ (86% success rate)
- **Component Testing** - React Testing Library
- **State Management Testing** - Redux slice validation
- **Integration Testing** - API service mocking
- **Accessibility Testing** - Screen reader compatibility

### Test Categories

#### Component Tests
```bash
src/test/components/
├── Header.test.jsx         # Header component testing
├── ChatMessages.test.jsx   # Message display testing
├── Sidebar.test.jsx        # File upload testing
├── MessageInput.test.jsx   # Input form testing
└── PDFPreview.test.jsx     # PDF viewer testing
```

#### State Management Tests
```bash
src/test/slices/
├── chatSlice.test.js       # Chat state testing
├── pdfSlice.test.js        # PDF state testing
└── uiSlice.test.js         # UI state testing
```

#### Integration Tests
- API service mocking
- End-to-end user flows
- Cross-component communication
- Error scenario validation

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test Header.test.jsx
```

## ⚡ Performance Optimizations

### React Performance

#### Memoization Strategy
```javascript
// Component memoization
const ChatMessages = React.memo(({ messages }) => {
  // Memoized expensive calculations
  const processedMessages = useMemo(() => {
    return messages.map(processMessage);
  }, [messages]);
  
  // Memoized event handlers
  const handleScroll = useCallback(() => {
    // Scroll handling logic
  }, []);
  
  return <div>{/* Component JSX */}</div>;
});
```

## 🔗 Related Projects

- **Backend API**: [PDF AI Assistant Backend](../pdf-ai-backend/) - Express.js API server
- **Main Project**: [PDF AI Assistant Powered by LangChain](../) - Complete application documentation

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/pdf-ai-assistant-powered-by-lang/issues)
- 📖 **Documentation**: [Project Wiki](https://github.com/your-username/pdf-ai-assistant-powered-by-lang/wiki)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-username/pdf-ai-assistant-powered-by-lang/discussions)

---

<div align="center">

**Built with ❤️ using React 19, Redux Toolkit, and modern web technologies**

[🚀 Quick Start](#quick-start) • [🎯 Components](#component-overview) • [🧪 Testing](#testing-strategy)

</div>
