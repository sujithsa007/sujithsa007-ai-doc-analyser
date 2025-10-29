/**
 * Groq API Quota Tracker
 * 
 * Tracks API usage and calculates remaining quota based on Groq's free tier limits
 * Free Tier Limits (as of 2025):
 * - 30 requests per minute (RPM)
 * - 14,400 tokens per minute (TPM)
 * - Resets every minute
 */

class QuotaTracker {
  constructor() {
    // Groq free tier limits
    this.LIMITS = {
      requestsPerMinute: 30,
      tokensPerMinute: 14400,
    };

    // Tracking data
    this.requests = [];
    this.tokens = [];
  }

  /**
   * Record a new API request
   * @param {number} tokensUsed - Estimated tokens used in the request
   */
  recordRequest(tokensUsed = 0) {
    const now = Date.now();
    
    // Add new request
    this.requests.push(now);
    if (tokensUsed > 0) {
      this.tokens.push({ timestamp: now, count: tokensUsed });
    }

    // Clean up old entries (older than 1 minute)
    this.cleanupOldEntries();
  }

  /**
   * Remove entries older than 1 minute
   */
  cleanupOldEntries() {
    const oneMinuteAgo = Date.now() - 60000;
    
    this.requests = this.requests.filter(timestamp => timestamp > oneMinuteAgo);
    this.tokens = this.tokens.filter(entry => entry.timestamp > oneMinuteAgo);
  }

  /**
   * Get current quota usage statistics
   * @returns {Object} Quota statistics
   */
  getQuotaStats() {
    this.cleanupOldEntries();

    const requestsUsed = this.requests.length;
    const tokensUsed = this.tokens.reduce((sum, entry) => sum + entry.count, 0);

    const requestsRemaining = Math.max(0, this.LIMITS.requestsPerMinute - requestsUsed);
    const tokensRemaining = Math.max(0, this.LIMITS.tokensPerMinute - tokensUsed);

    // Calculate percentages
    const requestsPercentage = Math.round((requestsUsed / this.LIMITS.requestsPerMinute) * 100);
    const tokensPercentage = Math.round((tokensUsed / this.LIMITS.tokensPerMinute) * 100);

    // Calculate time until reset (end of current minute)
    const now = new Date();
    const nextMinute = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 
                                 now.getHours(), now.getMinutes() + 1, 0, 0);
    const secondsUntilReset = Math.ceil((nextMinute - now) / 1000);

    return {
      requests: {
        used: requestsUsed,
        remaining: requestsRemaining,
        limit: this.LIMITS.requestsPerMinute,
        percentage: requestsPercentage,
        percentageRemaining: Math.max(0, 100 - requestsPercentage)
      },
      tokens: {
        used: tokensUsed,
        remaining: tokensRemaining,
        limit: this.LIMITS.tokensPerMinute,
        percentage: tokensPercentage,
        percentageRemaining: Math.max(0, 100 - tokensPercentage)
      },
      resetIn: secondsUntilReset,
      resetAt: nextMinute.toISOString(),
      status: this.getQuotaStatus(requestsPercentage, tokensPercentage)
    };
  }

  /**
   * Get quota status indicator
   * @param {number} requestsPercentage 
   * @param {number} tokensPercentage 
   * @returns {string} Status indicator
   */
  getQuotaStatus(requestsPercentage, tokensPercentage) {
    const maxPercentage = Math.max(requestsPercentage, tokensPercentage);
    
    if (maxPercentage >= 90) return 'critical';
    if (maxPercentage >= 70) return 'warning';
    if (maxPercentage >= 50) return 'moderate';
    return 'healthy';
  }

  /**
   * Check if quota is available
   * @param {number} estimatedTokens - Estimated tokens for the request
   * @returns {boolean} True if quota is available
   */
  hasQuota(estimatedTokens = 0) {
    this.cleanupOldEntries();

    const requestsUsed = this.requests.length;
    const tokensUsed = this.tokens.reduce((sum, entry) => sum + entry.count, 0);

    if (requestsUsed >= this.LIMITS.requestsPerMinute) {
      return false;
    }

    if (estimatedTokens > 0 && (tokensUsed + estimatedTokens) > this.LIMITS.tokensPerMinute) {
      return false;
    }

    return true;
  }

  /**
   * Estimate tokens from text
   * Rough estimation: ~4 characters per token
   * @param {string} text 
   * @returns {number} Estimated token count
   */
  static estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }
}

// Create singleton instance
const quotaTracker = new QuotaTracker();

export default quotaTracker;
