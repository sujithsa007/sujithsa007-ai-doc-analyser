/**
 * 🔐 Authentication Service
 * 
 * Handles user authentication and authorization:
 * - User registration with validation
 * - Login with bcrypt password verification
 * - JWT token generation and refresh
 * - Password hashing and validation
 * - Session management
 * 
 * Security Features:
 * - Bcrypt password hashing with salt rounds
 * - Strong password requirements
 * - Email and username validation
 * - Duplicate prevention
 * - Rate limiting ready
 */

import bcrypt from 'bcryptjs';
import { userService } from './userService.js';
import { generateTokens, refreshTokens as refreshJWTTokens } from '../middleware/auth.js';

// Bcrypt configuration
const SALT_ROUNDS = 12; // Higher = more secure but slower (10-12 recommended)

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false // Optional for better UX
};

/**
 * Authentication Service Class
 */
class AuthService {
  /**
   * 📝 Register a new user
   */
  async register(userData) {
    try {
      const { email, username, password, role } = userData;

      // Validate required fields
      if (!email || !username || !password) {
        throw new Error('Email, username, and password are required');
      }

      // Validate email format
      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Validate username format
      if (!this.validateUsername(username)) {
        throw new Error('Username must be 3-20 characters, alphanumeric with underscores/dashes');
      }

      // Validate password strength
      const passwordValidation = this.validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // Check if user already exists
      if (userService.emailExists(email)) {
        throw new Error('Email already registered');
      }

      if (userService.usernameExists(username)) {
        throw new Error('Username already taken');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const user = userService.createUser({
        email: email.toLowerCase(),
        username,
        passwordHash,
        role: role || 'user'
      });

      // Generate tokens
      const tokens = generateTokens(user);

      // Store refresh token
      userService.storeRefreshToken(tokens.refreshToken, user.id);

      console.log(`✅ New user registered: ${user.email}`);

      return {
        user,
        ...tokens
      };
    } catch (error) {
      console.error('❌ Registration error:', error.message);
      throw error;
    }
  }

  /**
   * 🔑 Login existing user
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Validate required fields
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Find user by email
      const user = userService.getUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const validPassword = await this.verifyPassword(password, user.passwordHash);
      if (!validPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      userService.updateLastLogin(user.id);

      // Generate tokens
      const tokens = generateTokens(user);

      // Store refresh token
      userService.storeRefreshToken(tokens.refreshToken, user.id);

      console.log(`✅ User logged in: ${user.email}`);

      return {
        user: userService.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      console.error('❌ Login error:', error.message);
      throw error;
    }
  }

  /**
   * 🔄 Refresh access token
   */
  async refresh(refreshToken) {
    try {
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Validate refresh token exists in storage
      const userId = userService.validateRefreshToken(refreshToken);
      if (!userId) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new tokens
      const tokens = refreshJWTTokens(refreshToken);

      // Store new refresh token
      userService.storeRefreshToken(tokens.refreshToken, userId);

      // Revoke old refresh token
      userService.revokeRefreshToken(refreshToken);

      console.log(`🔄 Tokens refreshed for user: ${userId}`);

      return tokens;
    } catch (error) {
      console.error('❌ Token refresh error:', error.message);
      throw error;
    }
  }

  /**
   * 🚪 Logout user
   */
  async logout(refreshToken) {
    try {
      if (refreshToken) {
        const revoked = userService.revokeRefreshToken(refreshToken);
        if (revoked) {
          console.log('✅ User logged out successfully');
          return { success: true, message: 'Logged out successfully' };
        }
      }
      return { success: false, message: 'No active session found' };
    } catch (error) {
      console.error('❌ Logout error:', error.message);
      throw error;
    }
  }

  /**
   * 🚪 Logout from all devices
   */
  async logoutAll(userId) {
    try {
      const revokedCount = userService.revokeAllRefreshTokens(userId);
      console.log(`✅ Logged out from ${revokedCount} devices`);
      return {
        success: true,
        message: `Logged out from ${revokedCount} device(s)`
      };
    } catch (error) {
      console.error('❌ Logout all error:', error.message);
      throw error;
    }
  }

  /**
   * 🔒 Change password
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Get user
      const user = userService.getUserByEmail(
        userService.getUserById(userId)?.email
      );
      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const validPassword = await this.verifyPassword(oldPassword, user.passwordHash);
      if (!validPassword) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.message);
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      const updated = userService.updatePassword(userId, newPasswordHash);
      if (!updated) {
        throw new Error('Failed to update password');
      }

      // Revoke all existing sessions
      userService.revokeAllRefreshTokens(userId);

      console.log(`✅ Password changed for user: ${user.email}`);

      return {
        success: true,
        message: 'Password changed successfully. Please login again.'
      };
    } catch (error) {
      console.error('❌ Change password error:', error.message);
      throw error;
    }
  }

  /**
   * 🔐 Hash password using bcrypt
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * ✅ Verify password against hash
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * 📧 Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 👤 Validate username format
   */
  validateUsername(username) {
    // 3-20 characters, alphanumeric with underscores and dashes
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  }

  /**
   * 🔒 Validate password strength
   */
  validatePassword(password) {
    const errors = [];

    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    }

    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }

    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }

    if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('one number');
    }

    if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('one special character');
    }

    if (errors.length > 0) {
      return {
        valid: false,
        message: `Password must contain ${errors.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * 📊 Get password requirements for client
   */
  getPasswordRequirements() {
    return PASSWORD_REQUIREMENTS;
  }
}

// Export singleton instance
export const authService = new AuthService();
