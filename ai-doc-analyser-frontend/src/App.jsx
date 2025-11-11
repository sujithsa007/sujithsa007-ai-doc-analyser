/**
 * Main Application Component
 * 
 * This is the root component that sets up the Redux store provider and
 * renders the main application layout with header, sidebar, and chat interface.
 * 
 * Features:
 * - Redux state management integration
 * - Responsive layout design
 * - Component composition for clean architecture
 * - Optimized styling for performance
 */

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import store from './store';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatMessages from './components/ChatMessages';
import MessageInput from './components/MessageInput';
import DocumentDashboard from './components/DocumentDashboard';
import TemplateSelector from './components/TemplateSelector';
import { autoLoginAdmin } from './services/apiService';
import './App.css';

/**
 * App Component
 * 
 * Renders the complete application structure with:
 * - Redux Provider for state management
 * - Header with app branding and controls
 * - Sidebar for PDF management and chat history
 * - Chat interface for AI interactions
 * - Document Dashboard for analytics
 * - Template Selector modal for batch analysis
 * - Auto-authentication on startup
 * 
 * @returns {JSX.Element} Complete application layout
 */
function App() {
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  // Auto-login with default admin credentials on startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        await autoLoginAdmin();
        console.log('Auto-authentication successful');
      } catch (error) {
        console.error('Auto-authentication failed:', error);
      }
    };
    initAuth();
  }, []);

  return (
    <Provider store={store}>
      {/* Main application container with full viewport height */}
      <div className="app-container">
        {/* Application header */}
        <Header onOpenTemplates={() => setShowTemplates(true)} />
        
        {/* Main content area with sidebar and chat */}
        <div className="app-main">
          {/* PDF upload and document management sidebar */}
          <Sidebar 
            showDashboard={showDashboard}
            onToggleDashboard={() => setShowDashboard(!showDashboard)}
          />
          
          {/* Chat interface area */}
          <main className="chat-container">
            {/* Message history display */}
            <ChatMessages />
            
            {/* User input for questions */}
            <MessageInput />
          </main>
        </div>

        {/* Template Selector Modal */}
        {showTemplates && (
          <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Analysis Templates</h2>
                <button className="btn-close" onClick={() => setShowTemplates(false)}>×</button>
              </div>
              <TemplateSelector onClose={() => setShowTemplates(false)} />
            </div>
          </div>
        )}
      </div>
    </Provider>
  );
}

export default App;
