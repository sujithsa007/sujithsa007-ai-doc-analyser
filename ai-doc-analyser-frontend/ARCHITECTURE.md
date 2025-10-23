# 🏛️ Frontend Architecture Documentation

## 🎯 System Overview

The PDF AI Assistant Frontend (powered by LangChain) is a modern React 19 application designed for high-performance PDF document analysis through AI-powered chat interfaces. Built with Redux Toolkit for state management, Vite for ultra-fast development, and PDF.js for client-side document processing.

## 📐 Architecture Patterns

### 1. **Component-Based Architecture**
```
┌─────────────────────────────────────────┐
│            Presentation Layer           │  ← React Components
├─────────────────────────────────────────┤
│          State Management Layer         │  ← Redux Toolkit
├─────────────────────────────────────────┤
│           Service Layer                 │  ← API & PDF Services
├─────────────────────────────────────────┤
│           External APIs                 │  ← Backend & PDF.js
└─────────────────────────────────────────┘
```

### 2. **Data Flow Architecture**
```
User Interaction
     ↓
React Component
     ↓
Redux Action Dispatch
     ↓
State Update (Reducer)
     ↓
Component Re-render
     ↓
UI Update
```

### 3. **Service Integration Flow**
```
File Upload
     ↓
PDF.js Processing
     ↓
Text Extraction
     ↓
Redux State Update
     ↓
API Service Call
     ↓
Backend Integration
     ↓
AI Response Display
```

## 🧩 Component Architecture

### Core Component Hierarchy

```
App.jsx (Root)
├── Header.jsx (Navigation)
├── main.container
│   ├── Sidebar.jsx (File Management)
│   │   ├── File Upload Zone
│   │   ├── Processing Status
│   │   └── Error Handling
│   ├── ChatMessages.jsx (Message Display)
│   │   ├── Message List
│   │   ├── Auto Scroll
│   │   └── Typing Indicators
│   ├── MessageInput.jsx (User Input)
│   │   ├── Input Validation
│   │   ├── Send Button
│   │   └── Loading States
│   └── PDFPreview.jsx (Document Viewer)
│       ├── PDF Renderer
│       ├── Navigation Controls
│       └── Zoom Functionality
```

### Component Design Patterns

#### 1. **Container/Presentation Pattern**
```javascript
// Container Component (Smart)
const ChatContainer = () => {
  const dispatch = useDispatch();
  const messages = useSelector(selectChatMessages);
  
  const handleSendMessage = useCallback((message) => {
    dispatch(sendMessage(message));
  }, [dispatch]);
  
  return <ChatPresentation messages={messages} onSend={handleSendMessage} />;
};

// Presentation Component (Dumb)
const ChatPresentation = React.memo(({ messages, onSend }) => {
  return (
    <div className="chat-container">
      {messages.map(message => <Message key={message.id} {...message} />)}
    </div>
  );
});
```

#### 2. **Higher-Order Components (HOCs)**
```javascript
// Performance optimization HOC
const withPerformanceOptimization = (WrappedComponent) => {
  return React.memo(React.forwardRef((props, ref) => {
    return <WrappedComponent ref={ref} {...props} />;
  }));
};

// Error boundary HOC
const withErrorBoundary = (WrappedComponent) => {
  return class extends React.Component {
    state = { hasError: false };
    
    static getDerivedStateFromError(error) {
      return { hasError: true };
    }
    
    render() {
      if (this.state.hasError) {
        return <ErrorFallback />;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
};
```

#### 3. **Custom Hooks Pattern**
```javascript
// PDF processing hook
const usePdfProcessor = () => {
  const dispatch = useDispatch();
  const { isProcessing, error } = useSelector(selectPdfState);
  
  const processFile = useCallback(async (file) => {
    dispatch(setPdfProcessing(true));
    try {
      const content = await extractTextFromPDF(file);
      dispatch(setPdfContent(content));
    } catch (error) {
      dispatch(setPdfError(error.message));
    } finally {
      dispatch(setPdfProcessing(false));
    }
  }, [dispatch]);
  
  return { processFile, isProcessing, error };
};

// API communication hook
const useApiService = () => {
  const dispatch = useDispatch();
  
  const askQuestion = useCallback(async (question, content) => {
    dispatch(setChatLoading(true));
    try {
      const response = await apiService.askQuestion(question, content);
      dispatch(addMessage({
        type: 'ai',
        content: response.answer,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      dispatch(setChatError(error.message));
    } finally {
      dispatch(setChatLoading(false));
    }
  }, [dispatch]);
  
  return { askQuestion };
};
```

## 🗂️ State Management Architecture

### Redux Store Design

#### Store Structure
```javascript
const store = {
  pdf: {
    file: null,                    // File object
    content: "",                   // Extracted text
    isProcessing: false,           // Processing state
    error: null,                   // Error messages
    metadata: {                    // File information
      name: "",
      size: 0,
      pages: 0,
      extractedAt: null
    }
  },
  chat: {
    messages: [                    // Message history
      {
        id: "uuid",
        type: "user|ai",
        content: "",
        timestamp: "ISO string",
        metadata: {}
      }
    ],
    isLoading: false,              // API request state
    error: null,                   // Error handling
    currentQuestion: ""            // Active question
  },
  ui: {
    sidebarOpen: true,             // Layout control
    darkMode: false,               // Theme state
    notifications: [],             // User feedback
    activeView: "chat",            // Current view
    preferences: {                 // User settings
      autoScroll: true,
      showTimestamps: true,
      compactMode: false
    }
  }
}
```

#### Slice Architecture

##### PDF Slice (`pdfSlice.js`)
```javascript
const pdfSlice = createSlice({
  name: 'pdf',
  initialState: {
    file: null,
    content: "",
    isProcessing: false,
    error: null,
    metadata: {}
  },
  reducers: {
    // Synchronous actions
    setPdfFile: (state, action) => {
      state.file = action.payload;
      state.error = null;
    },
    setPdfContent: (state, action) => {
      state.content = action.payload;
      state.isProcessing = false;
    },
    setPdfProcessing: (state, action) => {
      state.isProcessing = action.payload;
    },
    setPdfError: (state, action) => {
      state.error = action.payload;
      state.isProcessing = false;
    },
    clearPdfData: (state) => {
      state.file = null;
      state.content = "";
      state.error = null;
      state.metadata = {};
    }
  },
  extraReducers: (builder) => {
    // Async thunk handlers
    builder
      .addCase(processPdfFile.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(processPdfFile.fulfilled, (state, action) => {
        state.content = action.payload.content;
        state.metadata = action.payload.metadata;
        state.isProcessing = false;
      })
      .addCase(processPdfFile.rejected, (state, action) => {
        state.error = action.payload;
        state.isProcessing = false;
      });
  }
});
```

##### Chat Slice (`chatSlice.js`)
```javascript
const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    isLoading: false,
    error: null,
    currentQuestion: ""
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push({
        id: generateId(),
        timestamp: new Date().toISOString(),
        ...action.payload
      });
    },
    setCurrentQuestion: (state, action) => {
      state.currentQuestion = action.payload;
    },
    setChatLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setChatError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearChatHistory: (state) => {
      state.messages = [];
      state.error = null;
    }
  }
});
```

##### UI Slice (`uiSlice.js`)
```javascript
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    darkMode: false,
    notifications: [],
    activeView: 'chat',
    preferences: {
      autoScroll: true,
      showTimestamps: true,
      compactMode: false
    }
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: generateId(),
        timestamp: Date.now(),
        ...action.payload
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    }
  }
});
```

### Async Actions with Redux Toolkit Query

```javascript
// API slice for efficient data fetching
const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:5000',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Health', 'Question'],
  endpoints: (builder) => ({
    checkHealth: builder.query({
      query: () => '/health',
      providesTags: ['Health']
    }),
    askQuestion: builder.mutation({
      query: ({ question, content }) => ({
        url: '/ask',
        method: 'POST',
        body: { question, content }
      }),
      invalidatesTags: ['Question']
    })
  })
});
```

## 🌐 Service Layer Architecture

### API Service (`apiService.js`)

#### Service Configuration
```javascript
/**
 * Centralized API service with comprehensive error handling
 * and performance monitoring capabilities
 */
class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.timeout = 30000; // 30 seconds
    this.setupAxiosInstance();
  }
  
  setupAxiosInstance() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const duration = endTime - response.config.metadata.startTime;
        
        // Performance logging
        console.log(`API Response: ${response.config.url} - ${duration}ms`);
        
        return response;
      },
      (error) => {
        return Promise.reject(this.handleApiError(error));
      }
    );
  }
  
  handleApiError(error) {
    if (error.response) {
      // Server responded with error
      return {
        message: error.response.data.error || 'Server error occurred',
        status: error.response.status,
        code: error.response.data.code
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Network error - please check your connection',
        status: 0,
        code: 'NETWORK_ERROR'
      };
    } else {
      // Other error
      return {
        message: error.message || 'An unexpected error occurred',
        status: -1,
        code: 'UNKNOWN_ERROR'
      };
    }
  }
  
  async askQuestion(question, content) {
    const response = await this.client.post('/ask', { question, content });
    return response.data;
  }
  
  async checkHealth() {
    const response = await this.client.get('/health');
    return response.data;
  }
}
```

### PDF Service (`pdfService.js`)

#### Advanced Text Extraction Engine
```javascript
/**
 * Sophisticated PDF processing service using PDF.js
 * with intelligent text extraction and layout analysis
 */
class PdfService {
  constructor() {
    this.setupPdfWorker();
  }
  
  setupPdfWorker() {
    // Configure PDF.js worker for better performance
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  }
  
  async extractTextFromPDF(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const metadata = {
        numPages: pdf.numPages,
        info: await pdf.getMetadata(),
        fingerprint: pdf.fingerprint
      };
      
      const textContent = await this.extractAllPages(pdf);
      
      return {
        content: textContent,
        metadata: {
          ...metadata,
          extractedAt: new Date().toISOString(),
          fileSize: file.size,
          fileName: file.name
        }
      };
    } catch (error) {
      throw new Error(`PDF processing failed: ${error.message}`);
    }
  }
  
  async extractAllPages(pdf) {
    const pagePromises = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      pagePromises.push(this.extractPageText(pdf, i));
    }
    
    const pageTexts = await Promise.all(pagePromises);
    return pageTexts.join('\n\n--- Page Break ---\n\n');
  }
  
  async extractPageText(pdf, pageNumber) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    // Advanced text positioning algorithm
    const sortedItems = textContent.items.sort((a, b) => {
      // Sort by Y position (top to bottom), then X position (left to right)
      const yDiff = Math.abs(b.transform[5] - a.transform[5]);
      if (yDiff > 5) { // Different lines
        return b.transform[5] - a.transform[5];
      }
      return a.transform[4] - b.transform[4]; // Same line, sort by X
    });
    
    // Group items by line and reconstruct text
    const lines = this.groupTextItemsByLine(sortedItems);
    return lines.map(line => line.join(' ')).join('\n');
  }
  
  groupTextItemsByLine(items) {
    const lines = [];
    let currentLine = [];
    let currentY = null;
    
    items.forEach((item) => {
      const y = Math.round(item.transform[5]);
      
      if (currentY === null || Math.abs(y - currentY) > 5) {
        // New line
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        currentLine = [item.str];
        currentY = y;
      } else {
        // Same line
        currentLine.push(item.str);
      }
    });
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}
```

## ⚡ Performance Architecture

### Optimization Strategies

#### 1. **React Performance Optimizations**

##### Component Memoization
```javascript
// Expensive component memoization
const ChatMessages = React.memo(({ messages, onScroll }) => {
  // Memoize expensive calculations
  const processedMessages = useMemo(() => {
    return messages.map(message => ({
      ...message,
      formattedTime: formatTimestamp(message.timestamp),
      isRecent: isWithinLastMinute(message.timestamp)
    }));
  }, [messages]);
  
  // Memoize event handlers
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    onScroll?.(isNearBottom);
  }, [onScroll]);
  
  return (
    <div className="chat-messages" onScroll={handleScroll}>
      {processedMessages.map(message => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
});

// Individual message optimization
const MessageItem = React.memo(({ message }) => {
  return (
    <div className={`message message--${message.type}`}>
      <div className="message__content">{message.content}</div>
      <div className="message__time">{message.formattedTime}</div>
    </div>
  );
});
```

##### Virtual Scrolling for Large Lists
```javascript
const VirtualizedChatMessages = () => {
  const messages = useSelector(selectChatMessages);
  const containerRef = useRef(null);
  
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const ITEM_HEIGHT = 80;
  
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, clientHeight } = containerRef.current;
    const start = Math.floor(scrollTop / ITEM_HEIGHT);
    const end = Math.min(start + Math.ceil(clientHeight / ITEM_HEIGHT) + 5, messages.length);
    
    setVisibleRange({ start, end });
  }, [messages.length]);
  
  const visibleMessages = useMemo(() => {
    return messages.slice(visibleRange.start, visibleRange.end);
  }, [messages, visibleRange]);
  
  return (
    <div
      ref={containerRef}
      className="virtualized-chat"
      onScroll={handleScroll}
      style={{ height: messages.length * ITEM_HEIGHT }}
    >
      <div style={{ transform: `translateY(${visibleRange.start * ITEM_HEIGHT}px)` }}>
        {visibleMessages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    </div>
  );
};
```

#### 2. **Bundle Optimization**

##### Vite Configuration (`vite.config.js`)
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for stable dependencies
          vendor: ['react', 'react-dom'],
          
          // Redux chunk for state management
          redux: ['@reduxjs/toolkit', 'react-redux'],
          
          // PDF processing chunk
          pdf: ['pdfjs-dist'],
          
          // UI utilities chunk
          utils: ['axios', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'axios'
    ]
  },
  server: {
    hmr: {
      overlay: false
    }
  }
});
```

##### Code Splitting Strategy
```javascript
// Route-based code splitting
const LazyPDFViewer = lazy(() => import('./components/PDFPreview'));
const LazyChatInterface = lazy(() => import('./components/ChatInterface'));

const App = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LazyChatInterface />} />
          <Route path="/viewer" element={<LazyPDFViewer />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

// Component-level code splitting
const HeavyComponent = lazy(() =>
  import('./HeavyComponent').then(module => ({
    default: module.HeavyComponent
  }))
);
```

#### 3. **Memory Management**

##### Efficient State Updates
```javascript
// Normalized state structure for better performance
const messagesAdapter = createEntityAdapter({
  selectId: message => message.id,
  sortComparer: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: messagesAdapter.getInitialState({
    isLoading: false,
    error: null
  }),
  reducers: {
    addMessage: messagesAdapter.addOne,
    updateMessage: messagesAdapter.updateOne,
    removeMessage: messagesAdapter.removeOne,
    clearMessages: messagesAdapter.removeAll
  }
});

// Memoized selectors for performance
const selectChatState = state => state.chat;
const {
  selectAll: selectAllMessages,
  selectById: selectMessageById,
  selectIds: selectMessageIds
} = messagesAdapter.getSelectors(selectChatState);

// Efficient message filtering
const selectRecentMessages = createSelector(
  [selectAllMessages],
  messages => messages.filter(message => 
    Date.now() - new Date(message.timestamp) < 24 * 60 * 60 * 1000
  )
);
```

### Performance Monitoring

#### Custom Performance Hooks
```javascript
const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(Date.now());
  
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    
    if (renderTime > 100) { // Log slow renders
      console.warn(`Slow render detected in ${componentName}: ${renderTime}ms`);
    }
    
    // Report to analytics service
    if (window.gtag) {
      window.gtag('event', 'render_performance', {
        component: componentName,
        render_time: renderTime
      });
    }
  });
  
  renderStartTime.current = Date.now();
};

// Usage in components
const ChatMessages = () => {
  usePerformanceMonitor('ChatMessages');
  // Component implementation
};
```

## 🧪 Testing Architecture

### Testing Strategy Pyramid

```
       ┌─────────────────┐
       │   E2E Tests     │  ← Cypress/Playwright
       ├─────────────────┤
       │ Integration     │  ← React Testing Library
       │     Tests       │
       ├─────────────────┤
       │   Unit Tests    │  ← Jest + Vitest
       └─────────────────┘
```

### Test Implementation

#### Component Testing
```javascript
// ChatMessages.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ChatMessages from '../ChatMessages';
import { chatSlice } from '../../store/slices/chatSlice';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      chat: chatSlice.reducer
    },
    preloadedState: {
      chat: {
        messages: [],
        isLoading: false,
        error: null,
        ...initialState
      }
    }
  });
};

describe('ChatMessages Component', () => {
  it('renders messages correctly', () => {
    const mockMessages = [
      { id: '1', type: 'user', content: 'Hello', timestamp: '2025-01-01T12:00:00Z' },
      { id: '2', type: 'ai', content: 'Hi there!', timestamp: '2025-01-01T12:00:01Z' }
    ];
    
    const store = createMockStore({ messages: mockMessages });
    
    render(
      <Provider store={store}>
        <ChatMessages />
      </Provider>
    );
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });
  
  it('auto-scrolls to latest message', async () => {
    const store = createMockStore();
    const { rerender } = render(
      <Provider store={store}>
        <ChatMessages />
      </Provider>
    );
    
    // Add new message
    store.dispatch(chatSlice.actions.addMessage({
      type: 'user',
      content: 'New message',
      timestamp: new Date().toISOString()
    }));
    
    rerender(
      <Provider store={store}>
        <ChatMessages />
      </Provider>
    );
    
    // Verify scroll behavior
    const container = screen.getByTestId('chat-messages-container');
    expect(container.scrollTop).toBe(container.scrollHeight - container.clientHeight);
  });
});
```

#### Redux Testing
```javascript
// chatSlice.test.js
import { configureStore } from '@reduxjs/toolkit';
import { chatSlice, addMessage, setChatLoading } from '../chatSlice';

describe('Chat Slice', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        chat: chatSlice.reducer
      }
    });
  });
  
  it('should add message to state', () => {
    const message = {
      type: 'user',
      content: 'Test message',
      timestamp: '2025-01-01T12:00:00Z'
    };
    
    store.dispatch(addMessage(message));
    
    const state = store.getState().chat;
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject(message);
    expect(state.messages[0]).toHaveProperty('id');
  });
  
  it('should set loading state', () => {
    store.dispatch(setChatLoading(true));
    
    const state = store.getState().chat;
    expect(state.isLoading).toBe(true);
  });
});
```

#### Integration Testing
```javascript
// App.integration.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import App from '../App';

// Mock API server
const server = setupServer(
  rest.post('http://localhost:5000/ask', (req, res, ctx) => {
    return res(
      ctx.json({
        answer: 'This is a mock AI response',
        metadata: {
          processingTime: '1.5',
          contentLength: 100
        }
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App Integration Tests', () => {
  it('completes full user workflow', async () => {
    render(<App />);
    
    // Upload PDF file
    const fileInput = screen.getByLabelText(/upload pdf/i);
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for processing
    await waitFor(() => {
      expect(screen.getByText(/ready to analyze/i)).toBeInTheDocument();
    });
    
    // Send question
    const questionInput = screen.getByPlaceholderText(/ask a question/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.change(questionInput, { target: { value: 'What is this document about?' } });
    fireEvent.click(sendButton);
    
    // Verify AI response
    await waitFor(() => {
      expect(screen.getByText('This is a mock AI response')).toBeInTheDocument();
    });
  });
});
```

## 🔒 Security Architecture

### Client-Side Security Measures

#### 1. **Input Sanitization**
```javascript
// Sanitize user input
const sanitizeInput = (input) => {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove JavaScript URLs
    .trim()
    .substring(0, 1000); // Limit length
};

// Use in components
const MessageInput = () => {
  const [question, setQuestion] = useState('');
  
  const handleInputChange = (e) => {
    const sanitized = sanitizeInput(e.target.value);
    setQuestion(sanitized);
  };
  
  return <input value={question} onChange={handleInputChange} />;
};
```

#### 2. **File Validation**
```javascript
const validatePdfFile = (file) => {
  const errors = [];
  
  // Type validation
  if (file.type !== 'application/pdf') {
    errors.push('Only PDF files are allowed');
  }
  
  // Size validation (50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 50MB');
  }
  
  // Name validation
  if (!/^[a-zA-Z0-9._-]+\.pdf$/i.test(file.name)) {
    errors.push('Invalid file name');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

#### 3. **Content Security Policy**
```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' http://localhost:5000;
  font-src 'self' https://fonts.gstatic.com;
">
```

### Privacy Protection

#### 1. **Data Cleanup**
```javascript
// Automatic state cleanup on unmount
const useCleanupOnUnmount = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    return () => {
      // Cleanup sensitive data
      dispatch(clearPdfData());
      dispatch(clearChatHistory());
    };
  }, [dispatch]);
};

// Session storage cleanup
const clearSensitiveData = () => {
  sessionStorage.removeItem('pdf-content');
  sessionStorage.removeItem('chat-history');
  
  // Clear any cached data
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
};
```

## 📱 Responsive Design Architecture

### Breakpoint Strategy
```css
/* CSS Custom Properties for consistent breakpoints */
:root {
  --breakpoint-mobile: 320px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
  --breakpoint-wide: 1440px;
}

/* Mobile-first responsive design */
.app-container {
  display: grid;
  grid-template-areas: 
    "header"
    "main";
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

@media (min-width: 768px) {
  .app-container {
    grid-template-areas: 
      "header header"
      "sidebar main";
    grid-template-columns: 300px 1fr;
  }
}

@media (min-width: 1024px) {
  .app-container {
    grid-template-areas: 
      "header header header"
      "sidebar main preview";
    grid-template-columns: 300px 1fr 400px;
  }
}
```

### Adaptive Components
```javascript
// Responsive hook for adaptive layouts
const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState('mobile');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= 1024) setBreakpoint('desktop');
      else if (width >= 768) setBreakpoint('tablet');
      else setBreakpoint('mobile');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
};

// Adaptive component rendering
const ChatInterface = () => {
  const { isMobile, isDesktop } = useResponsive();
  
  return (
    <div className="chat-interface">
      {!isMobile && <Sidebar />}
      <ChatMessages />
      {isDesktop && <PDFPreview />}
    </div>
  );
};
```

---

<div align="center">

**Modern React architecture designed for performance, scalability, and user experience**

[🔙 Frontend README](./README.md) • [🧩 Components](#component-architecture) • [⚡ Performance](#performance-architecture)

</div>