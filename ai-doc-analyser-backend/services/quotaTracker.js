/**
 * Groq API Quota Tracker
 * 
 * Tracks API usage locally without making additional API calls.
 * Monitors request count and estimates token usage.
 * Groq free tier limits:
 * - 30 requests per minute (RPM)
 * - 14,400 tokens per minute (TPM)  
 * - 1,000 requests per day (RPD)
 */

class QuotaTracker {
  constructor() {
    // Groq free tier limits
    this.LIMITS = {
      requestsPerMinute: 30,
      tokensPerMinute: 14400,
      requestsPerDay: 1000
    };

    // Track requests in rolling windows
    this.requests = []; // Array of timestamps
    this.tokens = [];   // Array of {timestamp, count}
  }

  /**
   * Record a new API request
   * @param {number} tokensUsed - Estimated tokens used
   */
  recordRequest(tokensUsed = 0) {
    const now = Date.now();
    this.cleanup();
    
    this.requests.push(now);
    if (tokensUsed > 0) {
      this.tokens.push({ timestamp: now, count: tokensUsed });
    }
  }

  /**
   * Remove old entries outside tracking windows
   */
  cleanup() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneDayAgo = now - 86400000;

    this.requests = this.requests.filter(t => t > oneDayAgo);
    this.tokens = this.tokens.filter(t => t.timestamp > oneMinuteAgo);
  }

  /**
   * Get current quota statistics
   * @returns {Object} Quota information
   */
  getQuotaStats() {
    this.cleanup();
    const now = Date.now();

    // Count requests in different windows
    const oneMinuteAgo = now - 60000;
    const requestsLastMinute = this.requests.filter(t => t > oneMinuteAgo).length;
    const requestsToday = this.requests.length;
    
    const tokensLastMinute = this.tokens.reduce((sum, t) => sum + t.count, 0);

    // Calculate remaining
    const requestsRpmRemaining = Math.max(0, this.LIMITS.requestsPerMinute - requestsLastMinute);
    const requestsRpdRemaining = Math.max(0, this.LIMITS.requestsPerDay - requestsToday);
    const tokensRemaining = Math.max(0, this.LIMITS.tokensPerMinute - tokensLastMinute);

    // Calculate percentages (remaining)
    const rpmPercent = (requestsRpmRemaining / this.LIMITS.requestsPerMinute) * 100;
    const rpdPercent = (requestsRpdRemaining / this.LIMITS.requestsPerDay) * 100;
    const tpmPercent = (tokensRemaining / this.LIMITS.tokensPerMinute) * 100;

    // Use the most restrictive limit
    const lowestPercent = Math.min(rpmPercent, rpdPercent, tpmPercent);
    
    let status = 'healthy';
    if (lowestPercent < 10) status = 'critical';
    else if (lowestPercent < 20) status = 'warning';
    else if (lowestPercent < 50) status = 'moderate';

    // Calculate reset time (next minute boundary)
    const resetIn = 60 - Math.floor((now % 60000) / 1000);

    return {
      requests: {
        used: requestsToday,
        remaining: requestsRpdRemaining,
        limit: this.LIMITS.requestsPerDay,
        percentageRemaining: Math.round(rpdPercent * 10) / 10,
        perMinuteUsed: requestsLastMinute,
        perMinuteLimit: this.LIMITS.requestsPerMinute
      },
      tokens: {
        used: tokensLastMinute,
        remaining: tokensRemaining,
        limit: this.LIMITS.tokensPerMinute,
        percentageRemaining: Math.round(tpmPercent * 10) / 10
      },
      resetIn,
      resetAt: new Date(now + (resetIn * 1000)).toISOString(),
      status,
      lastUpdated: now,
      note: 'Local tracking - may not reflect actual API limits'
    };
  }

  /**
   * Check if quota is available
   * @returns {boolean}
   */
  hasQuota() {
    this.cleanup();
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const requestsLastMinute = this.requests.filter(t => t > oneMinuteAgo).length;
    const tokensLastMinute = this.tokens.reduce((sum, t) => sum + t.count, 0);
    
    return requestsLastMinute < this.LIMITS.requestsPerMinute &&
           tokensLastMinute < this.LIMITS.tokensPerMinute &&
           this.requests.length < this.LIMITS.requestsPerDay;
  }

  /**
   * Estimate tokens from text
   * @param {string} text
   * @returns {number}
   */
  static estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
}

// Create singleton instance
const quotaTracker = new QuotaTracker();

export default quotaTracker;
