/**
 * Query Cache Service
 * 
 * Implements intelligent caching for AI responses to avoid redundant API calls
 * and speed up repeated questions
 */

class QueryCache {
  constructor(maxSize = 50, ttl = 3600000) { // 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl; // Time to live in milliseconds
  }

  /**
   * Generate cache key from question and document IDs
   */
  generateKey(question, documentIds) {
    const sortedIds = [...documentIds].sort().join(',');
    return `${question.toLowerCase().trim()}:${sortedIds}`;
  }

  /**
   * Get cached response if available and not expired
   */
  get(question, documentIds) {
    const key = this.generateKey(question, documentIds);
    const cached = this.cache.get(key);

    if (!cached) {
      if (process.env.NODE_ENV === 'development') console.debug('💨 Cache MISS:', question.substring(0, 50));
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      if (process.env.NODE_ENV === 'development') console.debug('⏰ Cache EXPIRED:', question.substring(0, 50));
      this.cache.delete(key);
      return null;
    }

    if (process.env.NODE_ENV === 'development') console.debug('✅ Cache HIT:', question.substring(0, 50), '(saved API call)');
    return cached.response;
  }

  /**
   * Store response in cache
   */
  set(question, documentIds, response) {
    const key = this.generateKey(question, documentIds);

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      if (process.env.NODE_ENV === 'development') console.debug('🗑️  Cache evicted oldest entry');
    }

    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      question,
      documentIds
    });

    if (process.env.NODE_ENV === 'development') console.debug(`💾 Cached response for: "${question.substring(0, 50)}..." (${this.cache.size}/${this.maxSize})`);
  }

  /**
   * Clear all cached entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    if (process.env.NODE_ENV === 'development') console.debug(`🧹 Cache cleared (${size} entries removed)`);
  }

  /**
   * Clear entries for specific documents
   */
  clearForDocuments(documentIds) {
    const sortedIds = [...documentIds].sort().join(',');
    let cleared = 0;

    for (const [key, value] of this.cache.entries()) {
      const cachedIds = value.documentIds.sort().join(',');
      if (cachedIds === sortedIds) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (process.env.NODE_ENV === 'development') console.debug(`🧹 Cleared ${cleared} cache entries for documents:`, documentIds);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        question: value.question,
        age: Date.now() - value.timestamp,
        documentCount: value.documentIds.length
      }))
    };
  }
}

// Create singleton instance
const queryCache = new QueryCache(50, 3600000); // 50 entries, 1 hour TTL

export default queryCache;
