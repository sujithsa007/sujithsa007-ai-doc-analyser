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
  const { content, isParsing } = useSelector((state) => state.pdf);

  // Memoized computed values for performance
  const isDisabled = useMemo(() => 
    !content || isParsing || isAsking || !question.trim(), 
    [content, isParsing, isAsking, question]
  );

  const placeholder = useMemo(() => 
    content 
      ? "Ask a question about the document..." 
      : "Upload a PDF document first to start chatting",
    [content]
  );

  /**
   * Handles sending a question to the AI assistant
   * Validates input, dispatches actions, and handles API response
   */
  const handleAsk = useCallback(async () => {
    // Validation checks
    if (!content?.trim()) {
      dispatch(setError('Please upload a PDF file first.'));
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
      console.log('🤖 Sending question to AI:', currentQuestion);
      const startTime = Date.now();
      
      // Call AI service
      const answer = await askQuestion(currentQuestion, content);
      
      const endTime = Date.now();
      const responseTime = ((endTime - startTime) / 1000).toFixed(1);
      console.log(`✅ AI response received in ${responseTime}s`);
      
      // Create assistant message
      const assistantMessage = {
        role: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        responseTime: responseTime
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
  }, [content, question, dispatch]);

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
          disabled={!content || isParsing || isAsking}
          style={{
            ...styles.input,
            backgroundColor: content ? '#fff' : '#f8f9fa',
            cursor: content ? 'text' : 'not-allowed',
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
          aria-label={isAsking ? 'Sending message' : 'Send message'}
        >
          {isAsking ? (
            <span style={styles.loadingText}>
              <span style={styles.loadingDots}>⋯</span>
            </span>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>
      
      {/* Helpful text */}
      <div id="input-help" style={styles.helpText}>
        {content ? (
          <span>Press Enter to send • {question.length}/500 characters</span>
        ) : (
          <span>Upload a PDF document to start asking questions</span>
        )}
      </div>
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
};

// Set display name for debugging
MessageInput.displayName = 'MessageInput';

export default MessageInput;
