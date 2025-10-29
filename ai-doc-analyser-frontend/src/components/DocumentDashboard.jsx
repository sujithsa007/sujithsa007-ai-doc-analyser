/**
 * DocumentDashboard Component
 * Displays document statistics, insights, and analytics
 */

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setInsights, setSummary } from '../store/slices/analysisSlice';
import { extractInsights, generateSummary } from '../services/analysisService';
import './DocumentDashboard.css';

const DocumentDashboard = () => {
  const dispatch = useDispatch();
  const { content, selectedFile, activeDocumentId, documents } = useSelector((state) => state.pdf);
  const { insights, summaries } = useSelector((state) => state.analysis);
  const [loading, setLoading] = useState(false);

  const activeDocument = documents.find(d => d.id === activeDocumentId);
  const currentInsights = insights[activeDocumentId] || null;
  const currentSummary = summaries[activeDocumentId] || null;

  useEffect(() => {
    if (content && activeDocumentId && !currentInsights && !loading) {
      generateDocumentInsights();
    }
  }, [content, activeDocumentId]);

  const generateDocumentInsights = async () => {
    setLoading(true);
    try {
      // Generate summary
      const summary = await generateSummary(content, getDocumentType());
      dispatch(setSummary({ documentId: activeDocumentId, summary }));

      // Extract insights
      const docInsights = await extractInsights(content);
      dispatch(setInsights({ documentId: activeDocumentId, insights: docInsights }));
    } catch (error) {
      console.error('Failed to generate insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentType = () => {
    const filename = selectedFile?.name || activeDocument?.file?.name || '';
    const ext = filename.split('.').pop()?.toLowerCase();
    const typeMap = {
      pdf: 'pdf',
      doc: 'document',
      docx: 'document',
      xls: 'spreadsheet',
      xlsx: 'spreadsheet',
    };
    return typeMap[ext] || 'general';
  };

  const getStats = () => {
    if (!content) return null;

    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    const characters = content.length;

    const avgWordsPerSentence = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
    const readingTime = Math.ceil(words.length / 200); // 200 words per minute

    return {
      words: words.length,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      characters,
      avgWordsPerSentence,
      readingTime,
    };
  };

  const stats = getStats();

  if (!content) {
    return (
      <div className="dashboard-empty">
        <p>📊 Upload a document to see analytics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Analyzing document...</p>
      </div>
    );
  }

  return (
    <div className="document-dashboard">
      <div className="dashboard-header">
        <h3>📊 Document Intelligence</h3>
        <button className="btn-refresh" onClick={generateDocumentInsights} title="Refresh insights">
          🔄
        </button>
      </div>

      {/* Document Statistics */}
      {stats && (
        <div className="dashboard-section">
          <h4>📈 Statistics</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.words.toLocaleString()}</div>
              <div className="stat-label">Words</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.sentences.toLocaleString()}</div>
              <div className="stat-label">Sentences</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.paragraphs.toLocaleString()}</div>
              <div className="stat-label">Paragraphs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.readingTime} min</div>
              <div className="stat-label">Reading Time</div>
            </div>
          </div>
        </div>
      )}

      {/* Document Summary */}
      {currentSummary && (
        <div className="dashboard-section">
          <h4>📝 Summary</h4>
          <div className="summary-box">
            <p>{currentSummary.summary}</p>
          </div>

          {currentSummary.keyPoints && currentSummary.keyPoints.length > 0 && (
            <div className="key-points">
              <h5>Key Points:</h5>
              <ul>
                {currentSummary.keyPoints.map((point, idx) => (
                  <li key={idx}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Sentiment & Readability */}
      {currentInsights && (
        <div className="dashboard-section">
          <h4>🎯 Analysis</h4>
          <div className="insights-grid">
            {currentInsights.sentiment && (
              <div className="insight-card">
                <div className="insight-label">Sentiment</div>
                <div className={`insight-value sentiment-${currentInsights.sentiment}`}>
                  {getSentimentIcon(currentInsights.sentiment)} {currentInsights.sentiment}
                </div>
              </div>
            )}

            {currentInsights.readability && (
              <div className="insight-card">
                <div className="insight-label">Readability</div>
                <div className="insight-value">
                  {getComplexityIcon(currentInsights.readability.level)} {currentInsights.readability.level}
                </div>
              </div>
            )}

            {currentInsights.complexity && (
              <div className="insight-card">
                <div className="insight-label">Complexity</div>
                <div className="insight-value">
                  {getComplexityIcon(currentInsights.complexity)} {currentInsights.complexity}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topics */}
      {currentInsights?.topics && currentInsights.topics.length > 0 && (
        <div className="dashboard-section">
          <h4>🏷️ Topics</h4>
          <div className="topics-list">
            {currentInsights.topics.map((topic, idx) => (
              <span key={idx} className="topic-tag">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getSentimentIcon = (sentiment) => {
  const icons = {
    positive: '😊',
    neutral: '😐',
    negative: '😞',
  };
  return icons[sentiment] || '😐';
};

const getComplexityIcon = (complexity) => {
  const icons = {
    Easy: '🟢',
    Medium: '🟡',
    Hard: '🔴',
    easy: '🟢',
    medium: '🟡',
    hard: '🔴',
  };
  return icons[complexity] || '🟡';
};

export default DocumentDashboard;
