import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hashPassword, comparePassword, checkPasswordStrength } from './adminService';

describe('Password Functions', () => {
  describe('hashPassword', () => {
    it('should hash a password', () => {
      const password = 'TestPassword123!';
      const hash = hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('should produce different hashes for same password', () => {
      const password = 'TestPassword123!';
      const hash1 = hashPassword(password);
      const hash2 = hashPassword(password);
      
      expect(hash1).not.toBe(hash2); // Different salts
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', () => {
      const password = 'TestPassword123!';
      const hash = hashPassword(password);
      
      expect(comparePassword(password, hash)).toBe(true);
    });

    it('should return false for incorrect password', () => {
      const password = 'TestPassword123!';
      const hash = hashPassword(password);
      
      expect(comparePassword('WrongPassword', hash)).toBe(false);
    });

    it('should handle legacy unhashed passwords', () => {
      const password = 'PlainTextPassword';
      
      // Legacy comparison (password not hashed)
      expect(comparePassword(password, password)).toBe(true);
      expect(comparePassword('Wrong', password)).toBe(false);
    });
  });

  describe('checkPasswordStrength', () => {
    it('should give low score for weak password', () => {
      const result = checkPasswordStrength('abc');
      
      expect(result.score).toBeLessThan(3);
      expect(result.label).toBe('Weak');
    });

    it('should give high score for strong password', () => {
      const result = checkPasswordStrength('MyStr0ng!P@ssw0rd');
      
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(['Good', 'Strong', 'Very Strong']).toContain(result.label);
    });

    it('should provide suggestions for weak passwords', () => {
      const result = checkPasswordStrength('short');
      
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });
});
