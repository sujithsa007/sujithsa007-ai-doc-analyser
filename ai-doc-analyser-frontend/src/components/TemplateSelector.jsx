/**
 * TemplateSelector Component
 * Allows users to select and run question templates
 */

import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTemplate } from '../store/slices/analysisSlice';
import { addMessage, setIsAsking } from '../store/slices/chatSlice';
import { askQuestion } from '../services/apiService';
import './TemplateSelector.css';

const TemplateSelector = () => {
  const dispatch = useDispatch();
  const { templates, customTemplates, activeTemplate } = useSelector((state) => state.analysis);
  const { content } = useSelector((state) => state.pdf);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const allTemplates = [
    ...Object.entries(templates).map(([id, template]) => ({ id, ...template, type: 'built-in' })),
    ...customTemplates.map((template) => ({ ...template, type: 'custom' })),
  ];

  // Get unique categories
  const categories = ['All', ...new Set(allTemplates.map(t => t.category || 'Other'))];

  // Filter templates by category and search
  const filteredTemplates = allTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.category && template.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (templateId) => {
    dispatch(setActiveTemplate(templateId));
  };

  const handleRunTemplate = async (template) => {
    if (!content) {
      alert('Please upload a document first');
      return;
    }

    if (!template.questions || template.questions.length === 0) {
      alert('This template has no questions');
      return;
    }

    setIsRunning(true);
    setProgress(0);

    const totalQuestions = template.questions.length;

    for (let i = 0; i < totalQuestions; i++) {
      const question = template.questions[i];

      // Add user question
      dispatch(
        addMessage({
          type: 'user',
          content: question,
        })
      );

      dispatch(setIsAsking(true));

      try {
        const answer = await askQuestion(question, content);

        // Add AI response
        dispatch(
          addMessage({
            type: 'ai',
            content: answer,
          })
        );

        setProgress(Math.round(((i + 1) / totalQuestions) * 100));
      } catch (error) {
        dispatch(
          addMessage({
            type: 'ai',
            content: `Error: ${error.message}`,
          })
        );
      } finally {
        dispatch(setIsAsking(false));
      }

      // Small delay between questions to avoid rate limiting
      if (i < totalQuestions - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    setIsRunning(false);
    setProgress(0);
  };

  return (
    <div className="template-selector">
      <div className="template-selector-header">
        <h3>📋 Analysis Templates</h3>
        <p>Choose from 50+ pre-built question sets for instant document analysis</p>
      </div>

      {/* Search and Filter */}
      <div className="template-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="template-search"
          />
        </div>

        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({allTemplates.filter(t => category === 'All' || t.category === category).length})
            </button>
          ))}
        </div>
      </div>

      {isRunning && (
        <div className="template-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>Running template analysis... {progress}%</p>
        </div>
      )}

      <div className="template-grid">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className={`template-card ${activeTemplate === template.id ? 'active' : ''}`}
            onClick={() => handleSelectTemplate(template.id)}
          >
            <div className="template-header">
              <span className="template-icon">{template.icon || '📄'}</span>
              <div className="template-title-group">
                <h4>{template.name}</h4>
                {template.category && (
                  <span className="category-badge">{template.category}</span>
                )}
              </div>
              {template.type === 'custom' && (
                <span className="custom-badge">Custom</span>
              )}
            </div>

            <div className="template-questions">
              <p className="questions-count">
                {template.questions?.length || 0} questions
              </p>
              {template.questions && template.questions.length > 0 && (
                <ul className="question-preview">
                  {template.questions.slice(0, 2).map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                  {template.questions.length > 2 && (
                    <li className="more-questions">
                      +{template.questions.length - 2} more...
                    </li>
                  )}
                </ul>
              )}
            </div>

            <button
              className="btn-run-template"
              onClick={(e) => {
                e.stopPropagation();
                handleRunTemplate(template);
              }}
              disabled={isRunning || !content}
            >
              {isRunning ? '⏳ Running...' : '▶️ Run Template'}
            </button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="no-templates">
          <p>No templates found matching "{searchQuery}"</p>
          <p className="hint">Try a different search term or category</p>
        </div>
      )}

      {allTemplates.length === 0 && (
        <div className="no-templates">
          <p>No templates available</p>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
