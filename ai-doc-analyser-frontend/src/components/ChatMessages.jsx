/**
 * ChatMessages Component
 * 
 * Displays the conversation history between user and AI assistant.
 * Features:
 * - Auto-scrolling to latest messages
 * - Message typing indicators
 * - Error state handling
 * - Responsive message bubbles
 * - Performance optimized rendering
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Individual Message Component
 * Memoized to prevent unnecessary re-renders when other messages change
 */
const MessageBubble = React.memo(({ message, index }) => {
  const isUser = message.role === 'user';
  const isError = message.isError;
  
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        animationDelay: `${index * 0.1}s`, // Staggered animation
      }}
      className="message-container"
    >
      <div
        style={{
          maxWidth: '75%',
          minWidth: '120px',
          padding: '14px 18px',
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          backgroundColor: isUser ? '#007bff' : isError ? '#fee2e2' : '#f8f9fa',
          color: isUser ? '#fff' : isError ? '#dc2626' : '#374151',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          wordWrap: 'break-word',
          border: isError ? '1px solid #fca5a5' : 'none',
        }}
      >
        <div
          style={{
            fontSize: '15px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            marginBottom: message.timestamp ? '8px' : 0,
          }}
        >
          {message.content}
        </div>
        {message.timestamp && (
          <div
            style={{
              fontSize: '11px',
              opacity: 0.7,
              textAlign: isUser ? 'right' : 'left',
            }}
          >
            {message.timestamp}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Typing Indicator Component
 * Shows animated dots when AI is processing
 */
const TypingIndicator = React.memo(() => (
  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
    <div
      style={{
        padding: '14px 18px',
        borderRadius: '20px 20px 20px 4px',
        backgroundColor: '#f8f9fa',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span style={{ fontSize: '14px', color: '#6b7280' }}>AI is thinking</span>
      <div className="loading" style={{ display: 'flex', gap: '2px' }}>
        <div style={dotStyle}></div>
        <div style={{ ...dotStyle, animationDelay: '0.2s' }}></div>
        <div style={{ ...dotStyle, animationDelay: '0.4s' }}></div>
      </div>
    </div>
  </div>
));

// Animated dot styles for typing indicator
const dotStyle = {
  width: '4px',
  height: '4px',
  backgroundColor: '#9ca3af',
  borderRadius: '50%',
  animation: 'pulse 1.5s ease-in-out infinite',
};

/**
 * Empty State Component
 * Shown when no messages exist but PDF is loaded
 */
const EmptyState = React.memo(() => (
  <div
    style={{
      textAlign: 'center',
      padding: '60px 20px',
      color: '#6b7280',
    }}
  >
    <div
      style={{
        fontSize: '48px',
        marginBottom: '16px',
      }}
      role="img"
      aria-label="Waving hand"
    >
      👋
    </div>
    <h3
      style={{
        fontSize: '20px',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#374151',
      }}
    >
      Ready to analyze your document!
    </h3>
    <p style={{ fontSize: '15px', lineHeight: '1.5' }}>
      Ask any question about your PDF content below.
      <br />
      I can summarize, extract information, or answer specific questions.
    </p>
  </div>
));

/**
 * Main ChatMessages Component
 * 
 * Renders the complete chat interface with message history
 * Uses React.memo and useMemo for performance optimization
 */
const ChatMessages = () => {
  // Redux state selectors
  const { messages, isAsking } = useSelector((state) => state.chat);
  const { content } = useSelector((state) => state.pdf);
  
  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef(null);
  
  // Memoized message components to prevent unnecessary re-renders
  const messageComponents = useMemo(() => 
    messages.map((message, index) => (
      <MessageBubble key={`${index}-${message.timestamp}`} message={message} index={index} />
    )), [messages]
  );
  
  // Optimized scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking, scrollToBottom]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        scrollBehavior: 'smooth',
      }}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {/* Show empty state when no messages but PDF is loaded */}
      {messages.length === 0 && content && <EmptyState />}
      
      {/* Render message history */}
      {messageComponents}
      
      {/* Show typing indicator when AI is processing */}
      {isAsking && <TypingIndicator />}
      
      {/* Invisible scroll anchor */}
      <div ref={messagesEndRef} style={{ height: '1px' }} />
    </div>
  );
};

// Set component display names for debugging
MessageBubble.displayName = 'MessageBubble';
TypingIndicator.displayName = 'TypingIndicator';
EmptyState.displayName = 'EmptyState';
ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
