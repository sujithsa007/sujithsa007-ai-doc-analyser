/**
 * MessageInput Component
 * 
 * Handles user input for asking questions about PDF documents.
 * Features:
 * - Real-time validation and feedback
 * - Keyboard shortcuts (Enter to send)
 * - Loading states and error handling
 * - Optimized performance with memoization
 * - Accessibility compliance
 */

import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setQuestion, clearQuestion, addMessage, setIsAsking, setError } from '../store/slices/chatSlice';
import { askQuestion } from '../services/apiService';
import queryCache from '../services/queryCache';

/**
 * MessageInput Component
 * 
 * Provides an input field and send button for user questions.
 * Integrates with Redux for state management and API service for AI queries.
 * 
 * @returns {JSX.Element} Message input interface
 */
const MessageInput = () => {
  const dispatch = useDispatch();
  
  // Redux state selectors
  const { question, isAsking } = useSelector((state) => state.chat);
  const { content, isParsing, documents } = useSelector((state) => state.pdf);

  // Check if we have any documents uploaded
  const hasDocuments = useMemo(() => 
    documents.length > 0 || Boolean(content),
    [documents.length, content]
  );

  // Memoized computed values for performance
  const isDisabled = useMemo(() => 
    !hasDocuments || isParsing || isAsking || !question.trim(), 
    [hasDocuments, isParsing, isAsking, question]
  );

  const placeholder = useMemo(() => {
    if (!hasDocuments) {
      return "Upload a document first to start chatting";
    }
    if (documents.length > 1) {
      return `Ask questions about your ${documents.length} documents`;
    }
    return "Ask any question about your document";
  }, [hasDocuments, documents.length]);

  /**
   * Handles sending a question to the AI assistant
   * Validates input, dispatches actions, and handles API response
   * Supports both single and multi-document analysis
   */
  const handleAsk = useCallback(async () => {
    // Validation checks
    if (!hasDocuments) {
      dispatch(setError('Please upload a document first.'));
      return;
    }
    
    if (!question?.trim()) {
      dispatch(setError('Please enter a question.'));
      return;
    }

    // Create user message with timestamp
    const userMessage = {
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    // Dispatch user message and clear input
    dispatch(addMessage(userMessage));
    const currentQuestion = question.trim();
    dispatch(clearQuestion());
    dispatch(setIsAsking(true));
    dispatch(setError(null)); // Clear any previous errors

    try {
      const startTime = Date.now();
      let answer;
      let cacheHit = false;
      
      // Determine if multi-document or single document analysis
      if (documents.length > 0) {
        // MULTI-DOCUMENT ANALYSIS with caching
        const documentIds = documents.map(d => d.id);
        
        // Check cache first
        const cachedAnswer = queryCache.get(currentQuestion, documentIds);
        if (cachedAnswer) {
          answer = cachedAnswer;
          cacheHit = true;
          console.log('⚡ Using cached response (instant!)');
        } else {
          console.log(`🤖 Sending question to AI with ${documents.length} document(s):`, currentQuestion);
          console.log('📚 Documents:', documents.map(d => d.fileName));
          
          // Prepare documents array with required fields
          const docsToSend = documents.map(doc => ({
            fileName: doc.fileName,
            documentType: doc.file?.type || 'Unknown',
            content: doc.content
          }));
          
          // Call AI service with multi-document support
          answer = await askQuestion(currentQuestion, null, docsToSend);
          
          // Cache the response
          queryCache.set(currentQuestion, documentIds, answer);
        }
        
      } else {
        // SINGLE DOCUMENT ANALYSIS with caching
        const documentIds = ['single-doc'];
        
        // Check cache first
        const cachedAnswer = queryCache.get(currentQuestion, documentIds);
        if (cachedAnswer) {
          answer = cachedAnswer;
          cacheHit = true;
          console.log('⚡ Using cached response (instant!)');
        } else {
          console.log('🤖 Sending question to AI (single document):', currentQuestion);
          answer = await askQuestion(currentQuestion, content);
          
          // Cache the response
          queryCache.set(currentQuestion, documentIds, answer);
        }
      }
      
      const endTime = Date.now();
      const responseTime = ((endTime - startTime) / 1000).toFixed(1);
      console.log(`✅ AI response received in ${responseTime}s${cacheHit ? ' (from cache)' : ''}`);
      
      // Create assistant message
      const assistantMessage = {
        role: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        responseTime: cacheHit ? '0.0 (cached)' : responseTime
      };
      
      dispatch(addMessage(assistantMessage));
      
    } catch (error) {
      console.error('❌ Error asking question:', error);
      
      // Create error message for user
      const errorMessage = {
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        isError: true
      };
      
      dispatch(addMessage(errorMessage));
      dispatch(setError(error.message));
      
    } finally {
      dispatch(setIsAsking(false));
    }
  }, [hasDocuments, question, content, documents, dispatch]);

  /**
   * Handles keyboard shortcuts
   * Enter: Send message (if conditions are met)
   * Ctrl+Enter: Send message (alternative)
   */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent newline in input
      if (!isDisabled) {
        handleAsk();
      }
    }
  }, [isDisabled, handleAsk]);

  /**
   * Handles input value changes
   * Dispatches to Redux store with debouncing consideration
   */
  const handleInputChange = useCallback((e) => {
    dispatch(setQuestion(e.target.value));
  }, [dispatch]);

  return (
    <div style={styles.container} role="region" aria-label="Message input">
      <div style={styles.inputGroup}>
        {/* Main input field */}
        <input
          type="text"
          placeholder={placeholder}
          value={question}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={!hasDocuments || isParsing || isAsking}
          style={{
            ...styles.input,
            backgroundColor: hasDocuments ? '#fff' : '#f8f9fa',
            cursor: hasDocuments ? 'text' : 'not-allowed',
          }}
          aria-label="Question input"
          aria-describedby="input-help"
          maxLength={500} // Reasonable limit for questions
        />
        
        {/* Send button */}
        <button 
          onClick={handleAsk}
          disabled={isDisabled}
          style={{
            ...styles.button,
            backgroundColor: isDisabled ? '#9ca3af' : '#007bff',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
          aria-label={isAsking ? 'Sending question' : 'Send question'}
        >
          {isAsking ? (
            <span style={styles.loadingText}>
              Sending...
              <span style={styles.loadingDots}>⋯</span>
            </span>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>
      
      {/* Helpful text */}
      <div id="input-help" style={styles.helpText}>
        {hasDocuments ? (
          <span>
            Press Enter to send • <span data-testid="char-count">{question.length}/500</span> characters
            {documents.length > 1 && <span> • Analyzing {documents.length} documents together</span>}
          </span>
        ) : (
          <span>Upload a document to start asking questions</span>
        )}
      </div>
      {/* Error state display */}
      {/** We show the current error below for accessibility and test visibility */}
      {/** The tests expect specific error text to appear when error exists */}
      {/** aria-live polite for screen readers */}
      {useSelector((state) => state.chat.error) && (
        <div role="alert" style={styles.error} aria-live="polite">
          {useSelector((state) => state.chat.error)}
        </div>
      )}
    </div>
  );
};

// Optimized styles object to prevent recreation on each render
const styles = {
  container: {
    padding: '20px 24px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e1e5e9',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
  },
  inputGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'stretch',
    marginBottom: '8px',
  },
  input: {
    flex: 1,
    padding: '14px 18px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    ':focus': {
      borderColor: '#007bff',
      boxShadow: '0 0 0 3px rgba(0, 123, 255, 0.1)',
    },
  },
  button: {
    padding: '14px 20px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '600',
    color: '#fff',
    minWidth: '80px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: '1.4',
  },
  loadingText: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  loadingDots: {
    animation: 'pulse 1.5s ease-in-out infinite',
    fontSize: '18px',
  },
  error: {
    marginTop: '6px',
    fontSize: '12px',
    color: '#dc2626',
    textAlign: 'center',
  }
};

// Set display name for debugging
MessageInput.displayName = 'MessageInput';

export default MessageInput;
