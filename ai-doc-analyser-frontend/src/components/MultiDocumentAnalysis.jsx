/**
 * MultiDocumentAnalysis Component
 * 
 * Advanced UI for bulk document analysis with specialized workflows:
 * - Resume screening and filtering
 * - Excel data merging
 * - Cross-document comparison
 * - Structured data extraction
 */

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { apiClient } from '../services/apiService';
import './MultiDocumentAnalysis.css';

const ANALYSIS_MODES = {
  RESUME_SCREENING: {
    id: 'resume-screening',
    name: 'Resume Screening',
    description: 'Filter resumes based on job requirements',
    icon: '📋',
    minDocuments: 1,
  },
  EXCEL_MERGE: {
    id: 'excel-merge',
    name: 'Excel Data Merging',
    description: 'Merge multiple Excel files by common key',
    icon: '📊',
    minDocuments: 2,
  },
  DOCUMENT_COMPARISON: {
    id: 'document-comparison',
    name: 'Document Comparison',
    description: 'Compare documents and find differences',
    icon: '🔍',
    minDocuments: 2,
  },
  DATA_EXTRACTION: {
    id: 'data-extraction',
    name: 'Data Extraction',
    description: 'Extract specific fields from documents',
    icon: '📝',
    minDocuments: 1,
  },
};

const MultiDocumentAnalysis = ({ onClose }) => {
  const dispatch = useDispatch();
  const { documents } = useSelector((state) => state.pdf);
  
  const [selectedMode, setSelectedMode] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Resume screening state
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  
  // Excel merge state
  const [keyField, setKeyField] = useState('');
  const [fieldsToInclude, setFieldsToInclude] = useState('');
  
  // Data extraction state
  const [extractFields, setExtractFields] = useState('');
  
  /**
   * Handle resume screening analysis
   */
  const handleResumeScreening = async () => {
    if (!requiredSkills.trim()) {
      setError('Please enter required skills');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const requirements = {
        requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        preferredSkills: preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
        minExperience: minExperience ? parseInt(minExperience) : 0,
        jobTitle: jobTitle.trim(),
      };
      
      const resumes = documents.map(doc => ({
        fileName: doc.fileName,
        content: doc.content,
      }));
      
      console.log('Screening resumes:', { resumes: resumes.length, requirements });
      
      const response = await apiClient.post('/analyze/screen-resumes', {
        resumes,
        requirements,
      });
      
      setResults(response.data);
      
    } catch (err) {
      console.error('Resume screening error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Handle Excel data merging
   */
  const handleExcelMerge = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const mergeConfig = {
        keyField: keyField.trim() || null,
        fieldsToInclude: fieldsToInclude.split(',').map(s => s.trim()).filter(Boolean),
        conflictResolution: 'keep-first',
      };
      
      const excelFiles = documents.map(doc => ({
        fileName: doc.fileName,
        content: doc.content,
      }));
      
      const response = await apiClient.post('/analyze/merge-excel', {
        excelFiles,
        mergeConfig,
      });
      
      setResults(response.data);
      
    } catch (err) {
      console.error('Excel merge error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Handle document comparison
   */
  const handleDocumentComparison = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const docs = documents.map(doc => ({
        fileName: doc.fileName,
        content: doc.content,
      }));
      
      const response = await apiClient.post('/analyze/compare-multi', {
        documents: docs,
        comparisonConfig: {},
      });
      
      setResults(response.data);
      
    } catch (err) {
      console.error('Document comparison error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Handle data extraction
   */
  const handleDataExtraction = async () => {
    if (!extractFields.trim()) {
      setError('Please enter fields to extract');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const extractionConfig = {
        fields: extractFields.split(',').map(s => s.trim()).filter(Boolean),
        outputFormat: 'JSON',
      };
      
      const docs = documents.map(doc => ({
        fileName: doc.fileName,
        content: doc.content,
      }));
      
      const response = await apiClient.post('/analyze/extract-data', {
        documents: docs,
        extractionConfig,
      });
      
      setResults(response.data);
      
    } catch (err) {
      console.error('Data extraction error:', err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  /**
   * Execute analysis based on selected mode
   */
  const handleAnalyze = async () => {
    switch (selectedMode) {
      case ANALYSIS_MODES.RESUME_SCREENING.id:
        await handleResumeScreening();
        break;
      case ANALYSIS_MODES.EXCEL_MERGE.id:
        await handleExcelMerge();
        break;
      case ANALYSIS_MODES.DOCUMENT_COMPARISON.id:
        await handleDocumentComparison();
        break;
      case ANALYSIS_MODES.DATA_EXTRACTION.id:
        await handleDataExtraction();
        break;
      default:
        setError('Please select an analysis mode');
    }
  };
  
  /**
   * Export results to file
   */
  const handleExport = (format) => {
    if (!results) return;
    
    let content, mimeType, extension;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(results, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'csv':
        content = convertToCSV(results);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      default:
        return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-results-${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  /**
   * Convert results to CSV format
   */
  const convertToCSV = (data) => {
    if (data.results && Array.isArray(data.results)) {
      // For resume screening
      if (data.results[0]?.matchScore !== undefined) {
        const headers = ['File Name', 'Match Score', 'Recommendation', 'Skills Found', 'Missing Skills', 'Experience', 'Summary'];
        const rows = data.results.map(r => [
          r.fileName,
          r.matchScore,
          r.recommendation,
          r.skillsFound.join('; '),
          r.missingSkills.join('; '),
          r.experienceYears,
          r.summary.replace(/,/g, ';')
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
      
      // For data extraction
      if (data.results[0]?.extractedData !== undefined) {
        const allFields = new Set();
        data.results.forEach(r => Object.keys(r.extractedData || {}).forEach(k => allFields.add(k)));
        const headers = ['File Name', ...Array.from(allFields)];
        const rows = data.results.map(r => [
          r.fileName,
          ...Array.from(allFields).map(f => r.extractedData[f] || '')
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
    }
    
    // Fallback: stringify
    return JSON.stringify(data, null, 2);
  };
  
  /**
   * Render mode selection
   */
  const renderModeSelection = () => (
    <div className="mode-selection">
      <h3>Select Analysis Mode</h3>
      <div className="mode-grid">
        {Object.values(ANALYSIS_MODES).map((mode) => {
          const canUse = documents.length >= mode.minDocuments;
          return (
            <button
              key={mode.id}
              className={`mode-card ${selectedMode === mode.id ? 'selected' : ''} ${!canUse ? 'disabled' : ''}`}
              onClick={() => canUse && setSelectedMode(mode.id)}
              disabled={!canUse}
            >
              <div className="mode-icon">{mode.icon}</div>
              <div className="mode-name">{mode.name}</div>
              <div className="mode-description">{mode.description}</div>
              {!canUse && (
                <div className="mode-requirement">
                  Requires {mode.minDocuments}+ documents
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
  
  /**
   * Render configuration form based on selected mode
   */
  const renderConfiguration = () => {
    if (!selectedMode) return null;
    
    return (
      <div className="configuration-section">
        <h3>Configure Analysis</h3>
        
        {selectedMode === ANALYSIS_MODES.RESUME_SCREENING.id && (
          <div className="config-form">
            <div className="form-group">
              <label>Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., React Developer"
              />
            </div>
            
            <div className="form-group">
              <label>Required Skills (comma-separated) *</label>
              <input
                type="text"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="e.g., React, JavaScript, TypeScript"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Preferred Skills (comma-separated)</label>
              <input
                type="text"
                value={preferredSkills}
                onChange={(e) => setPreferredSkills(e.target.value)}
                placeholder="e.g., Node.js, GraphQL, AWS"
              />
            </div>
            
            <div className="form-group">
              <label>Minimum Experience (years)</label>
              <input
                type="number"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                placeholder="e.g., 3"
                min="0"
              />
            </div>
          </div>
        )}
        
        {selectedMode === ANALYSIS_MODES.EXCEL_MERGE.id && (
          <div className="config-form">
            <div className="form-group">
              <label>Common Key Field (leave empty for auto-detect)</label>
              <input
                type="text"
                value={keyField}
                onChange={(e) => setKeyField(e.target.value)}
                placeholder="e.g., user_id, email, id"
              />
            </div>
            
            <div className="form-group">
              <label>Fields to Include (comma-separated, leave empty for all)</label>
              <input
                type="text"
                value={fieldsToInclude}
                onChange={(e) => setFieldsToInclude(e.target.value)}
                placeholder="e.g., name, email, department"
              />
            </div>
          </div>
        )}
        
        {selectedMode === ANALYSIS_MODES.DATA_EXTRACTION.id && (
          <div className="config-form">
            <div className="form-group">
              <label>Fields to Extract (comma-separated) *</label>
              <input
                type="text"
                value={extractFields}
                onChange={(e) => setExtractFields(e.target.value)}
                placeholder="e.g., name, email, phone, address"
                required
              />
            </div>
            
            <div className="help-text">
              Enter the field names you want to extract from each document.
              The AI will attempt to find these fields intelligently.
            </div>
          </div>
        )}
        
        {selectedMode === ANALYSIS_MODES.DOCUMENT_COMPARISON.id && (
          <div className="config-form">
            <div className="help-text">
              This will compare all uploaded documents and identify:
              <ul>
                <li>Common elements across all documents</li>
                <li>Unique elements in each document</li>
                <li>Contradictions or conflicts</li>
                <li>Missing information</li>
              </ul>
            </div>
          </div>
        )}
        
        <div className="config-actions">
          <button
            className="btn-analyze"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>
          
          <button className="btn-cancel" onClick={() => setSelectedMode(null)}>
            Back
          </button>
        </div>
      </div>
    );
  };
  
  /**
   * Render resume screening results
   */
  const renderResumeResults = () => {
    if (!results || !results.results) return null;
    
    return (
      <div className="results-section">
        <div className="results-header">
          <h3>Resume Screening Results</h3>
          <div className="results-summary">
            <div className="summary-card">
              <div className="summary-value">{results.totalResumes}</div>
              <div className="summary-label">Total Resumes</div>
            </div>
            <div className="summary-card success">
              <div className="summary-value">{results.summary.strongMatches}</div>
              <div className="summary-label">Strong Matches</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{results.summary.matches}</div>
              <div className="summary-label">Matches</div>
            </div>
            <div className="summary-card warning">
              <div className="summary-value">{results.summary.partialMatches}</div>
              <div className="summary-label">Partial Matches</div>
            </div>
          </div>
        </div>
        
        <div className="results-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>File Name</th>
                <th>Match Score</th>
                <th>Recommendation</th>
                <th>Skills Found</th>
                <th>Missing Skills</th>
                <th>Experience</th>
              </tr>
            </thead>
            <tbody>
              {results.results.map((result, idx) => (
                <tr key={idx} className={`recommendation-${result.recommendation.toLowerCase()}`}>
                  <td>{idx + 1}</td>
                  <td>{result.fileName}</td>
                  <td>
                    <div className="match-score">
                      <div className="score-bar">
                        <div
                          className="score-fill"
                          style={{ width: `${result.matchScore}%` }}
                        />
                      </div>
                      <span>{result.matchScore}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${result.recommendation.toLowerCase()}`}>
                      {result.recommendation.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="skills-list">
                      {result.skillsFound.map((skill, i) => (
                        <span key={i} className="skill-tag found">{skill}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="skills-list">
                      {result.missingSkills.map((skill, i) => (
                        <span key={i} className="skill-tag missing">{skill}</span>
                      ))}
                    </div>
                  </td>
                  <td>{result.experienceYears} years</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  /**
   * Render results based on analysis mode
   */
  const renderResults = () => {
    if (!results) return null;
    
    return (
      <div className="analysis-results">
        {selectedMode === ANALYSIS_MODES.RESUME_SCREENING.id && renderResumeResults()}
        
        {selectedMode !== ANALYSIS_MODES.RESUME_SCREENING.id && (
          <div className="results-section">
            <h3>Analysis Results</h3>
            <pre className="results-json">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="results-actions">
          <button className="btn-export" onClick={() => handleExport('json')}>
            Export JSON
          </button>
          <button className="btn-export" onClick={() => handleExport('csv')}>
            Export CSV
          </button>
          <button className="btn-new" onClick={() => {
            setResults(null);
            setSelectedMode(null);
          }}>
            New Analysis
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="multi-doc-analysis">
      <div className="analysis-header">
        <h2>🚀 Multi-Document Intelligence</h2>
        <button className="btn-close" onClick={onClose}>×</button>
      </div>
      
      <div className="analysis-info">
        <p>📄 <strong>{documents.length}</strong> documents loaded</p>
      </div>
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {!results && !selectedMode && renderModeSelection()}
      {!results && selectedMode && renderConfiguration()}
      {results && renderResults()}
    </div>
  );
};

export default MultiDocumentAnalysis;
