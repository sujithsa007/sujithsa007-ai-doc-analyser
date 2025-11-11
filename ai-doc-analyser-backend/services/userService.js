/**
 * 👥 User Management Service
 * 
 * Provides user CRUD operations and API key management:
 * - User storage and retrieval (in-memory, can be replaced with database)
 * - API key generation and rotation
 * - User validation and lookup
 * - Session management
 * 
 * Note: This uses in-memory storage for simplicity.
 * For production, replace with a proper database (MongoDB, PostgreSQL, etc.)
 */

import { randomUUID } from 'crypto';

// In-memory user storage (replace with database in production)
const users = new Map();
const apiKeys = new Map(); // Maps API keys to user IDs
const refreshTokens = new Map(); // Maps refresh tokens to user IDs

/**
 * User Storage Service
 */
class UserService {
  /**
   * Create a new user
   */
  createUser(userData) {
    const userId = randomUUID();
    const user = {
      id: userId,
      email: userData.email,
      username: userData.username,
      passwordHash: userData.passwordHash, // Pre-hashed by authService
      role: userData.role || 'user',
      apiKey: this.generateAPIKey(),
      apiKeyActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      requestCount: 0,
      tokenCount: 0
    };

    users.set(userId, user);
    apiKeys.set(user.apiKey, userId);

    // Return user without password hash
    return this.sanitizeUser(user);
  }

  /**
   * Get user by ID
   */
  getUserById(userId) {
    const user = users.get(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email) {
    for (const user of users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user; // Return with password hash for authentication
      }
    }
    return null;
  }

  /**
   * Get user by username
   */
  getUserByUsername(username) {
    for (const user of users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  /**
   * Get user by API key
   */
  getUserByAPIKey(apiKey) {
    const userId = apiKeys.get(apiKey);
    if (!userId) return null;
    
    const user = users.get(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  /**
   * Update user information
   */
  updateUser(userId, updates) {
    const user = users.get(userId);
    if (!user) return null;

    // Update allowed fields
    const allowedUpdates = ['username', 'email', 'role'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    user.updatedAt = new Date().toISOString();
    users.set(userId, user);

    return this.sanitizeUser(user);
  }

  /**
   * Update user password hash
   */
  updatePassword(userId, newPasswordHash) {
    const user = users.get(userId);
    if (!user) return false;

    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date().toISOString();
    users.set(userId, user);

    return true;
  }

  /**
   * Delete user
   */
  deleteUser(userId) {
    const user = users.get(userId);
    if (!user) return false;

    // Remove API key mapping
    apiKeys.delete(user.apiKey);
    
    // Remove user
    users.delete(userId);

    return true;
  }

  /**
   * Generate a new API key
   */
  generateAPIKey() {
    // Generate a secure random API key
    const prefix = 'aiDoc_';
    const randomPart = randomUUID().replace(/-/g, '');
    return `${prefix}${randomPart}`;
  }

  /**
   * Rotate API key for user
   */
  rotateAPIKey(userId) {
    const user = users.get(userId);
    if (!user) return null;

    // Remove old API key mapping
    apiKeys.delete(user.apiKey);

    // Generate new API key
    const newAPIKey = this.generateAPIKey();
    user.apiKey = newAPIKey;
    user.updatedAt = new Date().toISOString();

    // Add new API key mapping
    apiKeys.set(newAPIKey, userId);
    users.set(userId, user);

    return newAPIKey;
  }

  /**
   * Deactivate API key
   */
  deactivateAPIKey(userId) {
    const user = users.get(userId);
    if (!user) return false;

    user.apiKeyActive = false;
    user.updatedAt = new Date().toISOString();
    users.set(userId, user);

    return true;
  }

  /**
   * Activate API key
   */
  activateAPIKey(userId) {
    const user = users.get(userId);
    if (!user) return false;

    user.apiKeyActive = true;
    user.updatedAt = new Date().toISOString();
    users.set(userId, user);

    return true;
  }

  /**
   * Update last login time
   */
  updateLastLogin(userId) {
    const user = users.get(userId);
    if (!user) return false;

    user.lastLogin = new Date().toISOString();
    users.set(userId, user);

    return true;
  }

  /**
   * Track request for user (for analytics and rate limiting)
   */
  trackRequest(userId, tokensUsed = 0) {
    const user = users.get(userId);
    if (!user) return false;

    user.requestCount = (user.requestCount || 0) + 1;
    user.tokenCount = (user.tokenCount || 0) + tokensUsed;
    users.set(userId, user);

    return true;
  }

  /**
   * Get user statistics
   */
  getUserStats(userId) {
    const user = users.get(userId);
    if (!user) return null;

    return {
      requestCount: user.requestCount || 0,
      tokenCount: user.tokenCount || 0,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
  }

  /**
   * Store refresh token
   */
  storeRefreshToken(refreshToken, userId) {
    refreshTokens.set(refreshToken, {
      userId,
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Validate refresh token
   */
  validateRefreshToken(refreshToken) {
    const tokenData = refreshTokens.get(refreshToken);
    return tokenData ? tokenData.userId : null;
  }

  /**
   * Revoke refresh token
   */
  revokeRefreshToken(refreshToken) {
    return refreshTokens.delete(refreshToken);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  revokeAllRefreshTokens(userId) {
    let revokedCount = 0;
    for (const [token, data] of refreshTokens.entries()) {
      if (data.userId === userId) {
        refreshTokens.delete(token);
        revokedCount++;
      }
    }
    return revokedCount;
  }

  /**
   * Check if email exists
   */
  emailExists(email) {
    return this.getUserByEmail(email) !== null;
  }

  /**
   * Check if username exists
   */
  usernameExists(username) {
    return this.getUserByUsername(username) !== null;
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers() {
    return Array.from(users.values()).map(user => this.sanitizeUser(user));
  }

  /**
   * Get user count
   */
  getUserCount() {
    return users.size;
  }

  /**
   * Remove sensitive data from user object
   */
  sanitizeUser(user) {
    if (!user) return null;

    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  /**
   * Seed default admin user (development only)
   */
  async seedDefaultUser(authService) {
    if (users.size > 0) return; // Only seed if no users exist

    console.log('🌱 Seeding default admin user...');
    
    // This will be called from authService to avoid circular dependency
    const defaultUser = {
      email: 'admin@aidoc.local',
      username: 'admin',
      password: 'Machten@007', // Changed via quickPasswordReset.js
      role: 'admin'
    };

    try {
      const result = await authService.register(defaultUser);
      
    //   // Mask password for security - show only first 2 characters
    //   const maskedPassword = defaultUser.password.substring(0, 2) + '*'.repeat(Math.max(0, defaultUser.password.length - 2));
      
      console.log('✅ Default admin user created:', result.user.email);
      console.log('   Username:', result.user.username);
      console.log('   Password:', defaultUser.password, '⚠️  CHANGE THIS!');
      console.log('   API Key:', result.user.apiKey);
      return result.user;
    } catch (error) {
      console.error('❌ Failed to seed default user:', error.message);
    }
  }

  /**
   * Clear all data (test/development only)
   */
  clearAll() {
    users.clear();
    apiKeys.clear();
    refreshTokens.clear();
    console.log('🧹 All user data cleared');
  }
}

// Export singleton instance
export const userService = new UserService();
