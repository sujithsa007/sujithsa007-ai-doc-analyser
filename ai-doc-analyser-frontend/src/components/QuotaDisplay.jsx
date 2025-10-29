import { useState, useEffect } from 'react';
import { getApiQuota } from '../services/apiService';
import './QuotaDisplay.css';

/**
 * QuotaDisplay Component
 * 
 * Displays the current Groq API quota usage at the top of the application
 * Shows remaining requests/tokens as a percentage with visual indicators
 */
const QuotaDisplay = () => {
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch quota on component mount and refresh every 30 seconds
  useEffect(() => {
    fetchQuota();
    const interval = setInterval(fetchQuota, 30000); // Refresh every 30 seconds to avoid hitting rate limits
    return () => clearInterval(interval);
  }, []);

  const fetchQuota = async () => {
    try {
      const result = await getApiQuota();
      if (result.success && result.quota) {
        setQuota(result.quota);
        setError(null);
      } else {
        setError('Unable to fetch quota');
      }
    } catch (err) {
      setError('Quota unavailable');
      console.error('Quota fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="quota-display loading">
        <span className="quota-icon">📊</span>
        <span>Loading quota...</span>
      </div>
    );
  }

  if (error || !quota) {
    return null; // Don't show quota if unavailable
  }

  // Determine status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'healthy':
        return { color: '#10b981', icon: '✅', text: 'Healthy' };
      case 'moderate':
        return { color: '#f59e0b', icon: '⚠️', text: 'Moderate' };
      case 'warning':
        return { color: '#ef4444', icon: '⚠️', text: 'Low' };
      case 'critical':
        return { color: '#dc2626', icon: '🚫', text: 'Critical' };
      default:
        return { color: '#6b7280', icon: '📊', text: 'Unknown' };
    }
  };

  const statusInfo = getStatusInfo(quota.status);

  // Format reset time
  const formatResetTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  // Use the lower percentage as the overall quota
  const overallPercentage = Math.min(
    quota.requests.percentageRemaining,
    quota.tokens.percentageRemaining
  );

  return (
    <div className="quota-display" style={{ borderColor: statusInfo.color }}>
      <div className="quota-header">
        <span className="quota-icon">{statusInfo.icon}</span>
        <span className="quota-title">API Quota</span>
      </div>
      
      <div className="quota-details">
        <div className="quota-bar-container">
          <div 
            className="quota-bar" 
            style={{ 
              width: `${overallPercentage}%`,
              backgroundColor: statusInfo.color
            }}
          />
        </div>
        
        <div className="quota-text">
          <span className="quota-percentage" style={{ color: statusInfo.color }}>
            {overallPercentage}%
          </span>
          <span className="quota-label">remaining</span>
        </div>

        <div className="quota-reset">
          <span className="reset-label">Resets in:</span>
          <span className="reset-time">{formatResetTime(quota.resetIn)}</span>
        </div>
      </div>

      {quota.status === 'critical' && (
        <div className="quota-warning">
          <small>⚠️ Quota almost exhausted. Wait for reset.</small>
        </div>
      )}
    </div>
  );
};

export default QuotaDisplay;
