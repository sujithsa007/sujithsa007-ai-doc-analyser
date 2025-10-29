/**
 * Groq API Quota Tracker
 * 
 * Tracks API usage from real-time Groq response headers.
 * Groq provides rate limit information in HTTP response headers:
 * - x-ratelimit-limit-requests: RPD (Requests Per Day)
 * - x-ratelimit-limit-tokens: TPM (Tokens Per Minute)
 * - x-ratelimit-remaining-requests: Remaining RPD
 * - x-ratelimit-remaining-tokens: Remaining TPM
 * - x-ratelimit-reset-requests: Time until RPD resets (e.g., "2m59.56s")
 * - x-ratelimit-reset-tokens: Time until TPM resets (e.g., "7.66s")
 */

class QuotaTracker {
  constructor() {
    // Store latest quota info from Groq API headers
    this.latestQuota = {
      requests: {
        limit: 14400, // RPD (Requests Per Day) - default for free tier
        remaining: 14400,
        resetTime: null,
        resetIn: null
      },
      tokens: {
        limit: 18000, // TPM (Tokens Per Minute) - default for free tier  
        remaining: 18000,
        resetTime: null,
        resetIn: null
      },
      lastUpdated: null
    };
  }

  /**
   * Update quota information from Groq API response headers
   * @param {Object} headers - Response headers from Groq API
   */
  updateFromHeaders(headers) {
    try {
      const now = Date.now();

      // Extract rate limit information from headers
      if (headers['x-ratelimit-limit-requests']) {
        this.latestQuota.requests.limit = parseInt(headers['x-ratelimit-limit-requests']);
      }
      if (headers['x-ratelimit-limit-tokens']) {
        this.latestQuota.tokens.limit = parseInt(headers['x-ratelimit-limit-tokens']);
      }
      if (headers['x-ratelimit-remaining-requests']) {
        this.latestQuota.requests.remaining = parseInt(headers['x-ratelimit-remaining-requests']);
      }
      if (headers['x-ratelimit-remaining-tokens']) {
        this.latestQuota.tokens.remaining = parseInt(headers['x-ratelimit-remaining-tokens']);
      }

      // Parse reset times (format: "2m59.56s" or "7.66s")
      if (headers['x-ratelimit-reset-requests']) {
        this.latestQuota.requests.resetIn = this.parseResetTime(headers['x-ratelimit-reset-requests']);
        this.latestQuota.requests.resetTime = now + (this.latestQuota.requests.resetIn * 1000);
      }
      if (headers['x-ratelimit-reset-tokens']) {
        this.latestQuota.tokens.resetIn = this.parseResetTime(headers['x-ratelimit-reset-tokens']);
        this.latestQuota.tokens.resetTime = now + (this.latestQuota.tokens.resetIn * 1000);
      }

      this.latestQuota.lastUpdated = now;

      console.log('📊 Quota updated from Groq headers:', {
        requests: `${this.latestQuota.requests.remaining}/${this.latestQuota.requests.limit}`,
        tokens: `${this.latestQuota.tokens.remaining}/${this.latestQuota.tokens.limit}`,
        requestsReset: `${this.latestQuota.requests.resetIn}s`,
        tokensReset: `${this.latestQuota.tokens.resetIn}s`
      });
    } catch (error) {
      console.error('Error updating quota from headers:', error);
    }
  }

  /**
   * Parse reset time string (e.g., "2m59.56s" or "7.66s") to seconds
   * @param {string} resetStr - Reset time string from header
   * @returns {number} Seconds until reset
   */
  parseResetTime(resetStr) {
    try {
      let totalSeconds = 0;
      
      // Parse minutes if present (e.g., "2m59.56s")
      const minutesMatch = resetStr.match(/(\d+)m/);
      if (minutesMatch) {
        totalSeconds += parseInt(minutesMatch[1]) * 60;
      }

      // Parse seconds (e.g., "59.56s" or "7.66s")
      const secondsMatch = resetStr.match(/([\d.]+)s/);
      if (secondsMatch) {
        totalSeconds += parseFloat(secondsMatch[1]);
      }

      return Math.ceil(totalSeconds);
    } catch (error) {
      console.error('Error parsing reset time:', error);
      return 60; // Default to 60 seconds
    }
  }

  /**
   * Get current quota statistics
   * @returns {Object} Quota information with percentages and status
   */
  getQuotaStats() {
    const now = Date.now();

    // Calculate percentages - remaining is what Groq gives us directly
    const requestsRemainingPercent = (this.latestQuota.requests.remaining / this.latestQuota.requests.limit) * 100;
    const tokensRemainingPercent = (this.latestQuota.tokens.remaining / this.latestQuota.tokens.limit) * 100;

    const requestsUsedPercent = 100 - requestsRemainingPercent;
    const tokensUsedPercent = 100 - tokensRemainingPercent;

    // Calculate time until reset (in seconds)
    const requestsResetIn = this.latestQuota.requests.resetTime 
      ? Math.max(0, Math.ceil((this.latestQuota.requests.resetTime - now) / 1000))
      : this.latestQuota.requests.resetIn || 0;

    const tokensResetIn = this.latestQuota.tokens.resetTime
      ? Math.max(0, Math.ceil((this.latestQuota.tokens.resetTime - now) / 1000))
      : this.latestQuota.tokens.resetIn || 0;

    // Determine overall status based on the most restrictive limit
    const lowestPercent = Math.min(requestsRemainingPercent, tokensRemainingPercent);
    let status = 'healthy';
    if (lowestPercent < 10) status = 'critical';
    else if (lowestPercent < 20) status = 'warning';
    else if (lowestPercent < 50) status = 'moderate';

    return {
      requests: {
        used: this.latestQuota.requests.limit - this.latestQuota.requests.remaining,
        remaining: this.latestQuota.requests.remaining,
        limit: this.latestQuota.requests.limit,
        percentage: Math.round(requestsUsedPercent * 10) / 10,
        percentageRemaining: Math.round(requestsRemainingPercent * 10) / 10
      },
      tokens: {
        used: this.latestQuota.tokens.limit - this.latestQuota.tokens.remaining,
        remaining: this.latestQuota.tokens.remaining,
        limit: this.latestQuota.tokens.limit,
        percentage: Math.round(tokensUsedPercent * 10) / 10,
        percentageRemaining: Math.round(tokensRemainingPercent * 10) / 10
      },
      resetIn: Math.max(requestsResetIn, tokensResetIn), // Use the longer reset time
      requestsResetIn,
      tokensResetIn,
      resetAt: this.latestQuota.tokens.resetTime 
        ? new Date(this.latestQuota.tokens.resetTime).toISOString()
        : new Date(now + (tokensResetIn * 1000)).toISOString(),
      status,
      lastUpdated: this.latestQuota.lastUpdated 
        ? new Date(this.latestQuota.lastUpdated).toISOString()
        : null
    };
  }

  /**
   * Check if quota is available (based on real-time data)
   * @returns {boolean} True if quota is available
   */
  hasQuota() {
    return this.latestQuota.requests.remaining > 0 && 
           this.latestQuota.tokens.remaining > 0;
  }

  /**
   * Get quota status for a specific type
   * @param {string} type - 'requests' or 'tokens'
   * @returns {string} Status: 'healthy', 'moderate', 'warning', or 'critical'
   */
  getQuotaStatus(type = 'requests') {
    const quota = this.latestQuota[type];
    if (!quota) return 'healthy';

    const percentageRemaining = (quota.remaining / quota.limit) * 100;

    if (percentageRemaining < 10) return 'critical';
    if (percentageRemaining < 20) return 'warning';
    if (percentageRemaining < 50) return 'moderate';
    return 'healthy';
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
