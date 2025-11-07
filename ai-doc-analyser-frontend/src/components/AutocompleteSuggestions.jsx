/**
 * AutocompleteSuggestions Component
 * 
 * Provides intelligent autocomplete suggestions as users type their questions.
 * Features:
 * - Context-aware suggestions based on document type
 * - Keyword matching for relevant suggestions
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click to select suggestion
 * - Smooth animations and transitions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';

/**
 * Common question templates categorized by context
 */
const SUGGESTION_TEMPLATES = {
  general: [
    "What is this document about?",
    "Summarize the main points of this document",
    "What are the key findings?",
    "Explain this in simple terms",
    "What are the important dates mentioned?",
    "Who are the main people or organizations mentioned?",
    "What are the action items?",
    "What are the risks or concerns?",
    "What decisions need to be made?",
    "What are the next steps?",
  ],
  legal: [
    "What are the key terms and conditions?",
    "What are the obligations of each party?",
    "What is the termination clause?",
    "What are the liability limitations?",
    "What is the effective date?",
    "Are there any penalty clauses?",
    "What is the jurisdiction?",
    "What are the payment terms?",
  ],
  financial: [
    "What is the total revenue?",
    "What are the major expenses?",
    "What is the profit margin?",
    "What are the financial projections?",
    "What are the key financial ratios?",
    "What are the assets and liabilities?",
    "What is the cash flow situation?",
    "Are there any financial risks?",
  ],
  technical: [
    "What are the technical specifications?",
    "What are the system requirements?",
    "How does this feature work?",
    "What are the implementation steps?",
    "What are the known issues or limitations?",
    "What are the dependencies?",
    "What is the architecture overview?",
  ],
  academic: [
    "What is the research methodology?",
    "What are the main conclusions?",
    "What are the limitations of this study?",
    "What are the references cited?",
    "What is the hypothesis?",
    "What are the implications of this research?",
  ],
  business: [
    "What are the business objectives?",
    "What is the market analysis?",
    "What are the competitive advantages?",
    "What is the implementation timeline?",
    "What are the resource requirements?",
    "What are the success metrics?",
    "What are the stakeholders involved?",
  ],
  medical: [
    "What is the diagnosis?",
    "What are the symptoms described?",
    "What is the treatment plan?",
    "What are the test results?",
    "What medications are mentioned?",
    "Are there any side effects noted?",
    "What are the follow-up recommendations?",
  ],
};

/**
 * Keywords to detect document context
 */
const CONTEXT_KEYWORDS = {
  legal: ['contract', 'agreement', 'terms', 'conditions', 'liability', 'jurisdiction', 'clause', 'party', 'legal'],
  financial: ['revenue', 'expense', 'profit', 'loss', 'balance', 'financial', 'budget', 'cost', 'income'],
  technical: ['system', 'technical', 'specification', 'implementation', 'architecture', 'code', 'api', 'software'],
  academic: ['research', 'study', 'methodology', 'hypothesis', 'conclusion', 'abstract', 'journal', 'citation'],
  business: ['business', 'market', 'strategy', 'objective', 'stakeholder', 'analysis', 'proposal', 'plan'],
  medical: ['patient', 'diagnosis', 'treatment', 'symptoms', 'medical', 'doctor', 'prescription', 'test results'],
};

/**
 * AutocompleteSuggestions Component
 * 
 * @param {Object} props - Component props
 * @param {string} props.query - Current user input
 * @param {Function} props.onSelect - Callback when suggestion is selected
 * @param {Function} props.onClose - Callback to close suggestions
 * @returns {JSX.Element|null} Suggestions dropdown or null
 */
const AutocompleteSuggestions = ({ query, onSelect, onClose }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const suggestionRef = useRef(null);
  
  // Get document content from Redux to detect context
  const { content, documents } = useSelector((state) => state.pdf);
  const { messages } = useSelector((state) => state.chat);

  /**
   * Detect document context based on content keywords
   */
  const detectContext = useCallback(() => {
    const allContent = documents.length > 0 
      ? documents.map(d => d.content).join(' ').toLowerCase()
      : (content || '').toLowerCase();

    const contexts = [];
    
    // Check each context for matching keywords
    Object.entries(CONTEXT_KEYWORDS).forEach(([context, keywords]) => {
      const matches = keywords.filter(keyword => allContent.includes(keyword)).length;
      if (matches > 0) {
        contexts.push({ context, score: matches });
      }
    });

    // Sort by relevance score and return top contexts
    contexts.sort((a, b) => b.score - a.score);
    return contexts.map(c => c.context);
  }, [content, documents]);

  /**
   * Filter suggestions based on user query and document context
   */
  const filterSuggestions = useCallback((inputQuery) => {
    if (!inputQuery || inputQuery.length < 2) {
      return [];
    }

    const normalizedQuery = inputQuery.toLowerCase().trim();
    const detectedContexts = detectContext();
    
    // Collect all relevant suggestions
    let allSuggestions = [...SUGGESTION_TEMPLATES.general];
    
    // Add context-specific suggestions
    detectedContexts.forEach(context => {
      if (SUGGESTION_TEMPLATES[context]) {
        allSuggestions = [...allSuggestions, ...SUGGESTION_TEMPLATES[context]];
      }
    });

    // Filter suggestions based on query
    const filtered = allSuggestions.filter(suggestion => {
      const normalizedSuggestion = suggestion.toLowerCase();
      
      // Match if query is at the start of the suggestion
      if (normalizedSuggestion.startsWith(normalizedQuery)) {
        return true;
      }
      
      // Match if all words in query appear in suggestion
      const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);
      return queryWords.every(word => normalizedSuggestion.includes(word));
    });

    // Remove duplicates and limit results
    const uniqueSuggestions = [...new Set(filtered)];
    
    // Prioritize exact matches and sort by relevance
    const sorted = uniqueSuggestions.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // Exact start match gets highest priority
      const aStartsWithQuery = aLower.startsWith(normalizedQuery);
      const bStartsWithQuery = bLower.startsWith(normalizedQuery);
      
      if (aStartsWithQuery && !bStartsWithQuery) return -1;
      if (!aStartsWithQuery && bStartsWithQuery) return 1;
      
      // Shorter suggestions are more relevant
      return a.length - b.length;
    });

    return sorted.slice(0, 6); // Limit to 6 suggestions
  }, [detectContext]);

  /**
   * Update suggestions when query changes
   */
  useEffect(() => {
    const filtered = filterSuggestions(query);
    setSuggestions(filtered);
    setIsVisible(filtered.length > 0);
    setSelectedIndex(0); // Reset selection
  }, [query, filterSuggestions]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % suggestions.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
          break;
        case 'Enter':
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            e.preventDefault();
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, suggestions, selectedIndex]);

  /**
   * Handle clicking outside to close
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  /**
   * Handle suggestion selection
   */
  const handleSelect = useCallback((suggestion) => {
    onSelect(suggestion);
    handleClose();
  }, [onSelect]);

  /**
   * Close suggestions dropdown
   */
  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (onClose) onClose();
  }, [onClose]);

  // Don't render if no suggestions
  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div ref={suggestionRef} style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerIcon}>💡</span>
        <span style={styles.headerText}>Suggestions</span>
        <button 
          onClick={handleClose} 
          style={styles.closeButton}
          aria-label="Close suggestions"
        >
          ✕
        </button>
      </div>
      
      <ul style={styles.list} role="listbox">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            onClick={() => handleSelect(suggestion)}
            onMouseEnter={() => setSelectedIndex(index)}
            style={{
              ...styles.item,
              backgroundColor: index === selectedIndex ? '#f0f4ff' : '#fff',
              borderLeft: index === selectedIndex ? '3px solid #007bff' : '3px solid transparent',
            }}
            role="option"
            aria-selected={index === selectedIndex}
          >
            <span style={styles.itemIcon}>💬</span>
            <span style={styles.itemText}>{suggestion}</span>
          </li>
        ))}
      </ul>
      
      <div style={styles.footer}>
        <span style={styles.footerText}>
          Use ↑↓ to navigate • Enter to select • Esc to close
        </span>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    marginBottom: '8px',
    backgroundColor: '#fff',
    border: '1px solid #e1e5e9',
    borderRadius: '12px',
    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
    maxHeight: '320px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    animation: 'slideUp 0.2s ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e1e5e9',
  },
  headerIcon: {
    fontSize: '16px',
  },
  headerText: {
    flex: 1,
    fontSize: '13px',
    fontWeight: '600',
    color: '#495057',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    overflowY: 'auto',
    flex: 1,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    borderBottom: '1px solid #f1f3f5',
  },
  itemIcon: {
    fontSize: '14px',
    opacity: 0.7,
  },
  itemText: {
    fontSize: '14px',
    color: '#212529',
    lineHeight: '1.5',
  },
  footer: {
    padding: '8px 14px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #e1e5e9',
  },
  footerText: {
    fontSize: '11px',
    color: '#6b7280',
  },
};

// Add keyframe animation
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    // Ignore if rule already exists
  }
}

AutocompleteSuggestions.displayName = 'AutocompleteSuggestions';

export default AutocompleteSuggestions;
