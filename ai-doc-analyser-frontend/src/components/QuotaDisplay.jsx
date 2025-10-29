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
      console.log('📊 Quota data received:', result);
      setQuota(result);
      setError(null);
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

  // Safely extract percentages with fallbacks
  const requestsPercent = quota.requests?.percentageRemaining ?? 100;
  const tokensPercent = quota.tokens?.percentageRemaining ?? 100;
  
  // Use the lower percentage as the overall quota
  const overallPercentage = Math.min(requestsPercent, tokensPercent);
  
  // Check if rate limit is active
  const isRateLimited = quota.rateLimitActive === true;

  return (
    <div className="quota-display" style={{ borderColor: statusInfo.color }}>
      <div className="quota-header">
        <span className="quota-icon">{statusInfo.icon}</span>
        <span className="quota-title">
          {isRateLimited ? 'API Rate Limited!' : 'API Quota (Local Tracking)'}
        </span>
      </div>
      
      {isRateLimited ? (
        // Show rate limit warning prominently
        <div className="quota-details">
          <div className="quota-warning rate-limit-warning">
            <strong>🚫 Rate Limit Exceeded</strong>
            <p>Groq API limit reached. No quota available.</p>
            <div className="quota-reset">
              <span className="reset-label">Resets in:</span>
              <span className="reset-time reset-time-large">{formatResetTime(quota.resetIn ?? 60)}</span>
            </div>
            {quota.note && (
              <small className="rate-limit-note">{quota.note}</small>
            )}
          </div>
        </div>
      ) : (
        // Show normal quota display
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
              {overallPercentage.toFixed(1)}%
            </span>
            <span className="quota-label">remaining</span>
          </div>

          <div className="quota-stats">
            <div className="stat-row">
              <span className="stat-label">Requests (RPM):</span>
              <span className="stat-value">
                {quota.requests?.perMinuteUsed ?? 0}/{quota.requests?.perMinuteLimit ?? 30}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Requests (RPD):</span>
              <span className="stat-value">
                {quota.requests?.used ?? 0}/{quota.requests?.limit ?? 1000}
              </span>
            </div>
          </div>

          <div className="quota-reset">
            <span className="reset-label">Resets in:</span>
            <span className="reset-time">{formatResetTime(quota.resetIn ?? 60)}</span>
          </div>

          {quota.note && (
            <div className="quota-note">
              <small>ℹ️ {quota.note}</small>
            </div>
          )}
        </div>
      )}

      {quota.status === 'critical' && !isRateLimited && (
        <div className="quota-warning">
          <small>⚠️ Quota almost exhausted. Wait for reset.</small>
        </div>
      )}
    </div>
  );
};

export default QuotaDisplay;
