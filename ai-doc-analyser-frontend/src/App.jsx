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

import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatMessages from './components/ChatMessages';
import MessageInput from './components/MessageInput';
import './App.css';

/**
 * App Component
 * 
 * Renders the complete application structure with:
 * - Redux Provider for state management
 * - Header with app branding and controls
 * - Sidebar for PDF management and chat history
 * - Chat interface for AI interactions
 * 
 * @returns {JSX.Element} Complete application layout
 */
function App() {
  return (
    <Provider store={store}>
      {/* Main application container with full viewport height */}
      <div className="app-container">
        {/* Application header */}
        <Header />
        
        {/* Main content area with sidebar and chat */}
        <div className="app-main">
          {/* PDF upload and document management sidebar */}
          <Sidebar />
          
          {/* Chat interface area */}
          <main className="chat-container">
            {/* Message history display */}
            <ChatMessages />
            
            {/* User input for questions */}
            <MessageInput />
          </main>
        </div>
      </div>
    </Provider>
  );
}

export default App;
